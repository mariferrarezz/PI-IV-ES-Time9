import test from "node:test";
import assert from "node:assert/strict";
import { createConnection } from "node:net";
import { configuracaoJava } from "../src/config/java";
import { validarProblemaAgricolaNoJava, CamposValidacaoProblemaAgricola as Campos, FormaControleProblema } from "../src/services/validacao-java.service";
import { montarPedidoProblemaAgricola } from "../src/shared/protocolo-problema-agricola";

const ref = new Date("2026-11-17T12:00:00Z");
const id = "000000000000000000000001";
test("Mil erros: resposta limitada e recuperação na mesma conexão", async () => {
  const campos = minimo();
  campos.sintomas = Array(50).fill("");
  campos.medidasPreventivas = Array(50).fill("");
  campos.formasControle = Array.from({ length: 30 }, () => ({
    tipo: "manual", descricao: "Controle", exemplosControle: Array(30).fill(""),
  }));
  const aviso = "Existem erros adicionais não exibidos nesta resposta.";
  const resultado = await validarProblemaAgricolaNoJava(campos, ref);
  assert.equal(resultado.valido, false);
  assert.equal(resultado.erros.at(-1), aviso);
  assert(resultado.erros.length < 1000);
  const socket = createConnection(configuracaoJava());
  try {
    await new Promise<void>((resolve, reject) => {
      let recebido = Buffer.alloc(0), linhas = 0;
      const timer = setTimeout(() => { socket.destroy(); reject(Error("TIMEOUT")); }, 5000);
      socket.on("error", erro => { clearTimeout(timer); reject(erro); });
      socket.on("data", dados => {
        recebido = Buffer.concat([recebido, dados]);
        let fim: number;
        while ((fim = recebido.indexOf(10)) >= 0) {
          const bytes = recebido.subarray(0, fim + 1);
          recebido = recebido.subarray(fim + 1);
          try {
            assert(bytes.length <= 65536);
            const linha = bytes.toString("utf8").trimEnd();
            if (linhas++ === 0) assert(linha.endsWith(aviso));
            else { assert.equal(linha, "OK"); clearTimeout(timer); resolve(); }
          } catch (erro) { clearTimeout(timer); reject(erro); }
        }
      });
      socket.once("connect", () => socket.write(montarPedidoProblemaAgricola(campos, ref) + "VALIDAR_TALHAO\tNorte\t1\n"));
    });
  } finally { socket.destroy(); }
});
const imagem = {url: "https://example.com/foto", publicId: " pasta\\id\t ", enviadaEm: new Date("2099-01-01T00:00:00Z")};
function minimo(): Campos {
  return {nomeComum: "Problema", tipo: "praga", descricao: "Descrição", culturasAfetadasIds: [id], sintomas: ["Sintoma"],
    medidasPreventivas: ["Prevenção"], formasControle: [{tipo: "manual", descricao: "Controle"}], fontesIds: [id],
    ativo: false, revisaoEditorial: {status: "pendente"}};
}
const textos = {nomeComum: 200, nomeCientifico: 200, descricao: 5000, codigoEditorial: 100,
  ondeOlhar: 5000, dicaDeCampo: 5000, perdaEstimada: 5000, epocaPropicia: 5000, abrangenciaCulturas: 1000,
  informacoesDisseminacao: 5000, orientacaoBuscaAgronomo: 5000, tratamentoIntro: 5000} as const;
const listasTexto = {sintomas: [1,50,1000], medidasPreventivas: [1,50,1000], partesAfetadas: [0,30,1000],
  condicoesFavoraveis: [0,50,1000], chips: [0,4,150], danos: [1,50,1000], boasPraticas: [1,30,1000]} as const;
function completa(): Campos {
  return {...minimo(), nomeCientifico: "Nome", codigoEditorial: "ficha", chips: ["rótulo", "rótulo"],
    niveisAtencao: {baixo: "Baixo", medio: "Médio", alto: "Alto"}, ondeOlhar: "Folhas", dicaDeCampo: "Observar",
    danos: ["Dano"], perdaEstimada: "Texto", epocaPropicia: "Texto", abrangenciaCulturas: "Texto",
    partesAfetadas: [], condicoesFavoraveis: [], informacoesDisseminacao: "Texto", tratamentoIntro: "Texto",
    boasPraticas: ["Prática"], orientacaoBuscaAgronomo: "Texto", imagens: [imagem, {...imagem,publicId: "segunda"}],
    formasControle: [{tipo:"biologica",descricao:"Controle",observacoes:"Texto",classe:"Classe",exemplosControle:["Exemplo","Exemplo"]}],
    revisaoEditorial: {status:"aprovada",observacoes:"Texto",registroAgrofitConferido:false,fotoPendente:false}, revisadoEm: ref};
}

test("Problema agrícola: conteúdo, opcionais e revisão pelo Java real", async t => {
  async function caso(nome: string, c: Campos, valido: boolean, trecho?: string) {
    await t.test(nome, async () => {
      const antes = structuredClone(c), r = await validarProblemaAgricolaNoJava(c, ref);
      assert.equal(r.valido, valido, r.erros.join("; "));
      if (trecho) assert(r.erros.some(e => e.includes(trecho)), r.erros.join("; "));
      assert.deepEqual(c, antes);
    });
  }
  await caso("mínima inativa pendente", minimo(), true);
  await caso("completa aprovada inativa com flags false", completa(), true);
  await caso("vazia acumula obrigatórios", {}, false, "nomeComum");
  for (const [campo, limite] of Object.entries(textos)) {
    for (const [nome, valor, valido] of [["vazio","",false],["espaços","\uFEFF\u2003",false],
      ["mínimo","🌱",true],["limite","🌱".repeat(limite),true],["excesso","🌱".repeat(limite+1),false],
      ["combinantes","a\u0301".repeat(limite/2),true]] as const)
      await caso(`${campo} ${nome}`, {...minimo(), [campo]:valor}, valido, valido?undefined:campo);
  }
  for (const campo of ["nomeComum","descricao"] as const) await caso(campo+" ausente",{...minimo(),[campo]:undefined},false,campo);
  for (const tipo of ["praga","doenca","deficiencia"]) await caso(tipo,{...minimo(),tipo},true);
  for (const tipo of [undefined,"","PRAGA","nao_identificado"]) await caso("tipo inválido",{...minimo(),tipo},false,"tipo");
  for (const [campo,[min,max,tamanho]] of Object.entries(listasTexto)) {
    const obrigatoria = campo==="sintomas"||campo==="medidasPreventivas";
    await caso(campo+" ausente",{...minimo(),[campo]:undefined},!obrigatoria);
    await caso(campo+" vazia",{...minimo(),[campo]:[]},min===0);
    await caso(campo+" limite",{...minimo(),[campo]:Array(max).fill("🌱".repeat(tamanho))},true);
    await caso(campo+" excesso itens",{...minimo(),[campo]:Array(max+1).fill("Item")},false,campo);
    await caso(campo+" excesso texto",{...minimo(),[campo]:["🌱".repeat(tamanho+1)]},false,campo);
    await caso(campo+" item vazio",{...minimo(),[campo]:[""]},false,campo);
    await caso(campo+" repetições editoriais",{...minimo(),[campo]:["Texto","Texto"]},true);
  }
  for (const campo of ["culturasAfetadasIds","fontesIds"] as const) {
    await caso(campo+" ausente",{...minimo(),[campo]:undefined},false,campo);
    await caso(campo+" vazia",{...minimo(),[campo]:[]},false,campo);
    await caso(campo+" repetida",{...minimo(),[campo]:[id,id]},false,campo);
    await caso(campo+" limite",{...minimo(),[campo]:Array.from({length:100},(_,i)=>(i+1).toString(16).padStart(24,"0"))},true);
    await caso(campo+" excesso",{...minimo(),[campo]:Array.from({length:101},(_,i)=>(i+1).toString(16).padStart(24,"0"))},false,campo);
  }
  for (const formasControle of [undefined,[]]) await caso("controles ausentes/vazios",{...minimo(),formasControle},false,"formasControle");
  const controle = {tipo:"manual",descricao:"Controle"};
  await caso("30 controles",{...minimo(),formasControle:Array(30).fill(controle)},true);
  await caso("31 controles",{...minimo(),formasControle:Array(31).fill(controle)},false,"formasControle");
  for (const tipo of ["manual","cultural","biologica","quimica","outra"]) await caso("controle "+tipo,{...minimo(),formasControle:[{...controle,tipo}]},true);
  await caso("controle inválido",{...minimo(),formasControle:[{tipo:"",descricao:""}]},false,"formasControle");
  for (const [campo,limite] of [["descricao",5000],["observacoes",5000],["classe",200]] as const) {
    for (const [rotulo,valor,valido] of [["vazio","",false],["máximo","🌱".repeat(limite),true],["excesso","🌱".repeat(limite+1),false]] as const)
      await caso("controle "+campo+rotulo,{...minimo(),formasControle:[{...controle,[campo]:valor}]},valido);
  }
  for (const exemplosControle of [undefined,[],["Exemplo"],Array(30).fill("🌱".repeat(200))])
    await caso("exemplos válidos",{...minimo(),formasControle:[{...controle,exemplosControle}]},true);
  for (const exemplosControle of [[""],["🌱".repeat(201)],Array(31).fill("Texto")])
    await caso("exemplos inválidos",{...minimo(),formasControle:[{...controle,exemplosControle}]},false,"exemplosControle");
  await caso("níveis ausentes",minimo(),true);
  await caso("níveis vazios",{...minimo(),niveisAtencao:{}},false,"niveisAtencao");
  for(const campo of ["baixo","medio","alto"] as const){
    const niveis={baixo:"Texto",medio:"Texto",alto:"Texto"};
    await caso("nível limite "+campo,{...minimo(),niveisAtencao:{...niveis,[campo]:"🌱".repeat(1000)}},true);
    await caso("nível excesso "+campo,{...minimo(),niveisAtencao:{...niveis,[campo]:"🌱".repeat(1001)}},false,campo);
  }
  for(const imagens of [undefined,[],[imagem],Array.from({length:5},(_,i)=>({...imagem,publicId:String(i)}))]) await caso("imagens válidas",{...minimo(),imagens},true);
  await caso("imagem duplicada",{...minimo(),imagens:[imagem,imagem]},false,"publicId");
  await caso("seis imagens",{...minimo(),imagens:Array.from({length:6},(_,i)=>({...imagem,publicId:String(i)}))},false,"imagens");
  await caso("metadados inválidos",{...minimo(),imagens:[{...imagem,url:"",publicId:"",legenda:""}]},false,"URL");
  for(const ativo of [false,true]) await caso("legado com data "+ativo,{...minimo(),revisaoEditorial:undefined,revisadoEm:ref,ativo},true);
  await caso("legado sem data",{...minimo(),revisaoEditorial:undefined},false,"revisadoEm");
  await caso("ativo ausente",{...minimo(),ativo:undefined},false,"ativo");
  await caso("pendente ativa",{...minimo(),ativo:true},false,"pendente");
  await caso("revisão objeto vazio",{...minimo(),revisaoEditorial:{}},false,"status");
  for(const status of ["aprovada","pendente"]) {
    await caso("revisão "+status+" anterior",{...minimo(),revisaoEditorial:{status},revisadoEm:new Date(ref.getTime()-1)},true);
    await caso("revisão "+status+" igual",{...minimo(),revisaoEditorial:{status},revisadoEm:ref},true);
    await caso("revisão "+status+" futura",{...minimo(),revisaoEditorial:{status},revisadoEm:new Date(ref.getTime()+1)},false,"futura");
  }
  await caso("aprovada sem data",{...minimo(),revisaoEditorial:{status:"aprovada"}},false,"revisadoEm");
  await caso("aprovada ativa",{...completa(),ativo:true},true);
  for(const observacoes of [undefined,"🌱".repeat(5000)]) await caso("revisão observações válidas",{...minimo(),revisaoEditorial:{status:"pendente",observacoes}},true);
  for(const observacoes of ["","🌱".repeat(5001)]) await caso("revisão observações inválidas",{...minimo(),revisaoEditorial:{status:"pendente",observacoes}},false,"observacoes");
  await caso("escapes e ordem",{...completa(),nomeComum:"Nome\\n\t\r\nFim\\",sintomas:["B","A"],imagens:[{...imagem,publicId:"2"},{...imagem,publicId:"1"}]},true);
  await assert.rejects(validarProblemaAgricolaNoJava(minimo(),new Date(NaN)),/instante válido/);
});

test("Contrato das 59 partes e recuperação após malformados",async()=>{
  const pedido=montarPedidoProblemaAgricola(minimo(),ref);
  const p=pedido.slice(0,-1).split("\t");
  const esperadas=["VALIDAR_PROBLEMA_AGRICOLA","Problema","praga","Descrição","0","","1","1","1","1","1","1","1","1","1","1","0","",ref.toISOString(),
    "0","0","0","0","0","","0","","0","0","0","","0","0","0","","","","0","","0","","0","0","0","","0","","0","","0","","0","0","1","pendente","0","","",""];
  assert.equal(esperadas.length,59); assert.deepEqual(p.slice(0,59),esperadas);assert.equal(p.length,71);
  const invalido="ERRO\tPedido de validação inválido.", pedidos:Array<[string,string]> = [];
  for(const corte of [0,1,58,59,60,63,70])pedidos.push([p.slice(0,corte).join("\t"),invalido]);
  pedidos.push([[...p,"extra"].join("\t"),invalido]);
  const marcadores=[4,6,8,10,12,14,19,21,23,25,27,29,31,33,37,39,41,43,45,47,49,51,53,55];
  for(const i of marcadores){const a=[...p];a[i]="2";pedidos.push([a.join("\t"),invalido]);}
  for(const i of [7,9,11,13,15,20,22,28,32,42,52])for(const valor of ["-1","01","abc","2147483647","2147483648","99999999999999999999"]){const a=[...p];a[i]=valor;pedidos.push([a.join("\t"),invalido]);}
  for(const i of [16,57,58]){const a=[...p];a[i]="false";pedidos.push([a.join("\t"),invalido]);}
  for(const i of [5,24,26,30,34,35,36,38,40,44,46,48,50,56]){const a=[...p];a[i]="texto";pedidos.push([a.join("\t"),invalido]);}
  for(const i of [6,8,10,12,14]){const a=[...p];a[i]="0";pedidos.push([a.join("\t"),invalido]);}
  const revisaoAusente=[...p];revisaoAusente[53]="0";pedidos.push([revisaoAusente.join("\t"),invalido]);
  const flagsAusentes=[...p];flagsAusentes[53]="0";flagsAusentes[54]="";flagsAusentes[57]="0";pedidos.push([flagsAusentes.join("\t"),invalido]);
  for(const escape of ["\\q","\\"]){const a=[...p];a[1]=escape;pedidos.push([a.join("\t"),invalido]);}
  // Controle inicia em 62; seus exemplos são imediatamente após as oito partes.
  for(const valor of ["1","2147483647","2147483648","-1"]){const a=[...p];a[69]=valor;pedidos.push([a.join("\t"),invalido]);}
  const controleTruncado=[...p];controleTruncado[68]="1";controleTruncado[69]="5";pedidos.push([controleTruncado.join("\t"),invalido]);
  const controleMarcador=[...p];controleMarcador[64]="2";pedidos.push([controleMarcador.join("\t"),invalido]);
  for(const i of [17,18]){const a=[...p];a[i]="2026-02-30T00:00:00Z";pedidos.push([a.join("\t"),`ERRO\t${i===17?"A data de revisão":"O instante de referência"} deve ser um instante ISO válido em UTC.`]);}
  const semRef=[...p];semRef[18]="";pedidos.push([semRef.join("\t"),"ERRO\tO instante de referência é obrigatório."]);
  pedidos.push([p.join("\t"),"OK"],["VALIDAR_TALHAO\tNorte\t1","OK"],["VALIDAR_PROPRIEDADE\tNome\tCidade\tSP\t\t0\t","OK"]);
  const socket=createConnection(configuracaoJava());
  try {await new Promise<void>((resolve,reject)=>{let acumulado=Buffer.alloc(0),i=0;const timer=setTimeout(()=>{socket.destroy();reject(Error("TIMEOUT"));},8000);
    socket.on("error",e=>{clearTimeout(timer);reject(e);});socket.on("data",chunk=>{acumulado=Buffer.concat([acumulado,chunk]);let fim;while((fim=acumulado.indexOf(10))>=0){const linha=acumulado.subarray(0,fim).toString("utf8").replace(/\r$/,"");acumulado=acumulado.subarray(fim+1);try{assert.equal(linha,pedidos[i++][1],"Pedido "+i);}catch(e){clearTimeout(timer);reject(e);return;}if(i===pedidos.length){clearTimeout(timer);resolve();}}});
    socket.once("connect",()=>socket.write(pedidos.map(p=>p[0]+"\n").join("")));});} finally {socket.destroy();}
});

test("Transporte: ficha válida com todos os limites finitos simultâneos",async t=>{
  const c=completa();
  for(const [campo,limite] of Object.entries(textos)) (c as any)[campo]="🌱".repeat(limite);
  for(const [campo,[,quantidade,tamanho]] of Object.entries(listasTexto)) (c as any)[campo]=Array(quantidade).fill("🌱".repeat(tamanho));
  c.culturasAfetadasIds=Array.from({length:100},(_,i)=>(i+1).toString(16).padStart(24,"0"));c.fontesIds=[...c.culturasAfetadasIds];
  c.formasControle=Array.from({length:30},()=>({tipo:"quimica",descricao:"🌱".repeat(5000),observacoes:"🌱".repeat(5000),classe:"🌱".repeat(200),exemplosControle:Array(30).fill("🌱".repeat(200))}));
  c.niveisAtencao={baixo:"🌱".repeat(1000),medio:"🌱".repeat(1000),alto:"🌱".repeat(1000)};
  c.revisaoEditorial={status:"aprovada",observacoes:"🌱".repeat(5000),registroAgrofitConferido:false,fotoPendente:false};
  c.imagens=Array.from({length:5},(_,i)=>({...imagem,url:"https://example.com/"+"a".repeat(2028),publicId:"id"+i,legenda:"🌱".repeat(300)}));
  const pedido=montarPedidoProblemaAgricola(c,ref);
  // publicId não tem teto de negócio: este mede os limites finitos, não um máximo absoluto.
  t.diagnostic(`Pedido UTF-8: ${Buffer.byteLength(pedido)} bytes; ${pedido.slice(0,-1).split("\t").length} partes; resposta OK: 3 bytes LF.`);
  assert(Buffer.byteLength(pedido)>1024*1024);
  assert.deepEqual(await validarProblemaAgricolaNoJava(c,ref),{valido:true,erros:[]});
});
