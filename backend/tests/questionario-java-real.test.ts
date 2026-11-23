import test from "node:test";
import assert from "node:assert/strict";
import {createConnection} from "node:net";
import {configuracaoJava} from "../src/config/java";
import {validarQuestionarioNoJava, RespostasValidacaoQuestionario} from "../src/services/validacao-java.service";
const data=new Date("2026-11-16T12:00:00Z");
const id="000000000000000000000001";
const base:RespostasValidacaoQuestionario={portePropriedade:"pequena",quantidadeCulturas:"1",culturasIds:[id],problemasFrequentes:["pragas"],frequenciaProblemas:"raramente",identificaProblemasSozinho:"sim"};
test("Questionário: regras pelo Java real",async t=>{
 const casos:Array<[string,Partial<RespostasValidacaoQuestionario>,number]>=[
  ["válido",{},0],
  ["campos ausentes",{portePropriedade:undefined,quantidadeCulturas:undefined,culturasIds:undefined,problemasFrequentes:undefined,frequenciaProblemas:undefined,identificaProblemasSozinho:undefined},7],
  ["listas vazias",{culturasIds:[],problemasFrequentes:[]},2],
  ["culturas ausentes com outra",{culturasIds:undefined,outraCultura:"Cultura"},1],
  ["somente outra",{culturasIds:[],outraCultura:"Cultura"},0],
  ["ambas",{outraCultura:"Cultura"},0],
  ["outra vazia com culturas",{outraCultura:""},1],
  ["outra espaços com culturas",{outraCultura:"\uFEFF\u00a0\u2003"},1],
  ["outra vazia sem culturas",{culturasIds:[],outraCultura:""},2],
  ["outra inválida sem culturas",{culturasIds:[],outraCultura:"a".repeat(151)},2],
  ["outra mínimo",{outraCultura:"🌱"},0],
  ["outra máximo Unicode",{outraCultura:"🌱".repeat(150)},0],
  ["outra excesso Unicode",{outraCultura:"🌱".repeat(151)},1],
  ["outra combinantes",{outraCultura:"a\u0301".repeat(75)},0],
  ["escapes",{outraCultura:" Café\\n\t\r\nFim\\ "},0],
  ["culturas duplicadas",{culturasIds:[id,id]},1],
  ["50 culturas",{culturasIds:Array.from({length:50},(_,i)=>(i+1).toString(16).padStart(24,"0"))},0],
  ["51 culturas",{culturasIds:Array.from({length:51},(_,i)=>(i+1).toString(16).padStart(24,"0"))},1],
  ["sem comparação de quantidade",{quantidadeCulturas:"4_ou_mais",culturasIds:[],outraCultura:"Hortaliças"},0],
  ["problemas ausentes",{problemasFrequentes:undefined},1],
  ["problemas vazios",{problemasFrequentes:[]},1],
  ["problemas duplicados",{problemasFrequentes:["pragas","pragas"]},1],
  ["problema inválido",{problemasFrequentes:["outro"]},1],
  ["problema vazio",{problemasFrequentes:[""]},1],
  ["não identificado combinado",{problemasFrequentes:["nao_identificado","pragas"]},1],
  ["três problemas",{problemasFrequentes:["pragas","doencas","nao_identificado"]},2],
 ];
 const enums={portePropriedade:["pequena","media","grande"],quantidadeCulturas:["1","2","3","4_ou_mais"],frequenciaProblemas:["raramente","as_vezes","frequentemente","sempre"],identificaProblemasSozinho:["sim","nao","as_vezes"]};
 for(const [campo,valores] of Object.entries(enums)){
  for(const valor of valores)casos.push([`${campo} ${valor}`,{[campo]:valor},0]);
  for(const valor of ["","INVALIDO"," "+valores[0]+" "])casos.push([`${campo} inválido ${valor}`,{[campo]:valor},1]);
 }
 for(const problemasFrequentes of [["pragas"],["doencas"],["nao_identificado"],["pragas","doencas"],["doencas","pragas"]])casos.push([problemasFrequentes.join(","),{problemasFrequentes},0]);
 for(const [nome,patch,n] of casos)await t.test(nome,async()=>{
  const respostas={...base,...patch},antes=structuredClone(respostas);
  const r=await validarQuestionarioNoJava(respostas,{versao:"teste-simulacao",concluidoEm:data});
  assert.equal(r.erros.length,n);assert.equal(r.valido,n===0);assert.deepEqual(respostas,antes);
 });
 for(const [versao,n] of [["",1],["\uFEFF\u2003",1],["a",0],["🌱".repeat(30),0],["🌱".repeat(31),1],["a\u0301".repeat(15),0]] as const)
  await t.test("versão "+versao.length,async()=>assert.equal((await validarQuestionarioNoJava(base,{versao,concluidoEm:data})).erros.length,n));
 await t.test("conclusão futura permitida",async()=>assert.equal((await validarQuestionarioNoJava(base,{versao:"teste",concluidoEm:new Date("2099-01-01T00:00:00Z")})).valido,true));
 await assert.rejects(validarQuestionarioNoJava(base,{versao:"teste",concluidoEm:new Date(NaN)}),/instante válido/);
});

test("Questionário: contagens, marcadores e recuperação na mesma conexão",async()=>{
 const p=["VALIDAR_QUESTIONARIO","teste","pequena","1","1","1","0","","1","1","raramente","sim",data.toISOString(),id,"pragas"];
 const pedidos:Array<[string,string]>=[];const invalido="ERRO\tPedido de validação inválido.";
 pedidos.push([p.slice(0,-1).join("\t"),invalido],[[...p,"extra"].join("\t"),invalido]);
 for(const i of [4,6,8]){const a=[...p];a[i]="2";pedidos.push([a.join("\t"),invalido]);}
 for(const i of [4,8]){const a=[...p];a[i]="0";pedidos.push([a.join("\t"),invalido]);}
 const outra=[...p];outra[7]="texto";pedidos.push([outra.join("\t"),invalido]);
 for(const i of [5,9])for(const valor of ["-1","01","abc","2147483647","2147483648","999999999999999999999"]){const a=[...p];a[i]=valor;pedidos.push([a.join("\t"),invalido]);}
 for(const escape of ["\\q","\\"]){const a=[...p];a[1]=escape;pedidos.push([a.join("\t"),invalido]);}
 for(const valor of ["invalida","2026-02-30T00:00:00Z","2026-11-16","2026-11-16T12:00:00+00:00"]){const a=[...p];a[12]=valor;pedidos.push([a.join("\t"),"ERRO\tA data de conclusão deve ser um instante ISO válido em UTC."]);}
 const semData=[...p];semData[12]="";pedidos.push([semData.join("\t"),"ERRO\tA data de conclusão é obrigatória."]);
 pedidos.push([p.join("\t"),"OK"],["VALIDAR_TALHAO\tNorte\t1","OK"],["VALIDAR_PROPRIEDADE\tNome\tCidade\tSP\t\t0\t","OK"],[`VALIDAR_PLANTACAO\t0\t\t0\t\t\t\tativa\t\t0\t\t${data.toISOString()}`,"OK"],[`VALIDAR_OCORRENCIA\tpraga\t0\t${data.toISOString()}\tSintomas\talta\t\taberta\t\t0\t\t${data.toISOString()}\t0\t0`,"OK"],[`VALIDAR_MONITORAMENTO\t0\t${data.toISOString()}\t0\tObservações\t0\t\t0\t\t\t\t${data.toISOString()}\t0\t0`,"OK"],[`VALIDAR_TRATAMENTO\tmanual\tDescrição\t${data.toISOString()}\t\t0\t\t\t0\t\t0\t\t0\t\t${data.toISOString()}\t0\t0`,"OK"],[`VALIDAR_AVALIACAO_TRATAMENTO\t${data.toISOString()}\tinconclusivo\tTexto\t${data.toISOString()}`,"OK"]);
 const socket=createConnection(configuracaoJava());
 try{await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{socket.destroy();reject(new Error("TIMEOUT"));},5000);let buffer=Buffer.alloc(0),indice=0;
 socket.on("error",e=>{clearTimeout(timer);reject(e);});socket.on("data",chunk=>{buffer=Buffer.concat([buffer,chunk]);let i;while((i=buffer.indexOf(10))>=0){const linha=buffer.subarray(0,i).toString("utf8").replace(/\r$/,"");buffer=buffer.subarray(i+1);try{assert.equal(linha,pedidos[indice++][1]);}catch(e){clearTimeout(timer);reject(e);return;}if(indice===pedidos.length){clearTimeout(timer);resolve();}}});socket.once("connect",()=>socket.write(pedidos.map(x=>x[0]+"\n").join("")));});}finally{socket.destroy();}
});
