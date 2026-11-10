import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

// Valores exclusivos do processo de teste. Nenhuma conexão ou credencial real é usada.
process.env.MONGODB_URI = "mongodb://127.0.0.1:1/sentinela";
process.env.FIREBASE_PROJECT_ID = "demo-sentinela-bd8";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
const mongoose = require("mongoose") as typeof import("mongoose");
const { Types } = mongoose;
const { criarApp } = require("../src/app") as typeof import("../src/app");
const { criarPropriedadesService } = require("../src/modules/propriedades/propriedades.service") as typeof import("../src/modules/propriedades/propriedades.service");
const { PropriedadeModel } = require("../src/modules/propriedades/propriedades.model") as typeof import("../src/modules/propriedades/propriedades.model");
const { criarPropriedadeSchema } = require("../src/modules/propriedades/propriedades.schema") as typeof import("../src/modules/propriedades/propriedades.schema");
const { connectDatabase, disconnectDatabase } = require("../src/config/database") as typeof import("../src/config/database");
type Repo = import("../src/modules/propriedades/propriedades.repository").PropriedadesRepository;
type Registro = import("../src/modules/propriedades/propriedades.model").RegistroPropriedade;

test("BD8 local: falha no fixture registra os seis cenários interrompidos", () => {
  // Isola somente a função pura do relatório, sem carregar .env ou executar o harness.
  const fonte = fs.readFileSync(path.resolve(__dirname, "integracao-real-bd8.cjs"), "utf8");
  const inicio = fonte.indexOf("function criarRegistroCenarios()");
  const fim = fonte.indexOf("const args =", inicio);
  assert(inicio >= 0 && fim > inicio);
  const criar = vm.runInNewContext(fonte.slice(inicio, fim) + "; criarRegistroCenarios", {assert});
  const registro = criar();
  assert.equal(registro.testes.length, 29);
  // Simula os mesmos casos concluídos antes da conexão direta do fixture.
  for (const caso of registro.testes.slice(0, 23)) {
    registro.iniciar(caso.teste);
    registro.aprovar({});
  }
  registro.falhar("fixture_temporario_talhao");
  const resumo = registro.finalizar();
  assert.equal(resumo.aprovado, 23);
  assert.equal(resumo.reprovado, 1); // Etapa técnica extra, não um novo caso do plano.
  assert.equal(resumo.interrompido, 6);
  assert.equal(resumo.omitido, 0);
  assert.equal(resumo.cenariosNaoExecutados, 6);
  assert(registro.testes.slice(23, 29).every((caso: any) => !caso.executado));

  const completo = criar();
  for (const caso of completo.testes) { completo.iniciar(caso.teste); completo.aprovar({}); }
  assert.equal(completo.finalizar().aprovado, 29);
  assert.equal(completo.finalizar().cenariosNaoExecutados, 0);

  const omitido = criar();
  omitido.omitir("Perfil ausente", "Token não fornecido");
  omitido.iniciar("Readiness real");
  omitido.aprovar({});
  omitido.falhar("Readiness real"); // Asserção após conferir o status HTTP.
  const parcial = omitido.finalizar();
  assert.equal(parcial.omitido, 1);
  assert.equal(parcial.reprovado, 1);
  assert.equal(parcial.aprovado, 0);
  assert.equal(parcial.interrompido, 27);
  assert.equal(parcial.cenariosNaoExecutados, 28);
});

test("BD8 local: modelo e DTO respeitam o validator atual, sem índices automáticos", async () => {
  const dados = { nome: "Teste", municipio: "Cidade", estado: "SP", areaTotalHa: 1.5 };
  const doc = new PropriedadeModel({ ...dados, usuarioId: new Types.ObjectId(), criadoEm: new Date(), atualizadoEm: new Date() });
  await doc.validate();
  const objeto = doc.toObject();
  assert(!("__v" in objeto)); assert(!("ownerUid" in objeto)); assert(!("createdAt" in objeto));
  assert.equal(PropriedadeModel.collection.name, "propriedades");
  assert.deepEqual(PropriedadeModel.schema.indexes(), []);
  assert.equal(PropriedadeModel.schema.options.autoCreate, false);
  assert.equal(PropriedadeModel.schema.options.autoIndex, false);
  const literal = fs.readFileSync(path.resolve(__dirname, "../../database/validators/validar-propriedades.mongodb.js"), "utf8");
  const cfg = vm.runInNewContext("(" + literal.slice(literal.indexOf("db.runCommand(") + 14, literal.lastIndexOf(");")) + ")");
  const { errosSchema } = require("../../database/seed/lib-bd6.cjs");
  assert.deepEqual(errosSchema(mongoose.mongo.BSON.EJSON.serialize(objeto), cfg.validator.$jsonSchema), []);
  for (const entrada of [
    { ...dados, municipio: undefined }, { ...dados, estado: "XX" }, { ...dados, nome: "  " },
    { ...dados, areaTotalHa: 0 }, { ...dados, areaTotalHa: Infinity }, { ...dados, areaTotalHa: "2" },
    { ...dados, usuarioId: String(new Types.ObjectId()) }, { ...dados, descricao: "legado" },
  ]) assert.equal(criarPropriedadeSchema.safeParse(entrada).success, false);
});

test("BD8 local: pool reutilizado, banco explícito e falha de conexão sem URI", async () => {
  const conectar = mongoose.connect, desconectar = mongoose.disconnect;
  let chamadas = 0, fechamentos = 0;
  try {
    mongoose.connect = (async (_uri: string, opcoes: import("mongoose").ConnectOptions) => {
      chamadas++; assert.equal(opcoes.dbName, "sentinela");
      assert.equal(opcoes.autoIndex, false); assert.equal(opcoes.autoCreate, false);
      await new Promise(resolve => setTimeout(resolve, 5)); return mongoose;
    }) as typeof conectar;
    await Promise.all([connectDatabase(), connectDatabase()]);
    assert.equal(chamadas, 1);
    mongoose.disconnect = (async () => { fechamentos++; }) as typeof desconectar;
    await disconnectDatabase(); assert.equal(fechamentos, 1);
    mongoose.connect = (async () => { throw new Error("SEGREDO_SIMULADO_NAO_EXIBIR"); }) as typeof conectar;
    await assert.rejects(connectDatabase(), (e: any) => e.code === "BANCO_INDISPONIVEL" && !e.message.includes("SEGREDO"));
  } finally { mongoose.connect = conectar; mongoose.disconnect = desconectar; }
});

test("BD8 local: repository envia ObjectId, filtro de dono e validação ao Mongoose", async () => {
  const { propriedadesRepository } = require("../src/modules/propriedades/propriedades.repository");
  const model = PropriedadeModel as any;
  const nomes = ["create", "find", "findOne", "findOneAndUpdate", "deleteOne"];
  const originais = Object.fromEntries(nomes.map(nome => [nome, model[nome]]));
  const usuarioId = new Types.ObjectId(), _id = new Types.ObjectId(), session = {};
  const registro = { _id, usuarioId, nome: "Nome", municipio: "Cidade", estado: "SP", ativa: true };
  const consulta = { lean() { return this; }, async exec() { return registro; } };
  let chamadas = 0;
  const conferirDono = (filtro: any) => {
    chamadas++; assert(filtro.usuarioId.equals(usuarioId)); assert(!("ownerUid" in filtro));
    if (filtro._id) assert(filtro._id.equals(_id));
  };
  try {
    model.create = async (d: any) => { conferirDono(d); return { toObject: () => registro }; };
    model.find = (f: any) => { conferirDono(f); return consulta; };
    model.findOne = (f: any) => { conferirDono(f); return consulta; };
    model.findOneAndUpdate = (f: any, atualizacao: any, op: any) => {
      conferirDono(f); assert.deepEqual(atualizacao, { $set: { nome: "Novo" } });
      assert.equal(op.runValidators, true); assert.equal(op.session, session); assert.equal(op.strict, "throw"); return consulta;
    };
    model.deleteOne = async (f: any, op: any) => { conferirDono(f); assert.equal(op.session, session); return { deletedCount: 1 }; };
    await propriedadesRepository.criar(usuarioId, { nome: "Nome", municipio: "Cidade", estado: "SP" });
    await propriedadesRepository.listarPorUsuario(usuarioId);
    await propriedadesRepository.buscarPorId(_id, usuarioId);
    await propriedadesRepository.atualizar(_id, usuarioId, { nome: "Novo" }, session);
    await propriedadesRepository.excluir(_id, usuarioId, session);
    assert.equal(chamadas, 5);
  } finally { for (const nome of nomes) model[nome] = originais[nome]; }
});

test("BD8 local: rotas reais com repositório e verificador Firebase simulados (não é Atlas)", async t => {
  const usuarios = new Map([["a", new Types.ObjectId()], ["b", new Types.ObjectId()]]);
  const documentos = new Map<string, Registro>();
  let dependentes = false, areaExcedida = false, disponivel = true, erroOperacao: unknown;
  const buscar = (id: import("mongoose").Types.ObjectId, usuario: import("mongoose").Types.ObjectId) => {
    const doc = documentos.get(String(id)); return doc && doc.usuarioId.equals(usuario) ? doc : null;
  };
  const repo: Repo = {
    async criar(usuarioId, dados) {
      if (erroOperacao) throw erroOperacao;
      const doc = { ...dados, ativa: dados.ativa ?? true, usuarioId, _id: new Types.ObjectId(), criadoEm: new Date(), atualizadoEm: new Date() } as Registro;
      documentos.set(String(doc._id), doc); return doc;
    },
    async listarPorUsuario(usuarioId) { return [...documentos.values()].filter(d => d.usuarioId.equals(usuarioId)); },
    async buscarPorId(id, usuarioId) { return buscar(id, usuarioId); },
    async atualizar(id, usuarioId, dados) {
      const doc = buscar(id, usuarioId); if (!doc) return null;
      const novo = { ...doc, ...dados, atualizadoEm: new Date() }; documentos.set(String(id), novo); return novo;
    },
    async excluir(id, usuarioId) { return buscar(id, usuarioId) ? documentos.delete(String(id)) : false; },
    async temTalhoes() { return dependentes; },
    async areaAtivaExcede() { return areaExcedida; },
    async comTransacao(acao) { return acao({} as import("mongoose").ClientSession); },
  };
  const service = criarPropriedadesService(repo, { async buscarPorFirebaseUid(uid) { const id = usuarios.get(uid); return id ? { _id: id } : null; } });
  const app = criarApp({ service, bancoDisponivel: () => disponivel, verificarToken: async token => {
    if (!["a", "b", "sem-perfil"].includes(token)) throw new Error("TOKEN_SIMULADO");
    return { uid: token };
  } });
  const servidor = app.listen(0, "127.0.0.1"); await once(servidor, "listening");
  const endereco = servidor.address() as import("node:net").AddressInfo;
  async function pedido(metodo: string, rota: string, token?: string, corpo?: unknown) {
    const resposta = await fetch(`http://127.0.0.1:${endereco.port}${rota}`, {
      method: metodo, headers: { ...(token ? { Authorization: "Bearer " + token } : {}), "Content-Type": "application/json" },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
    return { status: resposta.status, corpo: resposta.status === 204 ? null : await resposta.json() as any };
  }
  let id = "";
  const valido = { nome: "Propriedade fictícia", municipio: "Cidade", estado: "SP" };
  try {
    await t.test("autenticação obrigatória e perfil ausente sem criação automática", async () => {
      assert.equal((await pedido("GET", "/propriedades")).status, 401);
      assert.equal((await pedido("GET", "/propriedades", "invalido")).status, 401);
      const r = await pedido("POST", "/propriedades", "sem-perfil", valido);
      assert.equal(r.status, 403); assert.equal(r.corpo.codigo, "PERFIL_AUSENTE"); assert.equal(documentos.size, 0);
    });
    await t.test("inserção, vínculo do token, listagem, ID e persistência por nova consulta", async () => {
      const r = await pedido("POST", "/propriedades", "a", valido);
      assert.equal(r.status, 201); id = r.corpo._id;
      assert.equal(r.corpo.usuarioId, String(usuarios.get("a")));
      assert.equal((await pedido("GET", "/propriedades/" + id, "a")).corpo.nome, valido.nome);
      assert.equal((await pedido("GET", "/propriedades", "a")).corpo.length, 1);
      assert.equal((await pedido("GET", "/propriedades", "b")).corpo.length, 0);
    });
    await t.test("isolamento dos produtores em GET, PUT e DELETE", async () => {
      for (const metodo of ["GET", "PUT", "DELETE"]) {
        assert.equal((await pedido(metodo, "/propriedades/" + id, "b", metodo === "PUT" ? { nome: "Outro" } : undefined)).status, 404);
      }
      assert(documentos.has(id));
    });
    await t.test("ID inválido/inexistente, atualização protegida e validação", async () => {
      assert.equal((await pedido("GET", "/propriedades/ruim", "a")).status, 400);
      assert.equal((await pedido("GET", "/propriedades/" + new Types.ObjectId(), "a")).status, 404);
      for (const corpo of [{ usuarioId: String(usuarios.get("b")) }, { _id: id }, { criadoEm: new Date() }, { __v: 2 }, { descricao: "legado" }, {}, { estado: "XX" }]) {
        assert.equal((await pedido("PUT", "/propriedades/" + id, "a", corpo)).status, 400);
      }
      assert.equal((await pedido("POST", "/propriedades", "a", { ...valido, municipio: undefined })).status, 400);
      const malformada = await fetch(`http://127.0.0.1:${endereco.port}/propriedades`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer a" }, body: "{JSON_INVALIDO",
      });
      assert.equal(malformada.status, 400);
      assert(!(await malformada.text()).includes("JSON_INVALIDO"));
    });
    await t.test("atualização válida, área insuficiente e exclusão com dependentes", async () => {
      const r = await pedido("PUT", "/propriedades/" + id, "a", { observacoes: "Atualizado", ativa: false });
      assert.equal(r.status, 200); assert.equal((await pedido("GET", "/propriedades/" + id, "a")).corpo.observacoes, "Atualizado");
      areaExcedida = true;
      assert.equal((await pedido("PUT", "/propriedades/" + id, "a", { areaTotalHa: 1 })).corpo.codigo, "AREA_INSUFICIENTE");
      areaExcedida = false; dependentes = true;
      const bloqueada = await pedido("DELETE", "/propriedades/" + id, "a");
      assert.equal(bloqueada.status, 409); assert.equal(bloqueada.corpo.codigo, "POSSUI_DEPENDENTES"); assert(documentos.has(id));
      dependentes = false;
      assert.equal((await pedido("DELETE", "/propriedades/" + id, "a")).status, 204);
      assert.equal((await pedido("GET", "/propriedades/" + id, "a")).status, 404);
    });
    await t.test("indisponibilidade controlada mantém servidor vivo e sem dados sensíveis", async () => {
      disponivel = false;
      assert.equal((await pedido("GET", "/ready")).status, 503);
      assert.equal((await pedido("GET", "/propriedades", "a")).status, 503);
      assert.equal((await pedido("GET", "/health")).status, 200);
      disponivel = true;
      assert.equal((await pedido("GET", "/ready")).status, 200);
      for (const [erro, status] of [[{ code: 121 }, 422], [{ code: 11000 }, 409], [{ name: "MongoNetworkError" }, 503]] as const) {
        erroOperacao = { ...erro, message: "SEGREDO_SIMULADO_NAO_EXIBIR" };
        const r = await pedido("POST", "/propriedades", "a", valido);
        assert.equal(r.status, status); assert(!JSON.stringify(r.corpo).includes("SEGREDO"));
      }
      erroOperacao = undefined;
    });
  } finally { servidor.closeAllConnections(); await new Promise<void>(resolve => servidor.close(() => resolve())); }
});
