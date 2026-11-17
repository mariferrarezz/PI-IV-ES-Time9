import test from "node:test";
import assert from "node:assert/strict";
import {createConnection} from "node:net";
import {configuracaoJava} from "../src/config/java";
import {validarAvaliacaoTratamentoNoJava, CamposValidacaoAvaliacaoTratamento} from "../src/services/validacao-java.service";
const agora=new Date("2026-11-16T12:00:00Z");
const base:CamposValidacaoAvaliacaoTratamento={dataAvaliacao:agora,resultado:"inconclusivo",observacoes:"Texto"};
test("Avaliação de tratamento: regras pelo Java real",async t=>{
 const casos:Array<[string,Partial<CamposValidacaoAvaliacaoTratamento>,number]>=[
  ["válido",{},0],
  ["ausentes",{dataAvaliacao:undefined,resultado:undefined,observacoes:undefined},3],
  ["vazios",{resultado:"",observacoes:""},2],
  ...["melhora_observada","sem_mudanca","piora_observada","inconclusivo"].map(resultado=>[resultado,{resultado},0] as [string,Partial<CamposValidacaoAvaliacaoTratamento>,number]),
  ["enum inválido",{resultado:"INCONCLUSIVO"},1],
  ["enum com espaços",{resultado:" inconclusivo "},1],
  ["espaços",{observacoes:" "},1],
  ["espaços Unicode",{observacoes:"\uFEFF\u00a0\u2003"},1],
  ["só espaços acima do limite",{observacoes:" ".repeat(5001)},1],
  ["mínimo",{observacoes:"á"},0],
  ["mínimo suplementar",{observacoes:"🌱"},0],
  ["máximo",{observacoes:"a".repeat(5000)},0],
  ["máximo suplementar",{observacoes:"🌱".repeat(5000)},0],
  ["excesso",{observacoes:"🌱".repeat(5001)},1],
  ["combinantes",{observacoes:"a\u0301".repeat(2500)},0],
  ["acentos e escapes",{observacoes:" Árvore 2!\\n\t\r\nFim\\ "},0],
  ["anterior",{dataAvaliacao:new Date(agora.getTime()-1)},0],
  ["igual",{dataAvaliacao:agora},0],
  ["posterior",{dataAvaliacao:new Date(agora.getTime()+1)},1],
  ["acúmulo",{dataAvaliacao:new Date(agora.getTime()+1),resultado:"outro",observacoes:""},3],
 ];
 for(const [nome,patch,n] of casos)await t.test(nome,async()=>{
  const campos={...base,...patch},antes=structuredClone(campos);
  const r=await validarAvaliacaoTratamentoNoJava(campos,agora);
  assert.equal(r.erros.length,n);assert.equal(r.valido,n===0);assert.deepEqual(campos,antes);
 });
 await assert.rejects(validarAvaliacaoTratamentoNoJava(base,new Date(NaN)),/instante válido/);
 await assert.rejects(validarAvaliacaoTratamentoNoJava(base,undefined as any),/instante válido/);
 await assert.rejects(validarAvaliacaoTratamentoNoJava({...base,dataAvaliacao:new Date(NaN)},agora),/instante válido/);
});
test("Avaliação: protocolo malformado e recuperação na mesma conexão",async()=>{
 const p=["VALIDAR_AVALIACAO_TRATAMENTO",agora.toISOString(),"inconclusivo","Texto",agora.toISOString()];
 const pedidos:Array<[string,string]>=[];const invalido="ERRO\tPedido de validação inválido.";
 pedidos.push([p.slice(0,-1).join("\t"),invalido],[[...p,"extra"].join("\t"),invalido]);
 for(const escape of ["\\q","\\"]){const a=[...p];a[3]=escape;pedidos.push([a.join("\t"),invalido]);}
 for(const i of [1,4])for(const valor of ["invalida","2026-02-30T00:00:00Z","2026-11-16","2026-11-16T12:00:00+00:00"]){
  const a=[...p];a[i]=valor;const campo=i===1?"A data de avaliação":"O instante de referência";
  pedidos.push([a.join("\t"),`ERRO\t${campo} deve ser um instante ISO válido em UTC.`]);
 }
 const vazios=[...p];vazios[1]="";vazios[2]="";vazios[3]="";vazios[4]="";
 pedidos.push([vazios.join("\t"),"ERRO\tO instante de referência é obrigatório.\tA data de avaliação é obrigatória.\tO resultado é obrigatório e deve ser melhora_observada, sem_mudanca, piora_observada ou inconclusivo.\tAs observações são obrigatórias."]);
 const ref=[...p];ref[4]="";pedidos.push([ref.join("\t"),"ERRO\tO instante de referência é obrigatório."]);
 pedidos.push([p.join("\t"),"OK"],["VALIDAR_TALHAO\tNorte\t1","OK"],["VALIDAR_PROPRIEDADE\tNome\tCidade\tSP\t\t0\t","OK"],[`VALIDAR_PLANTACAO\t0\t\t0\t\t\t\tativa\t\t0\t\t${agora.toISOString()}`,"OK"],[`VALIDAR_OCORRENCIA\tpraga\t0\t${agora.toISOString()}\tSintomas\talta\t\taberta\t\t0\t\t${agora.toISOString()}\t0\t0`,"OK"],[`VALIDAR_MONITORAMENTO\t0\t${agora.toISOString()}\t0\tObservações\t0\t\t0\t\t\t\t${agora.toISOString()}\t0\t0`,"OK"],[`VALIDAR_TRATAMENTO\tmanual\tDescrição\t${agora.toISOString()}\t\t0\t\t\t0\t\t0\t\t0\t\t${agora.toISOString()}\t0\t0`,"OK"]);
 const socket=createConnection(configuracaoJava());
 try{await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{socket.destroy();reject(new Error("TIMEOUT"));},5000);let buffer=Buffer.alloc(0),indice=0;
 socket.on("error",e=>{clearTimeout(timer);reject(e);});socket.on("data",chunk=>{buffer=Buffer.concat([buffer,chunk]);let i;while((i=buffer.indexOf(10))>=0){const linha=buffer.subarray(0,i).toString("utf8").replace(/\r$/,"");buffer=buffer.subarray(i+1);try{assert.equal(linha,pedidos[indice++][1]);}catch(e){clearTimeout(timer);reject(e);return;}if(indice===pedidos.length){clearTimeout(timer);resolve();}}});socket.once("connect",()=>socket.write(pedidos.map(x=>x[0]+"\n").join("")));});}finally{socket.destroy();}
});
