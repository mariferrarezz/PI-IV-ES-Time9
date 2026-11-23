import test from "node:test";
import assert from "node:assert/strict";
import {createConnection} from "node:net";
import {configuracaoJava} from "../src/config/java";
import {validarCadastroPerfilNoJava,validarOpcionaisPerfilNoJava,CamposValidacaoCadastroPerfil,CamposValidacaoOpcionaisPerfil} from "../src/services/validacao-java.service";
const data=new Date("2099-01-01T00:00:00Z");
const cadastro={nomeCompleto:"Pessoa Fictícia",cpf:"52998224725",telefoneCanonico:"+5519999999999",canalCodigoPreferido:"email"};
const foto={url:"https://example.com/foto",publicId:" pasta\\id\t ",enviadaEm:data};
test("Perfil: cadastro pelo Java real",async t=>{
 const casos:Array<[string,Partial<CamposValidacaoCadastroPerfil>,number]>=[
  ["email",{},0],["sms",{canalCodigoPreferido:"sms"},0],
  ["todos ausentes",{nomeCompleto:undefined,cpf:undefined,telefoneCanonico:undefined,canalCodigoPreferido:undefined},4],
  ["acúmulo",{nomeCompleto:"",cpf:"0000000000",telefoneCanonico:"abc",canalCodigoPreferido:"EMAIL"},4],
  ["nome Unicode",{nomeCompleto:"🌱".repeat(150)},0],["nome excedido",{nomeCompleto:"🌱".repeat(151)},1],
  ["CPF com 11 dígitos",{cpf:"52998224724"},0],
  ["CPF repetido",{cpf:"11111111111"},0],
  ["CPF com 10 dígitos",{cpf:"1111111111"},1],
  ["CPF com 12 dígitos",{cpf:"111111111111"},1],
  ["canal vazio",{canalCodigoPreferido:""},1],["canal com espaços",{canalCodigoPreferido:" email "},1],
  // O formato e a lista oficial não comprovam existência ou posse do número.
  ["DDD inexistente",{telefoneCanonico:"+5500999999999"},1],
 ];
 for(const telefoneCanonico of ["","+551999999999","+55199999999999","5519999999999","+5419999999999","+5519899999999","+55 (19) 99999-9999"," +5519999999999","+5519999999999 ","+55١٩٩٩٩٩٩٩٩٩٩","+551999999999a"])
  casos.push(["telefone inválido "+telefoneCanonico.length,{telefoneCanonico},1]);
 for(const [nome,patch,n] of casos)await t.test(nome,async()=>{const campos={...cadastro,...patch},antes={...campos};const r=await validarCadastroPerfilNoJava(campos);assert.equal(r.erros.length,n);assert.equal(r.valido,n===0);assert.deepEqual(campos,antes);});
});
test("Perfil: opcionais pelo Java real",async t=>{
 const casos:Array<[string,CamposValidacaoOpcionaisPerfil,number]>=[
  ["ambos ausentes",{},0],["nome vazio",{nomePublico:""},1],["espaços Unicode",{nomePublico:"\uFEFF\u2003"},1],
  ["curto",{nomePublico:"🌱"},1],["mínimo",{nomePublico:"🌱🌱"},0],["máximo",{nomePublico:"🌱".repeat(80)},0],
  ["excesso",{nomePublico:"🌱".repeat(81)},1],["combinantes",{nomePublico:"a\u0301".repeat(40)},0],
  ["sem trim",{nomePublico:" A"},0],["escapes",{nomePublico:"Nome\\n\t\r\nFim\\"},0],
  ["foto válida envio futuro",{fotoPerfil:foto},0],["publicId preservado",{fotoPerfil:{...foto,legenda:"A\\n\t\r\n"}},0],
  ["URL inválida",{fotoPerfil:{...foto,url:"http://example.com/a"}},1],
  ["URL limite",{fotoPerfil:{...foto,url:"https://example.com/"+"a".repeat(2028)}},0],
  ["URL excesso",{fotoPerfil:{...foto,url:"https://example.com/"+"a".repeat(2029)}},1],
  ["publicId vazio",{fotoPerfil:{...foto,publicId:""}},1],["publicId espaços",{fotoPerfil:{...foto,publicId:"\u00a0"}},1],
  ["legenda vazia",{fotoPerfil:{...foto,legenda:""}},1],["legenda limite",{fotoPerfil:{...foto,legenda:"🌱".repeat(300)}},0],
  ["legenda excesso",{fotoPerfil:{...foto,legenda:"🌱".repeat(301)}},1],
  ["erros simultâneos",{nomePublico:"",fotoPerfil:{...foto,url:"",publicId:"",legenda:""}},4],
 ];
 for(const [nome,campos,n] of casos)await t.test(nome,async()=>{const antes=structuredClone(campos);const r=await validarOpcionaisPerfilNoJava(campos);assert.equal(r.erros.length,n);assert.equal(r.valido,n===0);assert.deepEqual(campos,antes);});
 await assert.rejects(validarOpcionaisPerfilNoJava({fotoPerfil:{...foto,enviadaEm:new Date(NaN)}}),/instante válido/);
});
test("Perfil: protocolo inválido e recuperação",async()=>{
 const c=["VALIDAR_CADASTRO_PERFIL","Pessoa","52998224725","+5519999999999","sms"];
 const p=["VALIDAR_OPCIONAIS_PERFIL","0","","0","","","0","",""];
 const pedidos:Array<[string,string]>=[];const invalido="ERRO\tPedido de validação inválido.";
 for(const base of [c,p]){pedidos.push([base.slice(0,-1).join("\t"),invalido],[[...base,"extra"].join("\t"),invalido]);for(const escape of ["\\q","\\"]){const a=[...base];a[2]=escape;pedidos.push([a.join("\t"),invalido]);}}
 for(const i of [1,3,6]){const a=[...p];a[i]="2";pedidos.push([a.join("\t"),invalido]);}
 for(const i of [2,4,5,7,8]){const a=[...p];a[i]="texto";pedidos.push([a.join("\t"),invalido]);}
 const ausente=[...p];ausente[6]="1";pedidos.push([ausente.join("\t"),invalido]);
 const f=[...p];f[3]="1";f[4]=foto.url;f[5]="id";
 pedidos.push([f.join("\t"),"ERRO\tA data de envio da imagem é obrigatória."]);
 for(const valor of ["invalida","2026-02-30T00:00:00Z","2026-11-16","2026-11-16T12:00:00+00:00"]){const a=[...f];a[8]=valor;pedidos.push([a.join("\t"),"ERRO\tA data de envio da imagem deve ser um instante ISO válido em UTC."]);}
 const vazios=["VALIDAR_CADASTRO_PERFIL","","","",""];pedidos.push([vazios.join("\t"),"ERRO\tO nome completo é obrigatório.\tO CPF é obrigatório.\tO telefone é obrigatório.\tO canal de código é obrigatório e deve ser email ou sms."]);
 pedidos.push([p.join("\t"),"OK"],[c.join("\t"),"OK"],["VALIDAR_TALHAO\tNorte\t1","OK"],["VALIDAR_PROPRIEDADE\tNome\tCidade\tSP\t\t0\t","OK"]);
 const socket=createConnection(configuracaoJava());
 try{await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{socket.destroy();reject(new Error("TIMEOUT"));},5000);let buffer=Buffer.alloc(0),indice=0;
 socket.on("error",e=>{clearTimeout(timer);reject(e);});socket.on("data",chunk=>{buffer=Buffer.concat([buffer,chunk]);let i;while((i=buffer.indexOf(10))>=0){const linha=buffer.subarray(0,i).toString("utf8").replace(/\r$/,"");buffer=buffer.subarray(i+1);try{assert.equal(linha,pedidos[indice++][1]);}catch(e){clearTimeout(timer);reject(e);return;}if(indice===pedidos.length){clearTimeout(timer);resolve();}}});socket.once("connect",()=>socket.write(pedidos.map(x=>x[0]+"\n").join("")));});}finally{socket.destroy();}
});
