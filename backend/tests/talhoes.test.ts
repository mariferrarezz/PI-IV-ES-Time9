import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { Types, ClientSession } from "mongoose";

// Somente fixtures e mocks: nenhuma conexão é aberta com MongoDB ou Firebase.
process.env.MONGODB_URI = "mongodb://127.0.0.1:1/sentinela";
process.env.FIREBASE_PROJECT_ID = "demo-sentinela-talhoes";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
const { criarApp } = require("../src/app") as typeof import("../src/app");
const { criarTalhoesService } = require("../src/modules/talhoes/talhoes.service") as typeof import("../src/modules/talhoes/talhoes.service");
const { JavaIndisponivelError } = require("../src/services/validacao-java.service") as typeof import("../src/services/validacao-java.service");
type PropriedadesRepository = import("../src/modules/propriedades/propriedades.repository").PropriedadesRepository;
type TalhoesRepository = import("../src/modules/talhoes/talhoes.repository").TalhoesRepository;
type RegistroTalhao = import("../src/modules/talhoes/talhoes.model").RegistroTalhao;

test("Cadastro de talhões pela API com Java e persistência simulados", async t => {
  const dono = new Types.ObjectId(), outro = new Types.ObjectId(), id = new Types.ObjectId();
  const pai = { _id: id, usuarioId: dono, nome: "Propriedade", municipio: "Cidade", estado: "SP",
    ativa: true, areaTotalHa: 10, criadoEm: new Date(), atualizadoEm: new Date() };
  const session = {} as ClientSession;
  const documentos: RegistroTalhao[] = [];
  let java: "ok" | "invalido" | "ausente" | "inesperado" = "ok";
  let chamadasJava = 0, reservas = 0, transacoes = 0, consultasArea = 0;
  let areaDisponivel = true, arquivadaNaTransacao = false;
  let entradaJava: unknown[] = [];
  let erroPersistencia: unknown;
  const eventos: string[] = [];
  const propriedades = {
    async buscarPorId(propriedadeId: Types.ObjectId, usuarioId: Types.ObjectId) {
      eventos.push("autorizar");
      return propriedadeId.equals(id) && usuarioId.equals(dono) ? pai : null;
    },
  } as PropriedadesRepository;
  const talhoes: TalhoesRepository = {
    async reservarPropriedade(propriedadeId, usuarioId, sessao) {
      reservas++; eventos.push("reservar");
      assert.equal(sessao, session); assert(propriedadeId.equals(id)); assert(usuarioId.equals(dono));
      return { ...pai, ativa: !arquivadaNaTransacao && pai.ativa };
    },
    async areaDisponivel(propriedadeId, area, sessao) {
      consultasArea++; eventos.push("area");
      assert(propriedadeId.equals(id)); assert.equal(area, 2.5); assert.equal(sessao, session);
      return areaDisponivel;
    },
    async criar(propriedadeId, dados, sessao) {
      eventos.push("criar"); assert.equal(sessao, session);
      if (erroPersistencia) throw erroPersistencia;
      const documento = { ...dados, propriedadeId, _id: new Types.ObjectId(), criadoEm: new Date(), atualizadoEm: new Date() } as RegistroTalhao;
      documentos.push(documento);
      return documento;
    },
    async comTransacao(acao) { transacoes++; return acao(session); },
  };
  const service = criarTalhoesService(talhoes, propriedades, {
    async buscarPorFirebaseUid(uid) { return uid === "sem-perfil" ? null : { _id: uid === "a" ? dono : outro }; },
  }, async (nome, area) => {
    chamadasJava++; eventos.push("java"); entradaJava = [nome, area];
    if (java === "ausente") throw new JavaIndisponivelError();
    if (java === "inesperado") throw new Error("SEGREDO_INTERNO");
    return java === "invalido"
      ? { valido: false, erros: ["O nome do talhão é obrigatório.", "A área do talhão deve ser um número finito maior que zero."] }
      : { valido: true, erros: [] };
  });
  const app = criarApp({ talhoesService: service, bancoDisponivel: () => true,
    verificarToken: async token => {
      if (!["a", "b", "sem-perfil"].includes(token)) throw new Error("TOKEN_INVALIDO");
      return { uid: token };
    },
  });
  const servidor = app.listen(0, "127.0.0.1");
  await once(servidor, "listening");
  const port = (servidor.address() as import("node:net").AddressInfo).port;
  async function post(corpo: unknown, token: string | undefined = "a", propriedadeId = String(id)) {
    const resposta = await fetch(`http://127.0.0.1:${port}/propriedades/${propriedadeId}/talhoes`, {
      method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(corpo),
    });
    return { status: resposta.status, corpo: await resposta.json() as any };
  }
  const valido = { nome: "Talhão Norte", areaHa: 2.5 };
  try {
    await t.test("cria somente depois de autorização, Java e área; responde 201", async () => {
      const r = await post(valido);
      assert.equal(r.status, 201); assert.equal(r.corpo.propriedadeId, String(id));
      assert.equal(r.corpo.nome, valido.nome); assert.equal(r.corpo.areaHa, 2.5); assert.equal(r.corpo.ativo, true);
      assert.deepEqual(entradaJava, [valido.nome, 2.5]);
      assert.deepEqual(eventos, ["autorizar", "java", "reservar", "area", "criar"]);
      assert.equal(documentos.length, 1);
    });
    await t.test("erros Java são devolvidos sem iniciar transação ou gravar", async () => {
      java = "invalido";
      const antes = transacoes;
      const r = await post({ nome: "", areaHa: 0 });
      assert.equal(r.status, 400); assert.equal(r.corpo.codigo, "ENTRADA_INVALIDA");
      assert.deepEqual(r.corpo.detalhes, [
        { mensagem: "O nome do talhão é obrigatório." },
        { mensagem: "A área do talhão deve ser um número finito maior que zero." },
      ]);
      assert.deepEqual(entradaJava, ["", 0]); assert.equal(transacoes, antes); assert.equal(documentos.length, 1);
      await post({}); assert.deepEqual(entradaJava, [undefined, undefined]);
    });
    await t.test("Java indisponível: 503 seguro, sem escritas", async () => {
      java = "ausente";
      const antes = reservas;
      const r = await post(valido);
      assert.equal(r.status, 503); assert.equal(r.corpo.codigo, "JAVA_INDISPONIVEL");
      assert.equal(r.corpo.erro, "Serviço de validação Java indisponível");
      assert.equal(reservas, antes); assert.equal(documentos.length, 1);
    });
    await t.test("autenticação, perfil, propriedade de outro usuário e inexistente", async () => {
      const antes = chamadasJava;
      assert.equal((await post(valido, "")).status, 401);
      assert.equal((await post(valido, "invalido")).status, 401);
      assert.equal((await post(valido, "sem-perfil")).status, 403);
      const alheia = await post(valido, "b");
      const inexistente = await post(valido, "a", String(new Types.ObjectId()));
      assert.equal(alheia.status, 404); assert.deepEqual(alheia, inexistente);
      assert.equal(chamadasJava, antes); assert.equal(documentos.length, 1);
    });
    await t.test("tipos, campos protegidos e ID inválido barrados antes do Java", async () => {
      const antes = chamadasJava;
      for (const corpo of [{ ...valido, areaHa: "2.5" }, { ...valido, nome: 1 }, { ...valido, areaHa: null },
        { ...valido, propriedadeId: String(id) }, { ...valido, usuarioId: String(outro) },
        { ...valido, criadoEm: new Date() }, { ...valido, ativo: "true" },
        { ...valido, nome: "x".repeat(151) }, { ...valido, observacoes: "" }]) {
        assert.equal((await post(corpo)).status, 400);
      }
      assert.equal((await post(valido, "a", "ruim")).status, 400);
      assert.equal(chamadasJava, antes); assert.equal(documentos.length, 1);
    });
    await t.test("propriedade inativa recusada antes do Java e reconferida na transação", async () => {
      java = "ok"; pai.ativa = false;
      const antes = chamadasJava;
      assert.equal((await post(valido)).corpo.codigo, "PROPRIEDADE_INATIVA");
      assert.equal(chamadasJava, antes);
      pai.ativa = true; arquivadaNaTransacao = true;
      assert.equal((await post(valido)).corpo.codigo, "PROPRIEDADE_INATIVA");
      arquivadaNaTransacao = false; assert.equal(documentos.length, 1);
    });
    await t.test("excesso da soma das áreas bloqueia persistência; inativo não entra na soma", async () => {
      areaDisponivel = false;
      const r = await post(valido);
      assert.equal(r.status, 409); assert.equal(r.corpo.codigo, "AREA_INSUFICIENTE"); assert.equal(documentos.length, 1);
      const antes = consultasArea;
      assert.equal((await post({ ...valido, ativo: false })).status, 201);
      assert.equal(consultasArea, antes); assert.equal(documentos.length, 2);
      areaDisponivel = true;
    });
    await t.test("falha inesperada mantém resposta 500 existente e não persiste", async () => {
      java = "inesperado";
      const r = await post(valido);
      assert.equal(r.status, 500); assert.equal(r.corpo.codigo, "ERRO_INTERNO");
      assert(!JSON.stringify(r.corpo).includes("SEGREDO")); assert.equal(documentos.length, 2);
      java = "ok";
    });
    await t.test("validações MongoDB e Mongoose continuam no tratamento de erros", async () => {
      erroPersistencia = { code: 121 };
      const r = await post(valido);
      assert.equal(r.status, 422); assert.equal(r.corpo.codigo, "VALIDACAO_BANCO");
      assert.equal(documentos.length, 2); erroPersistencia = undefined;
    });
  } finally {
    servidor.closeAllConnections();
    await new Promise<void>((resolve, reject) => servidor.close(erro => erro ? reject(erro) : resolve()));
  }
});

test("Modelo de talhão mantém restrições documentadas", () => {
  const { TalhaoModel } = require("../src/modules/talhoes/talhoes.model") as typeof import("../src/modules/talhoes/talhoes.model");
  const base = { propriedadeId: new Types.ObjectId(), nome: "Talhão", areaHa: 1 };
  assert.equal(new TalhaoModel(base).validateSync(), undefined);
  for (const alteracao of [{ nome: "" }, { nome: "   " }, { areaHa: 0 }, { areaHa: -1 },
    { areaHa: Infinity }, { areaHa: NaN }, { nome: "x".repeat(151) }]) {
    assert(new TalhaoModel({ ...base, ...alteracao }).validateSync());
  }
  assert.equal(TalhaoModel.collection.name, "talhoes");
  assert.equal(TalhaoModel.schema.options.autoCreate, false);
  assert.equal(TalhaoModel.schema.options.autoIndex, false);
  assert.equal(TalhaoModel.schema.options.strict, "throw");
});
