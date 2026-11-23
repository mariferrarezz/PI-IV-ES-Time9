import test from "node:test";
import assert from "node:assert/strict";
import { createConnection } from "node:net";
import { configuracaoJava } from "../src/config/java";
import { validarExperienciaComunidadeNoJava as experiencia, validarAdocaoTratamentoNoJava as adocao,
  validarDenunciaComunidadeNoJava as denuncia, validarCadastroPerfilNoJava,
  ExperienciaComunidade, MetadadosExperienciaComunidade, AdocaoTratamento, MetadadosAdocaoTratamento,
  DenunciaComunidade, MetadadosDenunciaComunidade } from "../src/services/validacao-java.service";
import { montarExperienciaComunidade, montarAdocaoTratamento, montarDenunciaComunidade } from "../src/shared/protocolo-comunidade";

const ref=new Date("2026-11-17T12:00:00Z"), antes=new Date(ref.getTime()-1), depois=new Date(ref.getTime()+1);
const e=(): ExperienciaComunidade=>({nomePublico:"Pessoa",culturaNome:"Milho",tipoProblema:"praga",statusOcorrencia:"aberta",titulo:"Título",relato:"Relato"});
const me=(): MetadadosExperienciaComunidade=>({problemaAgricolaPresente:false,tratamentoOrigemPresente:false,avaliacaoOrigemPresente:false,versao:1n,
  moderacao:{status:"pendente",revisorPresente:false},criadoEm:antes,atualizadoEm:ref});
const a=(): AdocaoTratamento=>({metodoCopiado:{tipoMedida:"manual",descricao:"Método"},planejamento:{descricao:"Planejamento"}});
const ma=(): MetadadosAdocaoTratamento=>({experienciaVersao:1n,status:"planejada",tratamentoPresente:false,criadoEm:antes,atualizadoEm:ref});
const d=(): DenunciaComunidade=>({motivo:"outro"});
const md=(): MetadadosDenunciaComunidade=>({status:"pendente",analistaPresente:false,criadoEm:antes,atualizadoEm:ref});
const foto={url:"https://example.com/foto",publicId:" original\\id\t "};

test("Comunidade: regras puras e entradas preservadas",async t=>{
  async function caso(nome:string,executar:()=>Promise<{valido:boolean;erros:string[]}>,valido:boolean){
    await t.test(nome,async()=>assert.equal((await executar()).valido,valido));
  }
  await caso("experiência mínima",()=>experiencia(e(),me(),ref),true);
  for(const [campo,min,max] of [["nomePublico",2,80],["culturaNome",1,200],["problemaNome",1,200],["titulo",1,150],["relato",1,5000]] as const){
    for(const [rotulo,v,valido] of [["mínimo","🌱".repeat(min),true],["máximo","🌱".repeat(max),true],["excesso","🌱".repeat(max+1),false],["vazio","",false],["espaços","\u2003\uFEFF",false]] as const)
      await caso(campo+rotulo,()=>experiencia({...e(),[campo]:v},me(),ref),valido);
    if(campo!=="problemaNome")await caso(campo+" ausente",()=>experiencia({...e(),[campo]:undefined},me(),ref),false);
  }
  for(const tipoProblema of ["praga","doenca","deficiencia","nao_identificado"])await caso("tipo "+tipoProblema,()=>experiencia({...e(),tipoProblema},me(),ref),true);
  for(const tipoProblema of [undefined,"","PRAGA"])await caso("tipo inválido",()=>experiencia({...e(),tipoProblema},me(),ref),false);
  for(const statusOcorrencia of ["aberta","em_acompanhamento","encerrada"])await caso("ocorrência "+statusOcorrencia,()=>experiencia({...e(),statusOcorrencia},me(),ref),true);
  await caso("problema exige nome",()=>experiencia(e(),{...me(),problemaAgricolaPresente:true},ref),false);
  await caso("não identificado proíbe referência",()=>experiencia({...e(),tipoProblema:"nao_identificado",problemaNome:"Nome"},{...me(),problemaAgricolaPresente:true},ref),false);
  await caso("método exigido",()=>experiencia(e(),{...me(),tratamentoOrigemPresente:true},ref),false);
  const metodo={tipoMedida:"quimica",descricao:"Descrição"};
  await caso("método sem origem permitido",()=>experiencia({...e(),metodo},me(),ref),true);
  await caso("avaliação sem resultado",()=>experiencia({...e(),metodo},{...me(),tratamentoOrigemPresente:true,avaliacaoOrigemPresente:true},ref),false);
  for(const resultado of ["melhora_observada","sem_mudanca","piora_observada","inconclusivo"]){
    await caso("resultado "+resultado,()=>experiencia({...e(),metodo,resultadoRelatado:{resultado,dataAvaliacao:ref}},{...me(),tratamentoOrigemPresente:true,avaliacaoOrigemPresente:true},ref),true);
  }
  await caso("resultado sem avaliação",()=>experiencia({...e(),resultadoRelatado:{resultado:"inconclusivo",dataAvaliacao:ref}},me(),ref),false);
  await caso("objeto resultado incompleto",()=>experiencia({...e(),metodo,resultadoRelatado:{}},{...me(),tratamentoOrigemPresente:true,avaliacaoOrigemPresente:true},ref),false);
  for(const regiao of [undefined,{municipio:"Cidade"},{estado:"SP"},{municipio:"Cidade",estado:"SP"}])await caso("região válida",()=>experiencia({...e(),regiao},me(),ref),true);
  for(const regiao of [{},{estado:"sp"},{municipio:""},{estado:" SP "},{municipio:"🌱".repeat(151)}])await caso("região inválida",()=>experiencia({...e(),regiao},me(),ref),false);
  for(const fotos of [undefined,[],[foto],Array.from({length:5},(_,i)=>({...foto,publicId:String(i)}))])await caso("fotos válidas",()=>experiencia({...e(),fotos},me(),ref),true);
  for(const fotos of [[foto,foto],[{...foto,url:"http://example.com"}],[{...foto,publicId:" "}],[{...foto,legenda:""}],[{...foto,legenda:"🌱".repeat(301)}],Array.from({length:6},(_,i)=>({...foto,publicId:String(i)}))])await caso("fotos inválidas",()=>experiencia({...e(),fotos},me(),ref),false);
  for(const status of ["aprovada","rejeitada","oculta","retirada"]){
    const m={...me(),publicadoEm:ref,moderacao:{status,revisorPresente:true,revisadoEm:ref,motivo:"Motivo"}};
    await caso("moderação "+status,()=>experiencia(e(),m,ref),true);
    if(status!=="retirada")await caso("revisor obrigatório "+status,()=>experiencia(e(),{...m,moderacao:{...m.moderacao,revisorPresente:false}},ref),false);
    await caso("revisão futura "+status,()=>experiencia(e(),{...m,moderacao:{...m.moderacao,revisadoEm:depois}},ref),false);
    await caso("revisão anterior à criação "+status,()=>experiencia(e(),{...m,moderacao:{...m.moderacao,revisadoEm:new Date(0)}},ref),false);
  }
  await caso("retirada sem revisão",()=>experiencia(e(),{...me(),moderacao:{status:"retirada",revisorPresente:false}},ref),true);
  await caso("retirada decisão incompleta",()=>experiencia(e(),{...me(),moderacao:{status:"retirada",revisorPresente:false,motivo:"Motivo"}},ref),false);
  await caso("pendente com decisão",()=>experiencia(e(),{...me(),moderacao:{status:"pendente",revisorPresente:true}},ref),false);
  await caso("moderação ausente",()=>experiencia(e(),{...me(),moderacao:undefined},ref),false);
  await caso("publicação antes da criação",()=>experiencia(e(),{...me(),publicadoEm:new Date(0)},ref),false);
  await caso("publicação após atualização",()=>experiencia(e(),{...me(),publicadoEm:depois},ref),false);
  for(const versao of [undefined,0n,-1n])await caso("versão inválida",()=>experiencia(e(),{...me(),versao},ref),false);
  await caso("Long máximo exato",()=>experiencia(e(),{...me(),versao:9223372036854775807n},ref),true);
  await assert.rejects(experiencia(e(),{...me(),versao:9223372036854775808n},ref));
  const completo={...e(),metodo,regiao:{estado:"SP"},fotos:[{...foto,legenda:"Á🌱\\n\t\r\n"},{...foto,publicId:"Segundo"}]};
  const copia=structuredClone(completo);await caso("escapes e preservação",()=>experiencia(completo,me(),ref),true);assert.deepEqual(completo,copia);

  for(const tipoMedida of ["manual","cultural","biologica","quimica","outra"])await caso("método "+tipoMedida,()=>adocao({...a(),metodoCopiado:{tipoMedida,descricao:"Método"}},ma()),true);
  await caso("método inválido",()=>adocao({...a(),metodoCopiado:{tipoMedida:"inválido",descricao:""}},ma()),false);
  for(const status of ["planejada","realizada","cancelada"]){
    await caso("adoção "+status,()=>adocao(a(),{...ma(),status,tratamentoPresente:status==="realizada"}),true);
    await caso("vínculo incorreto "+status,()=>adocao(a(),{...ma(),status,tratamentoPresente:status!=="realizada"}),false);
  }
  await caso("planejamento futuro permitido",()=>adocao({...a(),planejamento:{descricao:"Planejar",dataPrevista:depois}},ma()),true);
  for(const c of [{},{metodoCopiado:{}},{planejamento:{}},{...a(),planejamento:{descricao:" "}}])await caso("adoção incompleta",()=>adocao(c,ma()),false);
  for(const motivo of ["dados_pessoais","conteudo_inadequado","informacao_perigosa","outro"])await caso("denúncia "+motivo,()=>denuncia({motivo},md(),ref),true);
  await caso("denúncia inválida",()=>denuncia({motivo:""},md(),ref),false);
  for(const decisao of ["manter_publicacao","ocultar_publicacao"]){
    const m={...md(),status:"analisada",decisao,justificativa:"Justificativa",analistaPresente:true,analisadoEm:ref};
    await caso("análise "+decisao,()=>denuncia(d(),m,ref),true);
    await caso("análise futura",()=>denuncia(d(),{...m,analisadoEm:depois},ref),false);
    await caso("análise anterior",()=>denuncia(d(),{...m,analisadoEm:new Date(0)},ref),false);
  }
  await caso("analisada incompleta",()=>denuncia(d(),{...md(),status:"analisada"},ref),false);
  await caso("pendente com decisão",()=>denuncia(d(),{...md(),decisao:"manter_publicacao"},ref),false);
  for(const descricao of [undefined,"🌱".repeat(2000)])await caso("descrição válida",()=>denuncia({...d(),descricao},md(),ref),true);
  for(const descricao of ["","\u2003","🌱".repeat(2001)])await caso("descrição inválida",()=>denuncia({...d(),descricao},md(),ref),false);
  await assert.rejects(denuncia(d(),md(),new Date(NaN)));
  // Contratos internos possuem limites próprios, sem importar regras de tratamentos.
  for(const [rotulo,valor,valido] of [["ausente",undefined,true],["vazio","",false],["espaços","\u2003",false],["limite","🌱".repeat(5000),true],["excesso","🌱".repeat(5001),false]] as const){
    await caso("observações método "+rotulo,()=>adocao({...a(),metodoCopiado:{tipoMedida:"manual",descricao:"Método",observacoes:valor}},ma()),valido);
    await caso("observações planejamento "+rotulo,()=>adocao({...a(),planejamento:{descricao:"Planejamento",observacoes:valor}},ma()),valido);
    await caso("observações resultado "+rotulo,()=>experiencia({...e(),metodo,resultadoRelatado:{resultado:"inconclusivo",dataAvaliacao:ref,observacoes:valor}},{...me(),tratamentoOrigemPresente:true,avaliacaoOrigemPresente:true},ref),valido);
  }
  for(const [texto,valido] of [["🌱".repeat(5000),true],["🌱".repeat(5001),false],["\u2003",false]] as const){
    await caso("descrição método",()=>adocao({...a(),metodoCopiado:{tipoMedida:"manual",descricao:texto}},ma()),valido);
    await caso("descrição planejamento",()=>adocao({...a(),planejamento:{descricao:texto}},ma()),valido);
  }
  for(const [texto,valido] of [["🌱".repeat(2000),true],["🌱".repeat(2001),false],["",false]] as const){
    await caso("justificativa",()=>denuncia(d(),{...md(),status:"analisada",decisao:"manter_publicacao",analistaPresente:true,analisadoEm:ref,justificativa:texto},ref),valido);
    await caso("motivo moderação",()=>experiencia(e(),{...me(),moderacao:{status:"rejeitada",revisorPresente:true,revisadoEm:ref,motivo:texto}},ref),valido);
  }
  await caso("aprovada sem publicação",()=>experiencia(e(),{...me(),moderacao:{status:"aprovada",revisorPresente:true,revisadoEm:ref}},ref),false);
  await caso("resultado futuro",()=>experiencia({...e(),metodo,resultadoRelatado:{resultado:"inconclusivo",dataAvaliacao:depois}},{...me(),tratamentoOrigemPresente:true,avaliacaoOrigemPresente:true},ref),false);
  await caso("legenda no limite",()=>experiencia({...e(),fotos:[{...foto,legenda:"🌱".repeat(300)}]},me(),ref),true);
  await caso("URL no limite",()=>experiencia({...e(),fotos:[{...foto,url:"https://example.com/"+"a".repeat(2028)}]},me(),ref),true);
  await caso("URL excesso",()=>experiencia({...e(),fotos:[{...foto,url:"https://example.com/"+"a".repeat(2029)}]},me(),ref),false);
  await caso("acúmulo de erros",async()=>{const r=await experiencia({}, {...me(),versao:0n},ref);assert(r.erros.length>=7);return r;},false);
  for(const estado of "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" "))
    await caso("UF "+estado,()=>experiencia({...e(),regiao:{estado}},me(),ref),true);
  await assert.rejects(experiencia(e(),{...me(),problemaAgricolaPresente:undefined as unknown as boolean},ref));
  await assert.rejects(adocao(a(),{...ma(),tratamentoPresente:undefined as unknown as boolean}));
  await assert.rejects(denuncia(d(),{...md(),analistaPresente:undefined as unknown as boolean},ref));
});

test("DDD: todos os códigos oficiais e todas as lacunas de 00 a 99",async t=>{
  const oficiais="11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 41 42 43 44 45 46 47 48 49 51 53 54 55 61 62 63 64 65 66 67 68 69 71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99".split(" ");
  assert.equal(oficiais.length,67);
  for(let i=0;i<100;i++){const ddd=String(i).padStart(2,"0");await t.test(ddd,async()=>{
    const r=await validarCadastroPerfilNoJava({nomeCompleto:"Pessoa",cpf:"52998224725",telefoneCanonico:`+55${ddd}999999999`,canalCodigoPreferido:"sms"});assert.equal(r.valido,oficiais.includes(ddd));
  });}
});

test("Comunidade: contagens, marcadores, objetos, datas e recuperação",async()=>{
  const ep=montarExperienciaComunidade(e(),me(),ref).trimEnd().split("\t");
  const ap=montarAdocaoTratamento(a(),ma()).trimEnd().split("\t");
  const dp=montarDenunciaComunidade(d(),md(),ref).trimEnd().split("\t");
  assert.equal(ep.length,40);assert.equal(ap.length,16);assert.equal(dp.length,14);
  const pedidos:Array<[string,boolean]> = [];
  const adicionar=(p:string[])=>pedidos.push([p.join("\t"),false]);
  for(const p of [ep,ap,dp]){adicionar(p.slice(0,-1));adicionar([...p,"extra"]);const q=[...p];q[1]="\\q";adicionar(q);}
  for(const i of [7,8,10,11,12,15,17,20,22,23,25,28,30,32,38]){const p=[...ep];p[i]="2";adicionar(p);}
  for(const valor of ["-1","01","2147483647","2147483648","99999999999999999999"]){const p=[...ep];p[39]=valor;adicionar(p);}
  for(const i of [13,14,16,18,19,21,24,26]){const p=[...ep];p[i]="texto";adicionar(p);}
  const m=[...ep];m[28]="0";adicionar(m);
  const f=[...ep];f[38]="1";f[39]="1";adicionar(f);
  for(const i of [34,35,36,37]){const p=[...ep];p[i]="2026-02-30T00:00:00Z";adicionar(p);}
  const vazio=[...ep];vazio[37]="";adicionar(vazio);
  const overflow=[...ep];overflow[27]="9223372036854775808";adicionar(overflow);
  const fp=montarExperienciaComunidade({...e(),fotos:[foto]},me(),ref).trimEnd().split("\t");
  const fm=[...fp];fm[42]="2";adicionar(fm);
  const fa=[...fp];fa[43]="texto";adicionar(fa);
  const fotosAusentes=[...fp];fotosAusentes[38]="0";adicionar(fotosAusentes);
  for(const i of [2,5,7,10,13]){const p=[...ap];p[i]="2";adicionar(p);}
  for(const i of [2,5,7,9]){const p=[...dp];p[i]="2";adicionar(p);}
  pedidos.push([ep.join("\t"),true],[ap.join("\t"),true],[dp.join("\t"),true],["VALIDAR_TALHAO\tNorte\t1",true]);
  const socket=createConnection(configuracaoJava());
  try{await new Promise<void>((resolve,reject)=>{
    let buf=Buffer.alloc(0),indice=0;const timer=setTimeout(()=>{socket.destroy();reject(Error("TIMEOUT"));},5000);
    socket.on("error",err=>{clearTimeout(timer);reject(err);});
    socket.on("data",dados=>{buf=Buffer.concat([buf,dados]);let fim;while((fim=buf.indexOf(10))>=0){const linha=buf.subarray(0,fim).toString("utf8").replace(/\r$/,"");buf=buf.subarray(fim+1);try{assert.equal(linha==="OK",pedidos[indice++][1]);if(indice===pedidos.length){clearTimeout(timer);resolve();}}catch(err){clearTimeout(timer);reject(err);}}});
    socket.once("connect",()=>socket.write(pedidos.map(p=>p[0]+"\n").join("")));
  });}finally{socket.destroy();}
});
