import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import mongoose, { mongo, Types, ClientSession } from "mongoose";

process.env.MONGODB_URI = "mongodb://127.0.0.1:1/sentinela";
process.env.FIREBASE_PROJECT_ID = "demo-propriedades-put";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
const { criarApp } = require("../src/app") as typeof import("../src/app");
const { criarPropriedadesService } = require("../src/modules/propriedades/propriedades.service") as typeof import("../src/modules/propriedades/propriedades.service");
const { JavaIndisponivelError } = require("../src/services/validacao-java.service") as typeof import("../src/services/validacao-java.service");
const { capturarImagem, mesmaImagem, condicaoImagem, areaLegadaParaJava } = require("../src/modules/propriedades/propriedades.atualizacao") as typeof import("../src/modules/propriedades/propriedades.atualizacao");
type Repo = import("../src/modules/propriedades/propriedades.repository").PropriedadesRepository;
type Registro = import("../src/modules/propriedades/propriedades.repository").RegistroAtualizacao;
type Controle = import("../src/modules/propriedades/propriedades.atualizacao").ControleAtualizacao;
const copiar = <T>(valor: T): T => mongo.BSON.deserialize(mongo.BSON.serialize(valor as object), { promoteLongs: false }) as T;

function fixture(opcionais: object = { areaTotalHa: 8, observacoes: " Obs herdada " }) {
  const id = new Types.ObjectId(), usuarioId = new Types.ObjectId();
  let doc: Registro | null = { _id: id, usuarioId, nome: " Nome herdado ", municipio: " Cidade herdada ", estado: "SP",
    ativa: false, criadoEm: new Date(1), atualizadoEm: new Date(10), ...opcionais };
  const estado = { emTransacao: false, java: 0, transacoes: 0, tentativas: 0, escritas: 0, totalAtivos: 0,
    repetir: false, falhaCAS: false, entrada: [] as unknown[], patch: {} as object, controle: undefined as Controle | undefined,
    duranteJava: undefined as (() => void) | undefined, entreTentativas: undefined as (() => void) | undefined,
    falhaJava: undefined as "invalido" | "indisponivel" | undefined };
  const repo: Repo = {
    async criar() { throw new Error("NAO_USADO"); }, async listarPorUsuario() { return []; },
    async buscarPorId() { return doc as any; },
    async buscarParaAtualizacao(chave, dono) {
      return doc && chave.equals(id) && dono.equals(usuarioId) ? copiar(doc) : null;
    },
    async atualizar(chave, dono, patch, session, controle) {
      assert(estado.emTransacao); assert(session); estado.patch = patch; estado.controle = controle;
      if (estado.repetir && estado.tentativas === 1) throw new Error("TRANSIENT_SIMULADO");
      if (estado.falhaCAS || !doc || !mesmaImagem(doc, controle.imagem)) return null;
      assert(chave.equals(id)); assert(dono.equals(usuarioId)); assert(controle.atualizadoEm > doc.atualizadoEm);
      estado.escritas++; doc = { ...doc, ...patch, atualizadoEm: controle.atualizadoEm };
      return copiar(doc) as any;
    },
    async excluir() { return false; }, async temTalhoes() { return false; },
    async areaAtivaExcede(_id, area) { assert(estado.emTransacao); return estado.totalAtivos > area; },
    async comTransacao(acao) {
      estado.transacoes++;
      for (let i = 0; ; i++) {
        estado.emTransacao = true; estado.tentativas++;
        try { return await acao({} as ClientSession); }
        catch (erro) {
          if (!(erro instanceof Error) || erro.message !== "TRANSIENT_SIMULADO" || i > 0) throw erro;
          estado.entreTentativas?.();
        } finally { estado.emTransacao = false; }
      }
    },
  };
  const service = criarPropriedadesService(repo, {
    async buscarPorFirebaseUid(uid) { return uid === "sem-perfil" ? null : { _id: uid === "a" ? usuarioId : new Types.ObjectId() }; },
  }, async (...entrada) => {
    assert.equal(estado.emTransacao, false); estado.java++; estado.entrada = entrada;
    estado.duranteJava?.();
    if (estado.falhaJava === "indisponivel") throw new JavaIndisponivelError();
    return estado.falhaJava === "invalido" ? { valido: false, erros: ["O município é obrigatório."] } : { valido: true, erros: [] };
  });
  return { id, service, estado, get doc() { return doc; }, set doc(valor: Registro | null) { doc = valor; } };
}

test("PUT parcial: estado final, omissões, arquivamento e reativação", async () => {
  const f = fixture();
  await f.service.atualizar(String(f.id), "a", { nome: "  Novo nome  " });
  assert.deepEqual(f.estado.entrada, ["Novo nome", " Cidade herdada ", "SP", 8, " Obs herdada "]);
  assert.deepEqual(f.estado.patch, { nome: "Novo nome" }); assert.equal(f.doc!.ativa, false);
  assert.equal(f.doc!.municipio, " Cidade herdada "); assert.equal(f.doc!.observacoes, " Obs herdada ");
  await f.service.atualizar(String(f.id), "a", { ativa: true }); assert.equal(f.doc!.ativa, true);
  await f.service.atualizar(String(f.id), "a", { ativa: false }); assert.equal(f.doc!.ativa, false);
  const semOpcionais = fixture({});
  await semOpcionais.service.atualizar(String(semOpcionais.id), "a", { nome: "Outro" });
  assert.deepEqual(semOpcionais.estado.entrada.slice(3), [undefined, undefined]);
  assert(!Object.hasOwn(semOpcionais.doc!, "observacoes")); assert(!Object.hasOwn(semOpcionais.doc!, "areaTotalHa"));
  await semOpcionais.service.atualizar(String(semOpcionais.id), "a", { observacoes: "  Obs nova  " });
  assert.equal(semOpcionais.doc!.observacoes, "Obs nova");
});

test("PUT: inválido/503 não inicia transação; null e corpo vazio continuam inválidos", async () => {
  for (const falha of ["invalido", "indisponivel"] as const) {
    const f = fixture(); f.estado.falhaJava = falha;
    await assert.rejects(f.service.atualizar(String(f.id), "a", { nome: "Novo" }), { statusCode: falha === "invalido" ? 400 : 503 });
    assert.equal(f.estado.transacoes, 0); assert.equal(f.estado.escritas, 0);
  }
  for (const patch of [{}, { nome: " " }, { observacoes: null }, { areaTotalHa: null }, { ativa: null }, { estado: "sp" }]) {
    const f = fixture(); await assert.rejects(f.service.atualizar(String(f.id), "a", patch));
    assert.equal(f.estado.java, 0); assert.equal(f.estado.escritas, 0);
  }
});

test("PUT: Java lê todos os dados finais, mas somente o patch é persistido", async () => {
  const f = fixture(); f.estado.totalAtivos = 8;
  await f.service.atualizar(String(f.id), "a", { areaTotalHa: 8 });
  assert.equal(f.estado.escritas, 1); assert.deepEqual(f.estado.patch, { areaTotalHa: 8 });
  assert(f.estado.controle!.atualizadoEm.getTime() > 10);
  const insuficiente = fixture(); insuficiente.estado.totalAtivos = 8;
  await assert.rejects(insuficiente.service.atualizar(String(insuficiente.id), "a", { areaTotalHa: 7.99 }), { statusCode: 409, code: "AREA_INSUFICIENTE" });
  assert.equal(insuficiente.estado.escritas, 0);
});

test("PUT: mudança durante Java e presença de opcionais geram 409, mesmo no mesmo milissegundo", async () => {
  for (const alterar of [
    (f: ReturnType<typeof fixture>) => { f.doc!.municipio = "Outra cidade"; },
    (f: ReturnType<typeof fixture>) => { f.doc!.ativa = true; },
    (f: ReturnType<typeof fixture>) => { f.doc!.observacoes = "Nova"; },
    (f: ReturnType<typeof fixture>) => { delete f.doc!.observacoes; },
    (f: ReturnType<typeof fixture>) => { f.doc!.areaTotalHa = 9; },
  ]) {
    const f = fixture(); const data = f.doc!.atualizadoEm.getTime();
    f.estado.duranteJava = () => alterar(f);
    await assert.rejects(f.service.atualizar(String(f.id), "a", { nome: "Novo" }), {
      statusCode: 409, code: "PROPRIEDADE_ALTERADA",
      message: "A propriedade foi alterada durante a operação. Recarregue os dados e tente novamente.",
    });
    assert.equal(f.doc!.atualizadoEm.getTime(), data); assert.equal(f.estado.escritas, 0);
  }
  const f = fixture({}); f.estado.duranteJava = () => { f.doc!.observacoes = "Incluída"; };
  await assert.rejects(f.service.atualizar(String(f.id), "a", { nome: "Novo" }), { code: "PROPRIEDADE_ALTERADA" });
  const removida = fixture(); removida.estado.duranteJava = () => { removida.doc = null; };
  await assert.rejects(removida.service.atualizar(String(removida.id), "a", { nome: "Novo" }), { statusCode: 404 });
});

test("PUT: repetição transacional compara imagem original e não repete Java", async () => {
  const f = fixture(); f.estado.repetir = true;
  await f.service.atualizar(String(f.id), "a", { nome: "Novo" });
  assert.equal(f.estado.java, 1); assert.equal(f.estado.tentativas, 2); assert.equal(f.estado.escritas, 1);
  const mudou = fixture(); mudou.estado.repetir = true;
  mudou.estado.entreTentativas = () => { mudou.doc!.nome = "Concorrente"; };
  await assert.rejects(mudou.service.atualizar(String(mudou.id), "a", { nome: "Novo" }), { code: "PROPRIEDADE_ALTERADA" });
  assert.equal(mudou.estado.java, 1); assert.equal(mudou.estado.escritas, 0);
  const somenteData = fixture(); somenteData.estado.repetir = true;
  somenteData.estado.entreTentativas = () => { somenteData.doc!.atualizadoEm = new Date(Date.now() + 5); };
  await somenteData.service.atualizar(String(somenteData.id), "a", { ativa: false });
  assert.equal(somenteData.estado.escritas, 1); assert.equal(somenteData.estado.java, 1);
  const cas = fixture(); cas.estado.falhaCAS = true;
  await assert.rejects(cas.service.atualizar(String(cas.id), "a", { nome: "Novo" }), { code: "PROPRIEDADE_ALTERADA" });
});

test("BSON legado: leitura sem promoção, conversão exata e preservação no patch", async () => {
  const seguro = mongo.Long.fromString("42"), inseguro = mongo.Long.fromString("9007199254740993");
  const bytes = mongo.BSON.serialize({ seguro, inseguro, decimal: mongo.Decimal128.fromString("0.5") });
  const padrao = mongo.BSON.deserialize(bytes);
  assert.equal(padrao.seguro, 42); assert(padrao.inseguro instanceof mongo.Long); assert(padrao.decimal instanceof mongo.Decimal128);
  const leituraPut = mongo.BSON.deserialize(bytes, { promoteLongs: false }); assert(leituraPut.seguro instanceof mongo.Long);
  for (const valor of [seguro, mongo.Long.fromString("1152921504606846976"), mongo.Decimal128.fromString("0.5"), mongo.Decimal128.fromString("1.25")]) {
    const f = fixture({ areaTotalHa: valor });
    await f.service.atualizar(String(f.id), "a", { nome: "Novo" });
    assert.equal(f.estado.entrada[3], Number(valor.toString())); assert(!Object.hasOwn(f.estado.patch, "areaTotalHa"));
    assert.equal(f.doc!.areaTotalHa!.toString(), valor.toString());
    assert.equal(f.doc!.areaTotalHa!.constructor, valor.constructor);
  }
  for (const valor of [inseguro, mongo.Decimal128.fromString("0.1"), mongo.Decimal128.fromString("1E+6144"),
    mongo.Decimal128.fromString("1E-6176"), mongo.Decimal128.fromString("0.5000000000000000000000000000000001"), null]) {
    const f = fixture({ areaTotalHa: valor });
    await assert.rejects(f.service.atualizar(String(f.id), "a", { nome: "Novo" }), { statusCode: 422, code: "AREA_LEGADA_INCOMPATIVEL" });
    assert.equal(f.estado.java, 0); assert.equal(f.estado.transacoes, 0); assert.equal(f.estado.escritas, 0);
  }
  const substituida = fixture({ areaTotalHa: inseguro });
  await substituida.service.atualizar(String(substituida.id), "a", { areaTotalHa: 2 });
  assert.equal(substituida.doc!.areaTotalHa, 2); // Alteração explícita, não conversão de um campo omitido.
  assert.equal(areaLegadaParaJava(0.1), 0.1);
});

test("Repository: guarda atômica mantém BSON/strings, timestamps e sessão", async () => {
  const { PropriedadeModel } = require("../src/modules/propriedades/propriedades.model") as typeof import("../src/modules/propriedades/propriedades.model");
  const { propriedadesRepository } = require("../src/modules/propriedades/propriedades.repository") as typeof import("../src/modules/propriedades/propriedades.repository");
  const f = fixture({ areaTotalHa: mongo.Decimal128.fromString("0.5"), observacoes: " Herdado " });
  const imagem = capturarImagem(f.doc!); const expr = condicaoImagem(imagem);
  const options = { session: {} as ClientSession, promoteLongs: false };
  const exprEsperada = copiar(expr);
  const consulta = PropriedadeModel.findOne({ _id: f.id, usuarioId: f.doc!.usuarioId, $expr: expr });
  (consulta as any).cast(PropriedadeModel); // Exercita o casting real sem executar consulta.
  assert.deepEqual(consulta.getFilter().$expr, exprEsperada);
  const modelo = PropriedadeModel as any, findOne = modelo.findOne, update = modelo.findOneAndUpdate;
  try {
    modelo.findOne = (_f: unknown, _p: unknown, op: unknown) => { assert.deepEqual(op, options); return { lean() { return this; }, async exec() { return f.doc; } }; };
    modelo.findOneAndUpdate = (filtro: any, dados: any, op: any) => {
      assert(filtro._id.equals(f.id)); assert(filtro.usuarioId.equals(f.doc!.usuarioId)); assert.deepEqual(filtro.$expr, expr);
      assert.deepEqual(Object.keys(dados.$set).sort(), ["atualizadoEm", "nome"]);
      assert.equal(op.timestamps, false); assert.equal(op.runValidators, true); assert.equal(op.session, options.session);
      return { lean() { return this; }, async exec() { return f.doc; } };
    };
    await propriedadesRepository.buscarParaAtualizacao(f.id, f.doc!.usuarioId, options.session);
    await propriedadesRepository.atualizar(f.id, f.doc!.usuarioId, { nome: "Novo" }, options.session, { imagem, atualizadoEm: new Date(20) });
  } finally { modelo.findOne = findOne; modelo.findOneAndUpdate = update; }
});

test("PUT HTTP: autenticação, autorização e erro de conflito seguro", async () => {
  const f = fixture();
  const app = criarApp({ service: f.service, bancoDisponivel: () => true, verificarToken: async token => {
    if (!["a", "b", "sem-perfil"].includes(token)) throw new Error("TOKEN_INVALIDO"); return { uid: token };
  } });
  const server = app.listen(0, "127.0.0.1"); await once(server, "listening");
  const port = (server.address() as { port: number }).port;
  async function put(token: string, body: object = { nome: "Novo" }) {
    const r = await fetch(`http://127.0.0.1:${port}/propriedades/${f.id}`, { method: "PUT",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body), signal: AbortSignal.timeout(5000) });
    return { status: r.status, dados: await r.json() as any };
  }
  try {
    for (const [token, status] of [["", 401], ["invalido", 401], ["sem-perfil", 403], ["b", 404]] as const) {
      assert.equal((await put(token)).status, status);
    }
    assert.equal(f.estado.java, 0); assert.equal(f.estado.escritas, 0);
    f.estado.falhaJava = "indisponivel"; assert.equal((await put("a")).status, 503);
    f.estado.falhaJava = "invalido"; assert.equal((await put("a")).status, 400);
    f.estado.falhaJava = undefined; f.estado.duranteJava = () => { f.doc!.nome = "Concorrente"; };
    const conflito = await put("a"); assert.equal(conflito.status, 409); assert.equal(conflito.dados.codigo, "PROPRIEDADE_ALTERADA");
    assert(!JSON.stringify(conflito).includes("Concorrente")); assert.equal(f.estado.escritas, 0);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
