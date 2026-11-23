import test from "node:test";
import assert from "node:assert/strict";
import {createConnection} from "node:net";
import {configuracaoJava} from "../src/config/java";
import {validarTratamentoNoJava, CamposValidacaoTratamento} from "../src/services/validacao-java.service";
const agora=new Date("2026-11-16T12:00:00Z");
const base:CamposValidacaoTratamento={tipoMedida:"outra",descricao:"Medida realizada",dataAplicacao:agora};
const imagem={url:"https://example.com/foto",publicId:" pasta\\id\t ",enviadaEm:agora};
test("Tratamento: campos, Unicode e datas pelo Java real",async t=>{
 const casos:Array<[string,Partial<CamposValidacaoTratamento>,number]>=[
  ["ausentes opcionais",{},0],
  ["obrigatórios ausentes",{tipoMedida:undefined,descricao:undefined,dataAplicacao:undefined},3],
  ["enum inválido",{tipoMedida:"QUIMICA"},1],
  ...["manual","cultural","biologica","quimica","outra"].map(tipoMedida=>[tipoMedida,{tipoMedida},0] as [string,Partial<CamposValidacaoTratamento>,number]),
  ["aplicação futura",{dataAplicacao:new Date(agora.getTime()+1)},1],
  ["aplicação passada",{dataAplicacao:new Date(agora.getTime()-1)},0],
  ["quantidade sem unidade",{quantidadeUtilizada:1},1],
  ["unidade sem quantidade",{unidadeQuantidade:"litros"},1],
  ["unidade livre sem conversão",{quantidadeUtilizada:0.000000001,unidadeQuantidade:"unidade livre"},0],
  ["sem teto",{areaTratadaHa:Number.MAX_VALUE,quantidadeUtilizada:Number.MAX_VALUE,unidadeQuantidade:"u"},0],
  ["responsável mínimo",{responsavelAplicacao:"Áa"},0],
  ["responsável curto Unicode",{responsavelAplicacao:"🌱"},1],
  ["responsável combinante",{responsavelAplicacao:"a\u0301"},0],
  ["escapes",{descricao:"Texto\\n\t\r\nFim\\",produtoUtilizado:"Produto\\t\t"},0],
  ["imagens vazias",{imagens:[]},0],
  ["imagem futura",{imagens:[{...imagem,legenda:"A\\n\t\r\n",enviadaEm:new Date(agora.getTime()+1)}]},0],
  ["URL inválida",{imagens:[{...imagem,url:"http://example.com/a"}]},1],
  ["publicId vazio",{imagens:[{...imagem,publicId:"\uFEFF"}]},1],
  ["duplicação",{imagens:[imagem,{...imagem}]},1],
  ["sem trim",{imagens:[imagem,{...imagem,publicId:imagem.publicId.trim()}]},0],
  ["legenda vazia",{imagens:[{...imagem,legenda:""}]},1],
  ["cinco imagens",{imagens:Array.from({length:5},(_,i)=>({...imagem,publicId:String(i)}))},0],
  ["seis imagens",{imagens:Array.from({length:6},(_,i)=>({...imagem,publicId:String(i)}))},1],
 ];
 for(const [campo,limite] of [["descricao",5000],["produtoUtilizado",200],["unidadeQuantidade",30],["responsavelAplicacao",150],["observacoes",5000]] as const){
  const extra=campo==="unidadeQuantidade"?{quantidadeUtilizada:1}:{};
  for(const [nome,valor,n] of [["vazio","",1],["espaços","\uFEFF\u2003",1],["limite","🌱".repeat(limite),0],["excesso","🌱".repeat(limite+1),1]] as const)
   casos.push([`${campo} ${nome}`,{...extra,[campo]:valor},n]);
 }
 for(const n of [0,-1,NaN,Infinity,-Infinity,"abc"]){
  casos.push(["área "+n,{areaTratadaHa:n},1]);
  casos.push(["quantidade "+n,{quantidadeUtilizada:n,unidadeQuantidade:"u"},1]);
 }
 for(const [nome,patch,n] of casos)await t.test(nome,async()=>{
  const campos={...base,...patch},antes=structuredClone(campos);
  const r=await validarTratamentoNoJava(campos,agora);
  assert.equal(r.erros.length,n);assert.equal(r.valido,n===0);assert.deepEqual(campos,antes);
 });
 await assert.rejects(validarTratamentoNoJava(base,new Date(NaN)),/instante válido/);
 await assert.rejects(validarTratamentoNoJava({...base,dataAplicacao:new Date(NaN)},agora),/instante válido/);
});

test("Tratamento: protocolo, marcadores, datas e recuperação",async()=>{
 const p=["VALIDAR_TRATAMENTO","manual","Descrição",agora.toISOString(),"","0","","","0","","0","","0","",agora.toISOString(),"0","0"];
 const pedidos:Array<[string,string]>=[];const invalido="ERRO\tPedido de validação inválido.";
 pedidos.push([p.slice(0,-1).join("\t"),invalido],[[...p,"extra"].join("\t"),invalido]);
 for(const i of [5,8,10,12,15]){const a=[...p];a[i]="false";pedidos.push([a.join("\t"),invalido]);}
 for(const i of [6,9,11,13]){const a=[...p];a[i]="texto";pedidos.push([a.join("\t"),invalido]);}
 for(const n of ["-1","01","abc","99999999999999999999","1"]){const a=[...p];a[16]=n;pedidos.push([a.join("\t"),invalido]);}
 for(const e of ["\\q","\\"]){const a=[...p];a[2]=e;pedidos.push([a.join("\t"),invalido]);}
 const semRef=[...p];semRef[14]="";pedidos.push([semRef.join("\t"),"ERRO\tO instante de referência é obrigatório."]);
 const semData=[...p];semData[3]="";pedidos.push([semData.join("\t"),"ERRO\tA data de aplicação é obrigatória."]);
 for(const i of [3,14])for(const valor of ["2026-02-30T00:00:00Z","2026-11-16","2026-11-16T12:00:00+00:00"]){const a=[...p];a[i]=valor;const nome=i===3?"A data de aplicação":"O instante de referência";pedidos.push([a.join("\t"),`ERRO\t${nome} deve ser um instante ISO válido em UTC.`]);}
 const foto=[...p];foto[15]="1";foto[16]="1";foto.push("https://example.com/a","id","0","","invalida");pedidos.push([foto.join("\t"),"ERRO\tA data de envio da imagem deve ser um instante ISO válido em UTC."]);
 foto[19]="2";pedidos.push([foto.join("\t"),invalido]);
 foto[19]="0";foto[20]="texto";pedidos.push([foto.join("\t"),invalido]);
 foto[20]="";foto[21]="";pedidos.push([foto.join("\t"),"ERRO\tA data de envio da imagem é obrigatória."]);
 foto[21]=agora.toISOString();foto[15]="0";pedidos.push([foto.join("\t"),invalido]);
 pedidos.push([p.join("\t"),"OK"],["VALIDAR_TALHAO\tNorte\t1","OK"],["VALIDAR_PROPRIEDADE\tNome\tCidade\tSP\t\t0\t","OK"],[`VALIDAR_PLANTACAO\t0\t\t0\t\t\t\tativa\t\t0\t\t${agora.toISOString()}`,"OK"],[`VALIDAR_OCORRENCIA\tpraga\t0\t${agora.toISOString()}\tSintomas\talta\t\taberta\t\t0\t\t${agora.toISOString()}\t0\t0`,"OK"],[`VALIDAR_MONITORAMENTO\t0\t${agora.toISOString()}\t0\tObservações\t0\t\t0\t\t\t\t${agora.toISOString()}\t0\t0`,"OK"]);
 const socket=createConnection(configuracaoJava());
 try{await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{socket.destroy();reject(new Error("TIMEOUT"));},5000);let buffer=Buffer.alloc(0),indice=0;
 socket.on("error",e=>{clearTimeout(timer);reject(e);});socket.on("data",chunk=>{buffer=Buffer.concat([buffer,chunk]);let i;while((i=buffer.indexOf(10))>=0){const linha=buffer.subarray(0,i).toString("utf8").replace(/\r$/,"");buffer=buffer.subarray(i+1);try{assert.equal(linha,pedidos[indice++][1]);}catch(e){clearTimeout(timer);reject(e);return;}if(indice===pedidos.length){clearTimeout(timer);resolve();}}});socket.once("connect",()=>socket.write(pedidos.map(x=>x[0]+"\n").join("")));});}finally{socket.destroy();}
});
