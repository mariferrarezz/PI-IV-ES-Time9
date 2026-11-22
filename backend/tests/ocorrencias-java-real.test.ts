import test from "node:test";
import assert from "node:assert/strict";
import {createConnection} from "node:net";
import {configuracaoJava} from "../src/config/java";
import {validarOcorrenciaNoJava, CamposValidacaoOcorrencia} from "../src/services/validacao-java.service";
const agora=new Date("2026-11-15T12:00:00Z");
const base:CamposValidacaoOcorrencia={tipo:"praga",problemaAgricolaPresente:false,dataObservacao:agora,
  sintomas:"Folhas alteradas",intensidade:"alta",status:"aberta"};
const imagem={url:"https://example.com/foto.jpg",publicId:" pasta\\foto\t ",enviadaEm:agora};
test("Ocorrência: regras pelo Java real",async t=>{
 const casos:Array<[string,Partial<CamposValidacaoOcorrencia>,number]>=[
  ["válida",{},0], ["imagens vazias",{imagens:[]},0],
  ["campos obrigatórios",{tipo:"",intensidade:"",status:"",sintomas:"",dataObservacao:undefined},5],
  ["sem escala numérica",{intensidade:"5"},1],
  ...["baixa","media","alta"].map(intensidade=>[intensidade,{intensidade},0] as [string,Partial<CamposValidacaoOcorrencia>,number]),
  ["não identificado",{tipo:"nao_identificado",problemaAgricolaPresente:true},1],
  ["limite Unicode",{sintomas:"🌱".repeat(5000)},0],
  ["acima Unicode",{sintomas:"🌱".repeat(5001)},1],
  ["espaços",{sintomas:"\uFEFF\u2003"},1],
  ["observação futura",{dataObservacao:new Date(agora.getTime()+1)},1],
  ["encerrada incompleta",{status:"encerrada"},2],
  ["encerramento igual",{status:"encerrada",encerradoEm:agora,motivoEncerramento:"Finalizado"},0],
  ["encerramento futuro permitido",{status:"encerrada",encerradoEm:new Date("2027-01-01T00:00:00Z"),motivoEncerramento:"Finalizado"},0],
  ["encerramento anterior",{status:"encerrada",encerradoEm:new Date(agora.getTime()-1),motivoEncerramento:"Finalizado"},1],
  ["motivo vazio",{status:"encerrada",encerradoEm:agora,motivoEncerramento:""},1],
  ["motivo máximo",{status:"encerrada",encerradoEm:agora,motivoEncerramento:"🌱".repeat(5000)},0],
  ["motivo excedido",{status:"encerrada",encerradoEm:agora,motivoEncerramento:"a".repeat(5001)},1],
  ["campos proibidos",{motivoEncerramento:""},1],
  ...[0,-1,NaN,Infinity,-Infinity,"abc"].map(areaAfetadaHa=>["área "+areaAfetadaHa,{areaAfetadaHa},1] as [string,Partial<CamposValidacaoOcorrencia>,number]),
  ["área positiva",{areaAfetadaHa:0.1},0],
  ["foto com escapes",{imagens:[{...imagem,legenda:"A\\n\t\r\nB"}]},0],
  ["legenda vazia",{imagens:[{...imagem,legenda:""}]},1],
  ["legenda máxima",{imagens:[{...imagem,legenda:"🌱".repeat(300)}]},0],
  ["legenda excedida",{imagens:[{...imagem,legenda:"🌱".repeat(301)}]},1],
  ["URL inválida",{imagens:[{...imagem,url:"http://example.com/foto"}]},1],
  ["URL máxima",{imagens:[{...imagem,url:"https://example.com/"+"a".repeat(2028)}]},0],
  ["URL excedida",{imagens:[{...imagem,url:"https://example.com/"+"a".repeat(2030)}]},1],
  ["publicId vazio",{imagens:[{...imagem,publicId:"\u00a0"}]},1],
  ["publicId repetido",{imagens:[imagem,{...imagem}]},1],
  ["publicId sem trim",{imagens:[imagem,{...imagem,publicId:imagem.publicId.trim()}]},0],
  ["cinco fotos",{imagens:Array.from({length:5},(_,i)=>({...imagem,publicId:String(i)}))},0],
  ["seis fotos",{imagens:Array.from({length:6},(_,i)=>({...imagem,publicId:String(i)}))},1],
 ];
 for(const [nome,patch,n] of casos)await t.test(nome,async()=>{
  const campos={...base,...patch};const antes=structuredClone(campos);
  const r=await validarOcorrenciaNoJava(campos,agora);
  assert.equal(r.erros.length,n);assert.equal(r.valido,n===0);assert.deepEqual(campos,antes);
 });
 await assert.rejects(validarOcorrenciaNoJava(base,new Date(NaN)),/instante válido/);
 await assert.rejects(validarOcorrenciaNoJava({...base,imagens:[{...imagem,enviadaEm:new Date(NaN)}]},agora),/instante válido/);
});

test("Ocorrência: malformados, datas e recuperação na mesma conexão",async()=>{
 const p=["VALIDAR_OCORRENCIA","praga","0",agora.toISOString(),"Sintomas","media","","aberta","","0","",agora.toISOString(),"0","0"];
 const pedidos:Array<[string,string]>=[];const invalido="ERRO\tPedido de validação inválido.";
 pedidos.push([p.slice(0,-1).join("\t"),invalido],[[...p,"extra"].join("\t"),invalido]);
 for(const i of [2,9,12]){const a=[...p];a[i]="2";pedidos.push([a.join("\t"),invalido]);}
 for(const n of ["-1","01","abc","99999999999999999999","1"]){const a=[...p];a[13]=n;pedidos.push([a.join("\t"),invalido]);}
 for(const escape of ["\\q","\\"]){const a=[...p];a[4]=escape;pedidos.push([a.join("\t"),invalido]);}
 const motivo=[...p];motivo[10]="texto";pedidos.push([motivo.join("\t"),invalido]);
 for(const i of [3,8,11]){const a=[...p];a[i]="2026-02-30T00:00:00Z";const nome=i===3?"A data de observação":i===8?"A data de encerramento":"O instante de referência";pedidos.push([a.join("\t"),`ERRO\t${nome} deve ser um instante ISO válido em UTC.`]);}
 const foto=[...p];foto[12]="1";foto[13]="1";foto.push("https://example.com/a","id","0","","invalida");pedidos.push([foto.join("\t"),"ERRO\tA data de envio da imagem deve ser um instante ISO válido em UTC."]);
 foto[16]="2";pedidos.push([foto.join("\t"),invalido]);
 pedidos.push([p.join("\t"),"OK"],["VALIDAR_TALHAO\tNorte\t1","OK"],["VALIDAR_PROPRIEDADE\tNome\tCidade\tSP\t\t0\t","OK"],[`VALIDAR_PLANTACAO\t0\t\t0\t\t\t\tativa\t\t0\t\t${agora.toISOString()}`,"OK"]);
 const socket=createConnection(configuracaoJava());
 try{await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{socket.destroy();reject(new Error("TIMEOUT"));},5000);let buffer=Buffer.alloc(0),indice=0;
 socket.on("error",e=>{clearTimeout(timer);reject(e);});
 socket.on("data",chunk=>{buffer=Buffer.concat([buffer,chunk]);let i;while((i=buffer.indexOf(10))>=0){const linha=buffer.subarray(0,i).toString("utf8").replace(/\r$/,"");buffer=buffer.subarray(i+1);try{assert.equal(linha,pedidos[indice++][1]);}catch(e){clearTimeout(timer);reject(e);return;}if(indice===pedidos.length){clearTimeout(timer);resolve();}}});
 socket.once("connect",()=>socket.write(pedidos.map(x=>x[0]+"\n").join("")));});}finally{socket.destroy();}
});
