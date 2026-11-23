import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync, spawn, ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Apenas banco de teste explicitamente nomeado. A configuração normal não é alterada.
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const bancoTeste = 'sentinela_test';
const rodada = randomUUID();
if (!process.argv.includes('--executar')) throw new Error('USE --executar');
if (!process.env.MONGODB_URI?.startsWith('mongodb+srv://')) throw new Error('ATLAS_EXPLICITO_OBRIGATORIO');
if (!/^(localhost|127\.0\.0\.1):9099$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '')) throw new Error('EMULATOR_LOCAL_OBRIGATORIO');
const projeto = process.env.FIREBASE_PROJECT_ID;
assert(projeto);
const idsUsuarios = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];
const idsPropriedades = Array.from({length: 5}, () => new mongoose.Types.ObjectId());
const idsTalhoes = new Set<string>();
const tokens: string[] = [];
const uids: string[] = [];
let java: ChildProcess | undefined;
let server: import('node:http').Server | undefined;
let db: import('mongoose').mongo.Db | undefined;
let escritas = false;
const resultados: Record<string, string> = {};
let etapa = 'inicializacao';
function validator(nome: string) {
  const fonte = fs.readFileSync(path.resolve(__dirname, `../../database/validators/validar-${nome}.mongodb.js`), 'utf8');
  let comando: any;
  vm.runInNewContext(fonte, { use() {}, db: { runCommand(c: unknown) { comando = c; } } }, { timeout: 1000 });
  assert.equal(comando.collMod, nome);
  return { validator: comando.validator, validationLevel: comando.validationLevel, validationAction: comando.validationAction };
}
function canonical(value: any): any {
  if (Array.isArray(value)) return Array.from(value, canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]));
  return value;
}
async function main() {
  try {
    etapa = 'conexao_teste';
    await mongoose.connect(process.env.MONGODB_URI!, {dbName: bancoTeste, autoCreate:false, autoIndex:false, serverSelectionTimeoutMS:7000});
    assert.equal(mongoose.connection.name, bancoTeste);
    db = mongoose.connection.db!;
    assert.equal(db.databaseName, bancoTeste);
    etapa = 'estrutura';
    const existentes = await db.listCollections().toArray();
    // Coleções preexistentes são aceitas somente com os validadores esperados.
    for (const nome of ['usuarios','propriedades','talhoes']) {
      const anterior = existentes.find(x => x.name === nome);
      if (anterior) {
        assert.equal(anterior.type, 'collection');
        const esperado = validator(nome);
        assert.deepEqual(canonical(anterior.options.validator), canonical(esperado.validator));
        assert.equal(anterior.options.validationLevel ?? 'strict', esperado.validationLevel);
        assert.equal(anterior.options.validationAction ?? 'error', esperado.validationAction);
      }
    }
    for (const nome of ['usuarios','propriedades','talhoes']) if (!existentes.some(x => x.name === nome)) await db.createCollection(nome, validator(nome));
    for (const [colecao, campo, nome, unique] of [['usuarios','firebaseUid','uq_usuarios_firebaseUid',true],['propriedades','usuarioId','ix_propriedades_usuarioId',false],['talhoes','propriedadeId','ix_talhoes_propriedadeId',false]] as const) {
      const indices = await db.collection(colecao).indexes();
      const existente = indices.find(i => i.name === nome);
      if (existente) { assert.deepEqual(existente.key,{[campo]:1}); assert.equal(Boolean(existente.unique),unique); assert(!existente.sparse && !existente.partialFilterExpression); }
      else await db.collection(colecao).createIndex({[campo]:1},{name:nome,...(unique?{unique:true}:{})});
    }
    console.log(JSON.stringify({evento:'estrutura_conferida', banco:bancoTeste, colecoes:['usuarios','propriedades','talhoes']}));
    etapa = 'firebase_emulator';
    for (let i=0;i<2;i++) {
      const res = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:`teste-${rodada}-${i}@example.test`,password:`Teste-${rodada}`,returnSecureToken:true})});
      assert.equal(res.status,200); const conta = await res.json() as {localId:string,idToken:string};
      uids.push(conta.localId); tokens.push(conta.idToken);
    }
    etapa = 'fixtures';
    for (const id of idsUsuarios) assert.equal(await db.collection('usuarios').countDocuments({_id:id}),0);
    for (const id of idsPropriedades) {
      assert.equal(await db.collection('propriedades').countDocuments({_id:id}),0);
      assert.equal(await db.collection('talhoes').countDocuments({propriedadeId:id}),0);
    }
    escritas = true;
    const agora = new Date();
    for (let i=0;i<2;i++) await db.collection('usuarios').insertOne({_id:idsUsuarios[i],firebaseUid:uids[i],nomeCompleto:'Pessoa Teste',cpf:i?'12345678902':'12345678901',telefone:i?'+5511999999992':'+5511999999991',termos:{versao:'1',aceitoEm:agora},criadoEm:agora,atualizadoEm:agora});
    for (let i=0;i<5;i++) await db.collection('propriedades').insertOne({_id:idsPropriedades[i],usuarioId:idsUsuarios[i===1?1:0],nome:`Teste ${rodada} ${i}`,municipio:'Cidade',estado:'SP',areaTotalHa:i===4?1:10,ativa:i!==2,criadoEm:agora,atualizadoEm:agora});
    etapa = 'java';
    const pasta = path.resolve(__dirname,'../../servidor-java/out/validacao-atual');
    const listar = (dir:string):string[] => fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?listar(path.join(dir,x.name)):x.name.endsWith('.java')?[path.join(dir,x.name)]:[]);
    fs.mkdirSync(pasta,{recursive:true});
    execFileSync('javac',['-encoding','UTF-8','-d',pasta,...listar(path.resolve(__dirname,'../../servidor-java/src/main/java'))],{timeout:30000});
    process.env.JAVA_HOST='127.0.0.1'; process.env.JAVA_PORT='17017';
    java=spawn('java',['-cp',pasta,'sentinela.servidor.Servidor','17017'],{windowsHide:true,stdio:['ignore','pipe','ignore']});
    await Promise.race([new Promise<void>((resolve,reject)=>{java!.stdout!.on('data',b=>{if(String(b).includes('Servidor aguardando'))resolve();});java!.once('exit',()=>reject(new Error('JAVA_FALHOU')));}),new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error('JAVA_TIMEOUT')),10000))]);
    etapa = 'api';
    const {criarApp} = await import('../src/app');
    const {criarTalhoesService} = await import('../src/modules/talhoes/talhoes.service');
    const {talhoesRepository} = await import('../src/modules/talhoes/talhoes.repository');
    const {PropriedadeModel} = await import('../src/modules/propriedades/propriedades.model');
    let leituras=0, tentativas=0; let liberar!:()=>void;
    const barreira = new Promise<void>(r=>liberar=r);
    const svc=criarTalhoesService({...talhoesRepository,async reservarPropriedade(id,usuario,session){
      if(id.equals(idsPropriedades[4])) { tentativas++; if(leituras<2) { assert(await PropriedadeModel.findOne({_id:id,usuarioId:usuario},null,{session}).lean()); leituras++; if(leituras===2)liberar(); await Promise.race([barreira,new Promise((_,reject)=>setTimeout(()=>reject(new Error('BARREIRA_TIMEOUT')),15000))]); } }
      return talhoesRepository.reservarPropriedade(id,usuario,session);
    }});
    server=criarApp({bancoDisponivel:()=>mongoose.connection.readyState===1&&mongoose.connection.name===bancoTeste,talhoesService:svc}).listen(0,'127.0.0.1');
    await once(server,'listening'); const porta=(server.address() as import('node:net').AddressInfo).port;
    async function req(id:mongoose.Types.ObjectId, method:string, body?:unknown, token: string | null=tokens[0]) {
      const r=await fetch(`http://127.0.0.1:${porta}/propriedades/${id}/talhoes`,{method,headers:{...(token?{Authorization:`Bearer ${token}`} : {}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
      const dados=await r.json() as any; if(method==='POST'&&r.status===201)idsTalhoes.add(dados._id); return {status:r.status,dados};
    }
    async function caso(nome:string, f:()=>Promise<void>) { etapa=nome; await f(); resultados[nome]='aprovado'; }
    await caso('listagem vazia',async()=>{const r=await req(idsPropriedades[0],'GET');assert.equal(r.status,200);assert.deepEqual(r.dados,[]);});
    await caso('sem token e token invalido',async()=>{assert.equal((await req(idsPropriedades[0],'GET',undefined,null)).status,401);assert.equal((await req(idsPropriedades[0],'GET',undefined,'invalido')).status,401);});
    await caso('autorizacao e inexistente',async()=>{assert.equal((await req(idsPropriedades[1],'POST',{nome:'Teste',areaHa:1})).status,404);assert.equal((await req(new mongoose.Types.ObjectId(),'GET')).status,404);});
    await caso('propriedade inativa',async()=>{assert.equal((await req(idsPropriedades[2],'POST',{nome:'Teste',areaHa:1})).status,409);});
    await caso('area invalida',async()=>{for(const area of [undefined,0,-1,'x'])assert.equal((await req(idsPropriedades[0],'POST',{nome:'Teste',...(area===undefined?{}:{areaHa:area})})).status,400);});
    await caso('cadastro valido',async()=>{assert.equal((await req(idsPropriedades[0],'POST',{nome:'Ativo',areaHa:4})).status,201);});
    await caso('inativo e limite exato',async()=>{assert.equal((await req(idsPropriedades[0],'POST',{nome:'Inativo',areaHa:9,ativo:false})).status,201);assert.equal((await req(idsPropriedades[0],'POST',{nome:'Limite',areaHa:6})).status,201);});
    await caso('area excedida',async()=>{assert.equal((await req(idsPropriedades[0],'POST',{nome:'Excesso',areaHa:1})).status,409);});
    await caso('listagem e isolamento',async()=>{assert.equal((await req(idsPropriedades[1],'POST',{nome:'Outro',areaHa:1},tokens[1])).status,201);const r=await req(idsPropriedades[0],'GET');assert.equal(r.status,200);assert.equal(r.dados.length,3);assert(r.dados.some((x:any)=>x.ativo===false));assert(r.dados.every((x:any)=>x.propriedadeId===String(idsPropriedades[0])));assert.equal((await req(idsPropriedades[1],'GET')).status,404);});
    await caso('cadastros concorrentes',async()=>{const r=await Promise.all([req(idsPropriedades[4],'POST',{nome:'A',areaHa:0.6}),req(idsPropriedades[4],'POST',{nome:'B',areaHa:0.6})]);assert.deepEqual(r.map(x=>x.status).sort(),[201,409]);assert.equal(leituras,2);assert(tentativas>=3);assert.equal(await db!.collection('talhoes').countDocuments({propriedadeId:idsPropriedades[4],ativo:true}),1);console.log(JSON.stringify({evento:'concorrencia',leituras,tentativas}));});
  } catch(e) { resultados[etapa]='falhou'; console.log(JSON.stringify({evento:'falha',etapa,tipo:(e as Error).name,codigo:(e as any).code || null})); process.exitCode=1; }
  finally {
    server?.closeAllConnections(); if(server) await new Promise<void>(r=>server!.close(()=>r())); java?.kill();
    if(db && escritas) try {
      assert.equal(db.databaseName,bancoTeste);
      const docs=await db.collection('talhoes').find({propriedadeId:{$in:idsPropriedades}},{projection:{_id:1,propriedadeId:1}}).toArray();
      for(const d of docs) await db.collection('talhoes').deleteOne({_id:d._id,propriedadeId:d.propriedadeId});
      for(let i=0;i<idsPropriedades.length;i++)await db.collection('propriedades').deleteOne({_id:idsPropriedades[i],nome:`Teste ${rodada} ${i}`});
      for(let i=0;i<idsUsuarios.length;i++)await db.collection('usuarios').deleteOne({_id:idsUsuarios[i],firebaseUid:uids[i]});
      assert.equal(await db.collection('talhoes').countDocuments({propriedadeId:{$in:idsPropriedades}}),0);
      assert.equal(await db.collection('propriedades').countDocuments({_id:{$in:idsPropriedades}}),0);
      assert.equal(await db.collection('usuarios').countDocuments({_id:{$in:idsUsuarios}}),0);
      console.log(JSON.stringify({evento:'limpeza_confirmada',rodada,usuarios:idsUsuarios.map(String),propriedades:idsPropriedades.map(String),talhoes:docs.map(d=>String(d._id))}));
    } catch(e) { process.exitCode=1; console.log(JSON.stringify({evento:'limpeza_falhou',rodada,tipo:(e as Error).name})); }
    for(const token of tokens)try {const r=await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:delete?key=demo`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idToken:token})});if(!r.ok)throw new Error();}catch{process.exitCode=1;console.log(JSON.stringify({evento:'limpeza_conta_falhou'}));}
    await mongoose.disconnect(); console.log(JSON.stringify({rodada,resultados}));
  }
}
void main();
