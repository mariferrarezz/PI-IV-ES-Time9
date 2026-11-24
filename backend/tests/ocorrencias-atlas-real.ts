import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { comJavaLocal } from './java-teste-local';

dotenv.config({path:path.resolve(__dirname,'../.env')});
assert(process.argv.includes('--executar'));
assert(process.env.MONGODB_URI?.startsWith('mongodb+srv://'));
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
const rodada = randomUUID();
const ids = Array.from({length: 12},()=>new mongoose.Types.ObjectId());
const [u1,u2,p1,p2,t1,t2,c1,c2,pl1,pl2,problema,fonte] = ids;
const tokens:string[]=[];
const criados = new Set<string>();
let servidor: import('node:http').Server | undefined;
let etapa = 'conexao';
const data = new Date();
const colecoes=['usuarios','propriedades','talhoes','culturas','plantacoes','problemas_agricolas','ocorrencias','alertas'];
function validator(nome:string) {
  let comando:any;
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,`../../database/validators/validar-${nome}.mongodb.js`),'utf8'),
    {use(){},db:{runCommand(c:unknown){comando=c;}}});
  return {validator:comando.validator,validationLevel:comando.validationLevel,validationAction:comando.validationAction};
}
function canonical(v:any):any { if(Array.isArray(v))return Array.from(v,canonical); if(v && typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])); return v; }
async function main() {
 try {
  await mongoose.connect(process.env.MONGODB_URI!,{dbName:'sentinela_test',autoCreate:false,autoIndex:false,serverSelectionTimeoutMS:10000});
  const db=mongoose.connection.db!; assert.equal(db.databaseName,'sentinela_test');
  etapa='estrutura';
  const existentes=await db.listCollections().toArray();
  for(const nome of colecoes) {
    const anterior=existentes.find(c=>c.name===nome), esperado=validator(nome);
    if(anterior) { assert.equal(anterior.type,'collection'); assert.deepEqual(canonical(anterior.options.validator),canonical(esperado.validator)); assert.equal(anterior.options.validationLevel??'strict',esperado.validationLevel); assert.equal(anterior.options.validationAction??'error',esperado.validationAction); }
    else await db.createCollection(nome,esperado);
  }
  if(!existentes.some(c=>c.name==='operacoes_idempotentes')) await db.createCollection('operacoes_idempotentes');
  const indices:any[]=[
   ['usuarios',{firebaseUid:1},{name:'uq_usuarios_firebaseUid',unique:true}],
   ['propriedades',{usuarioId:1},{name:'ix_propriedades_usuarioId'}],
   ['talhoes',{propriedadeId:1},{name:'ix_talhoes_propriedadeId'}],
   ['plantacoes',{talhaoId:1,safra:1,status:1},{name:'ix_plantacoes_talhao_safra_status'}],
   ['plantacoes',{talhaoId:1},{name:'uq_plantacoes_talhao_ativa',unique:true,partialFilterExpression:{status:'ativa'}}],
   ['problemas_agricolas',{culturasAfetadasIds:1,tipo:1},{name:'ix_problemas_culturas_tipo'}],
   ['ocorrencias',{plantacaoId:1,dataObservacao:-1,_id:-1},{name:'ix_ocorrencias_plantacao_data'}],
   ['alertas',{usuarioId:1,criadoEm:-1,_id:-1},{name:'ix_alertas_usuario_data'}],
   ['alertas',{tipo:1,'contexto.tipo':1,'contexto.id':1},{name:'uq_alertas_evento_ocorrencia',unique:true,partialFilterExpression:{tipo:'ocorrencia_intensidade_alta','contexto.tipo':'ocorrencia'}}],
  ];
  for(const [col,key,opt] of indices) {
    const index=(await db.collection(col).indexes()).find(i=>i.name===opt.name);
    if(index) { assert.deepEqual(index.key,key); assert.equal(!!index.unique,!!opt.unique); assert.deepEqual(canonical(index.partialFilterExpression),canonical(opt.partialFilterExpression)); }
    else await db.collection(col).createIndex(key,opt);
  }
  console.log('ESTRUTURA_OK');
  etapa='emulator';
  for(let i=0;i<2;i++) {
   const r=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:`ocorrencia-${rodada}-${i}@example.test`,password:rodada,returnSecureToken:true})});
   assert.equal(r.status,200); const a=await r.json() as any; tokens.push(a.idToken);
  }
  const uid=(t:string)=>JSON.parse(Buffer.from(t.split('.')[1],'base64url').toString()).sub as string;
  etapa='fixtures';
  for(let i=0;i<2;i++) await db.collection('usuarios').insertOne({_id:[u1,u2][i],firebaseUid:uid(tokens[i]),nomeCompleto:'Pessoa Teste',cpf:i?'12345678902':'12345678901',telefone:i?'+5511999999992':'+5511999999991',termos:{versao:'1',aceitoEm:data},criadoEm:data,atualizadoEm:data});
  for(const [id,usuarioId] of [[p1,u1],[p2,u2]]) await db.collection('propriedades').insertOne({_id:id,usuarioId,nome:`Teste ${rodada}`,municipio:'Cidade',estado:'SP',ativa:true,criadoEm:data,atualizadoEm:data});
  for(const [id,propriedadeId] of [[t1,p1],[t2,p2]]) await db.collection('talhoes').insertOne({_id:id,propriedadeId,nome:'Talhão teste',areaHa:10,ativo:true,criadoEm:data,atualizadoEm:data});
  for(const id of [c1,c2]) await db.collection('culturas').insertOne({_id:id,nome:`Teste ${rodada}`,ativa:true,criadoEm:data,atualizadoEm:data});
  await db.collection('plantacoes').insertMany([{_id:pl1,talhaoId:t1,culturaId:c1,areaPlantadaHa:5,status:'ativa',criadoEm:data,atualizadoEm:data},{_id:pl2,talhaoId:t2,culturaId:c2,status:'encerrada',dataEncerramento:data,criadoEm:data,atualizadoEm:data}]);
  await db.collection('problemas_agricolas').insertOne({_id:problema,nomeComum:'Teste',tipo:'praga',descricao:'Teste',culturasAfetadasIds:[c2],sintomas:['Teste'],medidasPreventivas:['Teste'],formasControle:[{tipo:'manual',descricao:'Teste'}],fontesIds:[fonte],ativo:true,revisaoEditorial:{status:'aprovada'},revisadoEm:data,criadoEm:data,atualizadoEm:data});
  etapa='java_e_api';
  await comJavaLocal(async()=>{
   const {criarApp}=await import('../src/app');
   servidor=criarApp({bancoDisponivel:()=>mongoose.connection.name==='sentinela_test'}).listen(0,'127.0.0.1'); await once(servidor,'listening');
   const porta=(servidor.address() as import('node:net').AddressInfo).port;
   async function req(rota:string,token:string,body?:any,chave?:string) { const r=await fetch(`http://127.0.0.1:${porta}${rota}`,{method:body?'POST':'GET',headers:{authorization:`Bearer ${token}`,...(body?{'content-type':'application/json'}:{}),...(chave?{'Idempotency-Key':chave}:{})},...(body?{body:JSON.stringify(body)}:{})}); return {status:r.status,body:await r.json() as any}; }
   const rota=`/plantacoes/${pl1}/ocorrencias`, body={tipo:'praga',dataObservacao:data.toISOString(),sintomas:'Folhas alteradas',intensidade:'alta'};
   const caso=async(nome:string,f:()=>Promise<void>)=>{etapa=nome;await f();console.log('OK '+nome);};
   await caso('autorizacao',async()=>assert.equal((await req(rota,tokens[1],body)).status,404));
   await caso('encerrada',async()=>assert.equal((await req(`/plantacoes/${pl2}/ocorrencias`,tokens[1],body)).status,409));
   await caso('vinculo_incompativel',async()=>assert.equal((await req(rota,tokens[0],{...body,problemaAgricolaId:String(problema)})).status,400));
   await caso('vinculo_compativel',async()=>{
    await db.collection('problemas_agricolas').updateOne({_id:problema},{$set:{culturasAfetadasIds:[c1]}});
    const r=await req(rota,tokens[0],{...body,intensidade:'baixa',problemaAgricolaId:String(problema)},randomUUID().replaceAll('-',''));
    assert.equal(r.status,201); assert.equal(r.body.problemaAgricolaId,String(problema)); criados.add(r.body._id);
   });
   await caso('validacao_java',async()=>assert.equal((await req(rota,tokens[0],{...body,sintomas:''})).status,400));
   await caso('area_excedida',async()=>assert.equal((await req(rota,tokens[0],{...body,areaAfetadaHa:6})).status,409));
   await caso('cadastro_alta_concorrente_e_resposta_perdida',async()=>{
    const chave=randomUUID().replaceAll('-','');
    const respostas=await Promise.all([req(rota,tokens[0],body,chave),req(rota,tokens[0],body,chave)]);
    assert.deepEqual(respostas.map(r=>r.status),[201,201]); const id=respostas[0].body._id; assert.equal(respostas[1].body._id,id); criados.add(id);
    const replay=await req(rota,tokens[0],body,chave); assert.equal(replay.status,201); assert.equal(replay.body._id,id);
    assert.equal((await req(rota,tokens[0],{...body,sintomas:'Outro'},chave)).status,409);
    assert.equal(await db.collection('ocorrencias').countDocuments({_id:new mongoose.Types.ObjectId(id)}),1);
    assert.equal(await db.collection('alertas').countDocuments({'contexto.id':new mongoose.Types.ObjectId(id),usuarioId:u1,prioridade:'alta'}),1);
    const lista = await req(rota,tokens[0]); assert.equal(lista.status,200); assert(lista.body.some((o:any)=>o._id===id));
    assert.equal((await req(rota,tokens[1])).status,404);
    assert.equal((await req(`/plantacoes/${pl2}/ocorrencias`,tokens[1])).status,200);
    const detalhe = await req(`/talhoes/${t1}/detalhe`,tokens[0]); assert.equal(detalhe.status,200);
    assert.equal(detalhe.body.propriedade._id,String(p1)); assert(detalhe.body.plantacoes.some((p:any)=>p._id===String(pl1)&&p.ocorrencias.some((o:any)=>o._id===id)));
    assert.equal((await req(`/talhoes/${t1}/detalhe`,tokens[1])).status,404);
    const historico = await req(`${rota}/${id}/historico`,tokens[0]); assert.equal(historico.status,200); assert.equal(historico.body.ocorrencia._id,id);
    assert.equal((await req(`${rota}/${id}/historico`,tokens[1])).status,404);
    assert.equal((await req(`/plantacoes/${pl2}/ocorrencias/${id}/historico`,tokens[1])).status,404);
   });
   await caso('baixa_media_e_home',async()=>{
    for(const intensidade of ['baixa','media']) {const r=await req(rota,tokens[0],{...body,intensidade},randomUUID().replaceAll('-',''));assert.equal(r.status,201);criados.add(r.body._id);assert.equal(await db.collection('alertas').countDocuments({'contexto.id':new mongoose.Types.ObjectId(r.body._id)}),0);}
    const h=await req('/home/resumo',tokens[0]); assert.equal(h.status,200);assert.equal(h.body.propriedade.id,String(p1));assert.equal(h.body.talhoes,1);assert.equal(h.body.alertasAtivos,1);
   });
  });
 } catch(e) {console.error('FALHA '+etapa, e);process.exitCode=1;}
 finally {
  if(servidor){servidor.closeAllConnections();await new Promise<void>(r=>servidor!.close(()=>r()));}
  const db=mongoose.connection.db;
  if(db?.databaseName==='sentinela_test') {
   const ocorrencias=await db.collection('ocorrencias').find({plantacaoId:pl1},{projection:{_id:1}}).toArray();
   const oids=ocorrencias.map(o=>o._id);
   await db.collection('alertas').deleteMany({'contexto.id':{$in:oids}});
   await db.collection('operacoes_idempotentes').deleteMany({'resposta.plantacaoId':pl1});
   await db.collection('ocorrencias').deleteMany({plantacaoId:pl1});
   await db.collection('plantacoes').deleteMany({_id:{$in:[pl1,pl2]}});
   await db.collection('problemas_agricolas').deleteOne({_id:problema});
   await db.collection('culturas').deleteMany({_id:{$in:[c1,c2]}});
   await db.collection('talhoes').deleteMany({_id:{$in:[t1,t2]}});
   await db.collection('propriedades').deleteMany({_id:{$in:[p1,p2]}});
   await db.collection('usuarios').deleteMany({_id:{$in:[u1,u2]}});
   assert.equal(await db.collection('ocorrencias').countDocuments({plantacaoId:pl1}),0);
   assert.equal(await db.collection('alertas').countDocuments({'contexto.id':{$in:oids}}),0);
   assert.equal(await db.collection('operacoes_idempotentes').countDocuments({'resposta.plantacaoId':pl1}),0);
   assert.equal(await db.collection('usuarios').countDocuments({_id:{$in:[u1,u2]}}),0);
   console.log('LIMPEZA_MONGO_OK '+rodada);
  }
  for(const token of tokens) {const r=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:delete?key=demo',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idToken:token})});if(!r.ok){console.error('LIMPEZA_EMULATOR_FALHOU');process.exitCode=1;}}
  await mongoose.disconnect();
 }
}
void main();
