import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { AddressInfo } from "node:net";

// Valores exclusivos do processo de teste. Nenhuma conexão ou credencial real é usada.
// Todos os dados são fictícios.
process.env.MONGODB_URI = "mongodb://127.0.0.1:1/sentinela";
process.env.FIREBASE_PROJECT_ID = "demo-sentinela-questionario";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
const { Types } = require("mongoose") as typeof import("mongoose");
const { criarApp } = require("../src/app") as typeof import("../src/app");
const { criarAuthService } = require("../src/modules/auth/auth.service") as typeof import("../src/modules/auth/auth.service");
const { criarCulturasService } = require("../src/modules/catalogo/culturas.service") as typeof import("../src/modules/catalogo/culturas.service");
const { questionarioSchema } = require("../src/modules/auth/auth.schema") as typeof import("../src/modules/auth/auth.schema");
type Repo = import("../src/modules/auth/auth.repository").AuthRepository;
type Perfil = import("../src/modules/auth/auth.repository").PerfilUsuario;
type CulturasRepo = import("../src/modules/catalogo/culturas.repository").CulturasRepository;

const SOJA = new Types.ObjectId();
const MILHO = new Types.ObjectId();
const INATIVA = new Types.ObjectId();

function culturasEmMemoria(): CulturasRepo {
  const lista = [
    { _id: MILHO, nome: "Milho", ativa: true },
    { _id: SOJA, nome: "Soja", ativa: true },
    { _id: INATIVA, nome: "Cultura Antiga", ativa: false },
  ];
  return {
    async listarAtivas() { return lista.filter(c => c.ativa).map(({ _id, nome }) => ({ _id, nome })); },
    async contarAtivas(ids) {
      return ids.filter(id => lista.some(c => c.ativa && c._id.equals(id))).length;
    },
  };
}

function repoEmMemoria() {
  const perfis: Perfil[] = [];
  const repo: Repo = {
    async buscarPorFirebaseUid(uid) { return perfis.find(p => p.firebaseUid === uid) ?? null; },
    async criar(dados) {
      const agora = new Date();
      const perfil = { ...dados, _id: new Types.ObjectId(), criadoEm: agora, atualizadoEm: agora };
      perfis.push(perfil);
      return perfil;
    },
    async salvarQuestionario(uid, questionario) {
      const perfil = perfis.find(p => p.firebaseUid === uid && !p.questionario);
      if (!perfil) return null;
      perfil.questionario = questionario;
      return perfil;
    },
  };
  return { repo, perfis };
}

async function iniciarApi(repo: Repo) {
  const culturas = culturasEmMemoria();
  const app = criarApp({
    auth: criarAuthService(repo, culturas),
    culturas: criarCulturasService(culturas),
    // Token fictício: "token-<uid>" autentica o usuário <uid>.
    verificarToken: async token => {
      if (!token.startsWith("token-")) throw { code: "auth/invalid-id-token" };
      return { uid: token.slice(6) };
    },
    bancoDisponivel: () => true,
  });
  const servidor = app.listen(0);
  await once(servidor, "listening");
  const base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
  const chamar = (metodo: string, caminho: string, token?: string, corpo?: unknown) =>
    fetch(base + caminho, {
      method: metodo,
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  return { chamar, fechar: () => new Promise<void>(r => servidor.close(() => r())) };
}

const cadastro = { nomeCompleto: "Maria da Silva", cpf: "529.982.247-25", telefone: "(19) 99876-5432", aceitouTermos: true };
const respostas = {
  portePropriedade: "pequena",
  quantidadeCulturas: "2",
  culturasIds: [String(SOJA), String(MILHO)],
  problemasFrequentes: ["pragas", "doencas"],
  frequenciaProblemas: "as_vezes",
  identificaProblemasSozinho: "nao",
};

test("Questionário: combinações de problemas frequentes conforme a regra do banco", () => {
  const ok = (problemasFrequentes: string[]) => questionarioSchema.safeParse({ ...respostas, problemasFrequentes }).success;
  assert.equal(ok(["pragas"]), true);
  assert.equal(ok(["doencas"]), true);
  assert.equal(ok(["doencas", "pragas"]), true);
  assert.equal(ok(["nao_identificado"]), true);
  assert.equal(ok(["nao_identificado", "pragas"]), false);
  assert.equal(ok(["pragas", "pragas"]), false);
  assert.equal(ok([]), false);
});

test("Questionário: exige cultura do catálogo ou outra cultura digitada", () => {
  const ok = (extra: object) => questionarioSchema.safeParse({ ...respostas, ...extra }).success;
  assert.equal(ok({ culturasIds: [] }), false);
  assert.equal(ok({ culturasIds: [], outraCultura: "   " }), false);
  assert.equal(ok({ culturasIds: [], outraCultura: "Girassol" }), true);
  assert.equal(ok({ culturasIds: undefined, outraCultura: "Girassol" }), true);
  assert.equal(ok({ outraCultura: "Algodão" }), true); // as duas juntas também valem
  assert.equal(ok({ culturasIds: [String(SOJA), String(SOJA)] }), false);
  assert.equal(ok({ culturasIds: ["nao-e-id"] }), false);
  assert.equal(ok({ culturasIds: [], outraCultura: "x".repeat(151) }), false);
});

test("GET /culturas lista só as ativas, com id e nome, e exige token", async () => {
  const { repo } = repoEmMemoria();
  const api = await iniciarApi(repo);
  try {
    assert.equal((await api.chamar("GET", "/culturas")).status, 401);
    const resposta = await api.chamar("GET", "/culturas", "token-uid-maria");
    assert.equal(resposta.status, 200);
    assert.deepEqual(await resposta.json(), [
      { id: String(MILHO), nome: "Milho" },
      { id: String(SOJA), nome: "Soja" },
    ]);
  } finally { await api.fechar(); }
});

test("POST /auth/questionario grava uma vez, com versão e data do servidor", async () => {
  const { repo, perfis } = repoEmMemoria();
  const api = await iniciarApi(repo);
  try {
    await api.chamar("POST", "/auth/cadastro", "token-uid-maria", cadastro);
    const antes = await (await api.chamar("GET", "/auth/me", "token-uid-maria")).json();
    assert.equal(antes.questionario, null);

    const resposta = await api.chamar("POST", "/auth/questionario", "token-uid-maria", respostas);
    assert.equal(resposta.status, 201);
    const corpo = await resposta.json();
    assert.equal(corpo.questionario.versao, "1.0");
    assert.deepEqual(corpo.questionario.culturasIds, [String(SOJA), String(MILHO)]);
    assert.ok(!Number.isNaN(Date.parse(corpo.questionario.concluidoEm)));
    assert.equal(corpo.questionario.outraCultura, undefined);
    assert.ok(perfis[0].questionario!.culturasIds[0] instanceof Types.ObjectId);

    const depois = await (await api.chamar("GET", "/auth/me", "token-uid-maria")).json();
    assert.equal(depois.questionario.portePropriedade, "pequena");

    // Não precisa (nem pode) responder de novo.
    const repetido = await api.chamar("POST", "/auth/questionario", "token-uid-maria", { ...respostas, portePropriedade: "grande" });
    assert.equal(repetido.status, 409);
    assert.equal((await repetido.json()).codigo, "QUESTIONARIO_JA_RESPONDIDO");
    assert.equal(perfis[0].questionario!.portePropriedade, "pequena");
  } finally { await api.fechar(); }
});

test("POST /auth/questionario grava a outra cultura sem cultura do catálogo", async () => {
  const { repo, perfis } = repoEmMemoria();
  const api = await iniciarApi(repo);
  try {
    await api.chamar("POST", "/auth/cadastro", "token-uid-maria", cadastro);
    const resposta = await api.chamar("POST", "/auth/questionario", "token-uid-maria",
      { ...respostas, quantidadeCulturas: "1", culturasIds: [], outraCultura: "  Girassol  " });
    assert.equal(resposta.status, 201);
    assert.equal(perfis[0].questionario!.outraCultura, "Girassol");
    assert.deepEqual(perfis[0].questionario!.culturasIds, []);
  } finally { await api.fechar(); }
});

test("POST /auth/questionario recusa sem perfil, cultura inativa/inexistente e campos extras", async () => {
  const { repo, perfis } = repoEmMemoria();
  const api = await iniciarApi(repo);
  try {
    const semPerfil = await api.chamar("POST", "/auth/questionario", "token-uid-maria", respostas);
    assert.equal(semPerfil.status, 404);
    assert.equal((await semPerfil.json()).codigo, "PERFIL_NAO_ENCONTRADO");

    await api.chamar("POST", "/auth/cadastro", "token-uid-maria", cadastro);
    for (const id of [INATIVA, new Types.ObjectId()]) {
      const resposta = await api.chamar("POST", "/auth/questionario", "token-uid-maria", { ...respostas, culturasIds: [String(id)] });
      assert.equal(resposta.status, 400);
      assert.equal((await resposta.json()).codigo, "CULTURA_INDISPONIVEL");
    }
    for (const extra of [{ versao: "9.9" }, { concluidoEm: "2020-01-01" }, { firebaseUid: "outro" }]) {
      const resposta = await api.chamar("POST", "/auth/questionario", "token-uid-maria", { ...respostas, ...extra });
      assert.equal(resposta.status, 400);
      assert.equal((await resposta.json()).codigo, "ENTRADA_INVALIDA");
    }
    assert.equal((await api.chamar("POST", "/auth/questionario", undefined, respostas)).status, 401);
    assert.equal(perfis[0].questionario, undefined);
  } finally { await api.fechar(); }
});

test("POST /auth/questionario devolve 409 se outro envio gravou primeiro (corrida)", async () => {
  const perfil = { _id: new Types.ObjectId(), firebaseUid: "uid-maria" } as Perfil;
  const corrida = criarAuthService({
    async buscarPorFirebaseUid() { return perfil; },
    async criar() { throw new Error("não usado"); },
    async salvarQuestionario() { return null; },
  }, culturasEmMemoria());
  await assert.rejects(corrida.responderQuestionario("uid-maria", respostas),
    (erro: any) => erro.statusCode === 409 && erro.code === "QUESTIONARIO_JA_RESPONDIDO");
});

test("Modelo com questionário respeita o validator da coleção usuarios", async () => {
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const vm = require("node:vm") as typeof import("node:vm");
  const mongoose = require("mongoose") as typeof import("mongoose");
  const { UsuarioModel } = require("../src/modules/auth/auth.model") as typeof import("../src/modules/auth/auth.model");
  const literal = fs.readFileSync(path.resolve(__dirname, "../../database/validators/validar-usuarios.mongodb.js"), "utf8");
  const cfg = vm.runInNewContext("(" + literal.slice(literal.indexOf("db.runCommand(") + 14, literal.lastIndexOf(");")) + ")");
  const { errosSchema } = require("../../database/seed/lib-bd6.cjs");
  const base = {
    firebaseUid: "uid-maria", nomeCompleto: "Maria da Silva", cpf: "52998224725", telefone: "+5519998765432",
    termos: { versao: "1.0", aceitoEm: new Date() }, criadoEm: new Date(), atualizadoEm: new Date(),
  };
  const questionario = {
    versao: "1.0", portePropriedade: "media", quantidadeCulturas: "4_ou_mais", culturasIds: [SOJA],
    problemasFrequentes: ["nao_identificado"], frequenciaProblemas: "sempre", identificaProblemasSozinho: "as_vezes",
    concluidoEm: new Date(),
  };
  const casos = [
    base, // sem questionário: o campo não pode aparecer
    { ...base, questionario },
    { ...base, questionario: { ...questionario, culturasIds: [], outraCultura: "Girassol" } },
  ];
  for (const dados of casos) {
    const doc = new UsuarioModel(dados);
    await doc.validate();
    const objeto = doc.toObject();
    if (!("questionario" in dados)) assert(!("questionario" in objeto));
    assert.deepEqual(errosSchema(mongoose.mongo.BSON.EJSON.serialize(objeto), cfg.validator.$jsonSchema), []);
  }
});
