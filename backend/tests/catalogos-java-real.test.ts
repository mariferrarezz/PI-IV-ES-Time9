import test from "node:test";
import assert from "node:assert/strict";
import {createConnection} from "node:net";
import {configuracaoJava} from "../src/config/java";
import {validarCulturaNoJava,validarFonteConhecimentoNoJava,CamposValidacaoCultura,CamposValidacaoFonteConhecimento} from "../src/services/validacao-java.service";
const ref=new Date("2026-11-16T12:00:00Z"),antes=new Date(ref.getTime()-1),depois=new Date(ref.getTime()+1);
const imagem={url:"https://example.com/a",publicId:" pasta\\id\t ",enviadaEm:depois};
test("Cultura: regras pelo Java real",async t=>{
 const casos:Array<[string,CamposValidacaoCultura,number]>=[
  ["ausentes",{},2],["false",{nome:"Milho",ativa:false},0],["true",{nome:"Milho",ativa:true},0],
  ["opcionais vazios",{nome:"Milho",ativa:true,nomeCientifico:"",descricao:""},2],
  ["espaços",{nome:"\uFEFF\u2003",ativa:true},1],
  ["escapes",{nome:"A\\n\t\r\nB",ativa:true,descricao:"Texto\\"},0],
  ["imagem futura",{nome:"Nome",ativa:true,imagem},0],
  ["imagem inválida",{nome:"Nome",ativa:true,imagem:{...imagem,url:"http://example.com/a",publicId:"",legenda:""}},3],
  ["publicId preservado",{nome:"Nome",ativa:false,imagem:{...imagem,legenda:"🌱".repeat(300)}},0],
  ["legenda excedida",{nome:"Nome",ativa:false,imagem:{...imagem,legenda:"🌱".repeat(301)}},1],
 ];
 for(const [campo,max] of [["nome",150],["nomeCientifico",200],["descricao",5000]] as const)
  for(const [rotulo,valor,n] of [["mínimo","🌱",0],["máximo","🌱".repeat(max),0],["excesso","🌱".repeat(max+1),1],["espaços","\u00a0",1]] as const)
   casos.push([campo+rotulo,{nome:"Nome",ativa:true,[campo]:valor},n]);
 for(const [nome,campos,n] of casos)await t.test(nome,async()=>{const copia=structuredClone(campos);const r=await validarCulturaNoJava(campos);assert.equal(r.erros.length,n);assert.equal(r.valido,n===0);assert.deepEqual(campos,copia);});
 await assert.rejects(validarCulturaNoJava({nome:"Nome",ativa:"false" as any}),/booleano/);
 await assert.rejects(validarCulturaNoJava({nome:"Nome",ativa:true,imagem:{...imagem,enviadaEm:new Date(NaN)}}),/instante válido/);
});
test("Fonte: regras pelo Java real",async t=>{
 const base={titulo:"Publicação",instituicaoOuAutor:"Autor"};
 const casos:Array<[string,Partial<CamposValidacaoFonteConhecimento>,number]>=[
  ["opcionais ausentes",{},0],["obrigatórios ausentes",{titulo:undefined,instituicaoOuAutor:undefined},2],
  ["HTTP",{url:"http://example.com/a",acessadoEm:ref},0],["HTTPS",{url:"https://example.com/a",acessadoEm:ref},0],
  ["URL exige acesso",{url:"https://example.com"},1],["acesso sem URL",{acessadoEm:ref},0],
  ["URL vazia",{url:"",acessadoEm:ref},1],
  ["publicação futura",{publicadoEm:depois},1],["acesso futuro",{acessadoEm:depois},1],
  ["passadas",{publicadoEm:antes,acessadoEm:antes},0],["iguais referência",{publicadoEm:ref,acessadoEm:ref},0],
  ["acesso anterior",{publicadoEm:ref,acessadoEm:antes},1],["acesso posterior",{publicadoEm:antes,acessadoEm:ref},0],
  ["acúmulo",{titulo:"",instituicaoOuAutor:"",url:"ftp://example.com",publicadoEm:depois,acessadoEm:ref},5],
  ["escapes",{titulo:"A\\t\t\r\nB",instituicaoOuAutor:"Árvore\\n"},0],
  ["URL máximo",{url:"https://example.com/"+"a".repeat(2028),acessadoEm:ref},0],
  ["URL excedida",{url:"https://example.com/"+"a".repeat(2029),acessadoEm:ref},1],
 ];
 for(const url of ["ftp://example.com","example.com","https://","http://a b"," ","javascript:alert(1)"])
  casos.push(["URL inválida "+url,{url,acessadoEm:ref},1]);
 for(const [campo,max] of [["titulo",300],["instituicaoOuAutor",200]] as const)
  for(const [rotulo,valor,n] of [["mínimo","á",0],["máximo","🌱".repeat(max),0],["excesso","🌱".repeat(max+1),1],["vazio","",1],["espaços","\uFEFF\u2003",1]] as const)
   casos.push([campo+rotulo,{[campo]:valor},n]);
 for(const [nome,patch,n] of casos)await t.test(nome,async()=>{const campos={...base,...patch},copia=structuredClone(campos);const r=await validarFonteConhecimentoNoJava(campos,ref);assert.equal(r.erros.length,n);assert.equal(r.valido,n===0);assert.deepEqual(campos,copia);});
 await assert.rejects(validarFonteConhecimentoNoJava(base,new Date(NaN)),/instante válido/);
 await assert.rejects(validarFonteConhecimentoNoJava({...base,publicadoEm:new Date(NaN)},ref),/instante válido/);
});
test("Catálogos: mensagens malformadas e recuperação",async()=>{
 const c=["VALIDAR_CULTURA","Nome","0","","0","","0","0","","","0","",""];
 const f=["VALIDAR_FONTE_CONHECIMENTO","Título","Autor","0","","","",ref.toISOString()];
 const pedidos:Array<[string,string]>=[],invalido="ERRO\tPedido de validação inválido.";
 for(const p of [c,f]){pedidos.push([p.slice(0,-1).join("\t"),invalido],[[...p,"extra"].join("\t"),invalido]);for(const e of ["\\q","\\"]){const a=[...p];a[1]=e;pedidos.push([a.join("\t"),invalido]);}}
 for(const i of [2,4,6,7,10]){const a=[...c];a[i]="false";pedidos.push([a.join("\t"),invalido]);}
 for(const i of [3,5,8,9,11,12]){const a=[...c];a[i]="texto";pedidos.push([a.join("\t"),invalido]);}
 const ausente=[...c];ausente[10]="1";pedidos.push([ausente.join("\t"),invalido]);
 const semAtiva=[...c];semAtiva[6]="";pedidos.push([semAtiva.join("\t"),"ERRO\tO campo ativa é obrigatório."]);
 const foto=[...c];foto[7]="1";foto[8]=imagem.url;foto[9]="id";pedidos.push([foto.join("\t"),"ERRO\tA data de envio da imagem é obrigatória."]);
 foto[12]="invalida";pedidos.push([foto.join("\t"),"ERRO\tA data de envio da imagem deve ser um instante ISO válido em UTC."]);
 for(const i of [5,6,7])for(const valor of ["invalida","2026-02-30T00:00:00Z","2026-11-16T12:00:00+00:00"]){const a=[...f];a[i]=valor;const nome=i===5?"A data de publicação":i===6?"A data de acesso":"O instante de referência";pedidos.push([a.join("\t"),`ERRO\t${nome} deve ser um instante ISO válido em UTC.`]);}
 const marcador=[...f];marcador[3]="2";pedidos.push([marcador.join("\t"),invalido]);marcador[3]="0";marcador[4]="http://example.com";pedidos.push([marcador.join("\t"),invalido]);
 const semRef=[...f];semRef[7]="";pedidos.push([semRef.join("\t"),"ERRO\tO instante de referência é obrigatório."]);
 pedidos.push([c.join("\t"),"OK"],[f.join("\t"),"OK"],["VALIDAR_TALHAO\tNorte\t1","OK"],["VALIDAR_PROPRIEDADE\tNome\tCidade\tSP\t\t0\t","OK"]);
 const socket=createConnection(configuracaoJava());
 try{await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{socket.destroy();reject(new Error("TIMEOUT"));},5000);let buffer=Buffer.alloc(0),indice=0;
 socket.on("error",e=>{clearTimeout(timer);reject(e);});socket.on("data",chunk=>{buffer=Buffer.concat([buffer,chunk]);let i;while((i=buffer.indexOf(10))>=0){const linha=buffer.subarray(0,i).toString("utf8").replace(/\r$/,"");buffer=buffer.subarray(i+1);try{assert.equal(linha,pedidos[indice++][1]);}catch(e){clearTimeout(timer);reject(e);return;}if(indice===pedidos.length){clearTimeout(timer);resolve();}}});socket.once("connect",()=>socket.write(pedidos.map(x=>x[0]+"\n").join("")));});}finally{socket.destroy();}
});
