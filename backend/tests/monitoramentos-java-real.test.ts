import test from "node:test";
import assert from "node:assert/strict";
import {createConnection} from "node:net";
import {configuracaoJava} from "../src/config/java";
import {validarMonitoramentoNoJava, CamposValidacaoMonitoramento} from "../src/services/validacao-java.service";
const agora=new Date("2026-11-15T12:00:00Z");
const base:CamposValidacaoMonitoramento={ocorrenciaPresente:false,dataObservacao:agora,problemaObservado:false,observacoes:"Inspeção"};
const imagem={url:"https://example.com/foto",publicId:" pasta\\id\t ",enviadaEm:agora};
test("Monitoramento: regras pelo Java real",async t=>{
 const casos:Array<[string,Partial<CamposValidacaoMonitoramento>,number]>=[
  ["false",{},0],["ausente",{problemaObservado:undefined},1],
  ["true sem intensidade",{problemaObservado:true},1],
  ...["baixa","media","alta"].map(intensidade=>[intensidade,{problemaObservado:true,intensidade},0] as [string,Partial<CamposValidacaoMonitoramento>,number]),
  ["intensidade inválida",{problemaObservado:true,intensidade:"5"},1],
  ["intensidade vazia",{problemaObservado:true,intensidade:""},1],
  ["proibidos",{intensidade:"",areaAfetadaHa:1},2],
  ...["melhorou","estavel","piorou","nao_avaliada"].map(evolucao=>["com ocorrência "+evolucao,{ocorrenciaPresente:true,evolucao},0] as [string,Partial<CamposValidacaoMonitoramento>,number]),
  ...["melhorou","estavel","piorou"].map(evolucao=>["sem ocorrência "+evolucao,{evolucao},1] as [string,Partial<CamposValidacaoMonitoramento>,number]),
  ["não avaliada",{evolucao:"nao_avaliada"},0],["evolução vazia",{evolucao:""},1],
  ["observações ausentes",{observacoes:undefined},1],["observações vazias",{observacoes:""},1],
  ["espaços Unicode",{observacoes:"\uFEFF\u2003"},1],
  ["limite Unicode",{observacoes:"🌱".repeat(5000)},0],
  ["excesso Unicode",{observacoes:"🌱".repeat(5001)},1],
  ["combinantes",{observacoes:"a\u0301".repeat(2500)},0],
  ["escapes",{observacoes:"Texto\\n\r\n\tFim\\"},0],
  ["data ausente",{dataObservacao:undefined},1],
  ["data futura",{dataObservacao:new Date(agora.getTime()+1)},1],
  ["próxima igual",{proximaInspecaoEm:agora},1],
  ["próxima anterior",{proximaInspecaoEm:new Date(agora.getTime()-1)},1],
  ["próxima futura",{proximaInspecaoEm:new Date(agora.getTime()+1)},0],
  ["próxima no passado permitida",{dataObservacao:new Date(agora.getTime()-2),proximaInspecaoEm:new Date(agora.getTime()-1)},0],
  ...[0,-1,NaN,Infinity,-Infinity,"abc"].map(areaAfetadaHa=>["área "+areaAfetadaHa,{problemaObservado:true,intensidade:"baixa",areaAfetadaHa},1] as [string,Partial<CamposValidacaoMonitoramento>,number]),
  ["área válida",{problemaObservado:true,intensidade:"media",areaAfetadaHa:0.1},0],
  ["imagens vazias",{imagens:[]},0],
  ["metadados válidos",{imagens:[{...imagem,legenda:"Foto\\n\t\r\n",enviadaEm:new Date(agora.getTime()+1)}]},0],
  ["URL inválida",{imagens:[{...imagem,url:"http://example.com/a"}]},1],
  ["URL limite",{imagens:[{...imagem,url:"https://example.com/"+"a".repeat(2028)}]},0],
  ["URL excesso",{imagens:[{...imagem,url:"https://example.com/"+"a".repeat(2029)}]},1],
  ["publicId espaços",{imagens:[{...imagem,publicId:"\u00a0"}]},1],
  ["duplicação",{imagens:[imagem,{...imagem}]},1],
  ["sem trim",{imagens:[imagem,{...imagem,publicId:imagem.publicId.trim()}]},0],
  ["legenda vazia",{imagens:[{...imagem,legenda:""}]},1],
  ["legenda limite",{imagens:[{...imagem,legenda:"🌱".repeat(300)}]},0],
  ["legenda excesso",{imagens:[{...imagem,legenda:"🌱".repeat(301)}]},1],
  ["cinco imagens",{imagens:Array.from({length:5},(_,i)=>({...imagem,publicId:String(i)}))},0],
  ["seis imagens",{imagens:Array.from({length:6},(_,i)=>({...imagem,publicId:String(i)}))},1],
 ];
 for(const [nome,patch,n] of casos)await t.test(nome,async()=>{
  const campos={...base,...patch},antes=structuredClone(campos);
  const r=await validarMonitoramentoNoJava(campos,agora);
  assert.equal(r.erros.length,n);assert.equal(r.valido,n===0);assert.deepEqual(campos,antes);
 });
 await assert.rejects(validarMonitoramentoNoJava(base,new Date(NaN)),/instante válido/);
 await assert.rejects(validarMonitoramentoNoJava({...base,problemaObservado:null as any},agora),/booleanos/);
});

test("Monitoramento: protocolo malformado e recuperação",async()=>{
 const p=["VALIDAR_MONITORAMENTO","0",agora.toISOString(),"0","Observações","0","","0","","","",agora.toISOString(),"0","0"];
 const pedidos:Array<[string,string]>=[];const invalido="ERRO\tPedido de validação inválido.";
 pedidos.push([p.slice(0,-1).join("\t"),invalido],[[...p,"extra"].join("\t"),invalido]);
 for(const i of [1,3,5,7,12]){const a=[...p];a[i]="false";pedidos.push([a.join("\t"),invalido]);}
 for(const i of [6,8]){const a=[...p];a[i]="texto";pedidos.push([a.join("\t"),invalido]);}
 for(const n of ["-1","01","abc","99999999999999999999","1"]){const a=[...p];a[13]=n;pedidos.push([a.join("\t"),invalido]);}
 for(const e of ["\\q","\\"]){const a=[...p];a[4]=e;pedidos.push([a.join("\t"),invalido]);}
 const semBoolean=[...p];semBoolean[3]="";pedidos.push([semBoolean.join("\t"),"ERRO\tO campo problema observado é obrigatório."]);
 const semRef=[...p];semRef[11]="";pedidos.push([semRef.join("\t"),"ERRO\tO instante de referência é obrigatório."]);
 for(const i of [2,10,11]){const a=[...p];a[i]="2026-02-30T00:00:00Z";const nome=i===2?"A data de observação":i===10?"A próxima inspeção":"O instante de referência";pedidos.push([a.join("\t"),`ERRO\t${nome} deve ser um instante ISO válido em UTC.`]);}
 const foto=[...p];foto[12]="1";foto[13]="1";foto.push("https://example.com/a","id","0","","invalida");pedidos.push([foto.join("\t"),"ERRO\tA data de envio da imagem deve ser um instante ISO válido em UTC."]);
 foto[16]="2";pedidos.push([foto.join("\t"),invalido]);
 foto[16]="0";foto[17]="texto";pedidos.push([foto.join("\t"),invalido]);
 foto[17]="";foto[18]=agora.toISOString();foto[12]="0";pedidos.push([foto.join("\t"),invalido]);
 pedidos.push([p.join("\t"),"OK"],["VALIDAR_TALHAO\tNorte\t1","OK"],["VALIDAR_PROPRIEDADE\tNome\tCidade\tSP\t\t0\t","OK"],[`VALIDAR_PLANTACAO\t0\t\t0\t\t\t\tativa\t\t0\t\t${agora.toISOString()}`,"OK"],[`VALIDAR_OCORRENCIA\tpraga\t0\t${agora.toISOString()}\tSintomas\talta\t\taberta\t\t0\t\t${agora.toISOString()}\t0\t0`,"OK"]);
 const socket=createConnection(configuracaoJava());
 try{await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{socket.destroy();reject(new Error("TIMEOUT"));},5000);let buffer=Buffer.alloc(0),indice=0;
 socket.on("error",e=>{clearTimeout(timer);reject(e);});socket.on("data",chunk=>{buffer=Buffer.concat([buffer,chunk]);let i;while((i=buffer.indexOf(10))>=0){const linha=buffer.subarray(0,i).toString("utf8").replace(/\r$/,"");buffer=buffer.subarray(i+1);try{assert.equal(linha,pedidos[indice++][1]);}catch(e){clearTimeout(timer);reject(e);return;}if(indice===pedidos.length){clearTimeout(timer);resolve();}}});socket.once("connect",()=>socket.write(pedidos.map(x=>x[0]+"\n").join("")));});}finally{socket.destroy();}
});
