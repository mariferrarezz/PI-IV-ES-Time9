import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { AddressInfo } from "node:net";

// Valores exclusivos do processo de teste. Nenhuma conexão ou credencial real é usada.
// Todos os CPFs e telefones são fictícios.
process.env.MONGODB_URI = "mongodb://127.0.0.1:1/sentinela";
process.env.FIREBASE_PROJECT_ID = "demo-sentinela-auth";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
const { Types } = require("mongoose") as typeof import("mongoose");
const { criarApp } = require("../src/app") as typeof import("../src/app");
const { criarAuthService } = require("../src/modules/auth/auth.service") as typeof import("../src/modules/auth/auth.service");
const { cpfValido, normalizarTelefone } = require("../src/modules/auth/auth.schema") as typeof import("../src/modules/auth/auth.schema");
type Repo = import("../src/modules/auth/auth.repository").AuthRepository;
type Perfil = import("../src/modules/auth/auth.repository").PerfilUsuario;

const CPF_VALIDO = "529.982.247-25"; // CPF fictício com dígitos verificadores corretos.

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
  const app = criarApp({
    auth: criarAuthService(repo),
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

const cadastroValido = { nomeCompleto: "  Maria da Silva  ", cpf: CPF_VALIDO, telefone: "(19) 99876-5432", aceitouTermos: true };

test("CPF: aceita dígitos verificadores corretos e recusa inválidos e repetidos", () => {
  assert.equal(cpfValido("52998224725"), true);
  assert.equal(cpfValido("52998224724"), false);
  assert.equal(cpfValido("11111111111"), false);
  assert.equal(cpfValido("1234567890"), false);
});

test("Telefone: normaliza formatos e recusa DDD inexistente ou fixo", () => {
  for (const entrada of ["(19) 99876-5432", "19998765432", "+55 19 99876-5432", "55 19 998765432"]) {
    assert.equal(normalizarTelefone(entrada), "+5519998765432");
  }
  assert.equal(normalizarTelefone("(20) 99876-5432"), null); // DDD 20 não existe
  assert.equal(normalizarTelefone("(19) 3876-5432"), null);  // fixo
  assert.equal(normalizarTelefone("(19) 89876-5432"), null); // não começa com 9
});

test("POST /auth/cadastro cria o perfil com uid do token, dados normalizados e termos 1.0", async () => {
  const { repo, perfis } = repoEmMemoria();
  const api = await iniciarApi(repo);
  try {
    const resposta = await api.chamar("POST", "/auth/cadastro", "token-uid-maria", cadastroValido);
    assert.equal(resposta.status, 201);
    const corpo = await resposta.json();
    assert.equal(corpo.nomeCompleto, "Maria da Silva");
    assert.equal(corpo.cpf, "52998224725");
    assert.equal(corpo.telefone, "+5519998765432");
    assert.equal(corpo.termos.versao, "1.0");
    assert.ok(!Number.isNaN(Date.parse(corpo.termos.aceitoEm)));
    assert.equal(corpo.firebaseUid, undefined); // uid não volta na resposta
    assert.equal(perfis.length, 1);
    assert.equal(perfis[0].firebaseUid, "uid-maria");
  } finally { await api.fechar(); }
});

test("POST /auth/cadastro recusa firebaseUid no corpo, termos não aceitos e dados inválidos", async () => {
  const { repo, perfis } = repoEmMemoria();
  const api = await iniciarApi(repo);
  try {
    const invalidos = [
      { ...cadastroValido, firebaseUid: "outro-uid" },
      { ...cadastroValido, aceitouTermos: false },
      { ...cadastroValido, cpf: "111.111.111-11" },
      { ...cadastroValido, telefone: "(19) 3876-5432" },
      { ...cadastroValido, nomeCompleto: " " },
      { nomeCompleto: "Maria da Silva" },
    ];
    for (const corpo of invalidos) {
      const resposta = await api.chamar("POST", "/auth/cadastro", "token-uid-maria", corpo);
      assert.equal(resposta.status, 400);
      const texto = await resposta.text();
      assert.ok(!texto.includes("111111111"), "a resposta não pode ecoar o CPF enviado");
    }
    assert.equal(perfis.length, 0);
  } finally { await api.fechar(); }
});

test("POST /auth/cadastro devolve 409 quando o perfil já existe (inclusive em corrida)", async () => {
  const { repo } = repoEmMemoria();
  const api = await iniciarApi(repo);
  try {
    assert.equal((await api.chamar("POST", "/auth/cadastro", "token-uid-maria", cadastroValido)).status, 201);
    const repetido = await api.chamar("POST", "/auth/cadastro", "token-uid-maria", cadastroValido);
    assert.equal(repetido.status, 409);
    assert.equal((await repetido.json()).codigo, "PERFIL_JA_EXISTE");
  } finally { await api.fechar(); }

  // Corrida: a busca não encontra, mas o índice único recusa a gravação.
  const corrida = criarAuthService({
    async buscarPorFirebaseUid() { return null; },
    async criar() { throw { code: 11000 }; },
  });
  await assert.rejects(corrida.cadastrar("uid-maria", cadastroValido),
    (erro: any) => erro.statusCode === 409 && erro.code === "PERFIL_JA_EXISTE");
});

test("GET /auth/me devolve 404 sem perfil e o perfil depois do cadastro", async () => {
  const { repo } = repoEmMemoria();
  const api = await iniciarApi(repo);
  try {
    const antes = await api.chamar("GET", "/auth/me", "token-uid-maria");
    assert.equal(antes.status, 404);
    assert.equal((await antes.json()).codigo, "PERFIL_NAO_ENCONTRADO");
    await api.chamar("POST", "/auth/cadastro", "token-uid-maria", cadastroValido);
    const depois = await api.chamar("GET", "/auth/me", "token-uid-maria");
    assert.equal(depois.status, 200);
    assert.equal((await depois.json()).nomeCompleto, "Maria da Silva");
    // Outro usuário não enxerga o perfil da Maria.
    assert.equal((await api.chamar("GET", "/auth/me", "token-uid-joao")).status, 404);
  } finally { await api.fechar(); }
});

test("Rotas /auth exigem token válido", async () => {
  const { repo } = repoEmMemoria();
  const api = await iniciarApi(repo);
  try {
    assert.equal((await api.chamar("GET", "/auth/me")).status, 401);
    assert.equal((await api.chamar("GET", "/auth/me", "invalido")).status, 401);
    assert.equal((await api.chamar("POST", "/auth/cadastro", undefined, cadastroValido)).status, 401);
  } finally { await api.fechar(); }
});

test("Modelo de usuário respeita o validator da coleção usuarios", async () => {
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const vm = require("node:vm") as typeof import("node:vm");
  const mongoose = require("mongoose") as typeof import("mongoose");
  const { UsuarioModel } = require("../src/modules/auth/auth.model") as typeof import("../src/modules/auth/auth.model");
  const doc = new UsuarioModel({
    firebaseUid: "uid-maria", nomeCompleto: "Maria da Silva", cpf: "52998224725", telefone: "+5519998765432",
    termos: { versao: "1.0", aceitoEm: new Date() }, criadoEm: new Date(), atualizadoEm: new Date(),
  });
  await doc.validate();
  const objeto = doc.toObject();
  assert(!("__v" in objeto)); assert(!("createdAt" in objeto));
  assert.equal(UsuarioModel.collection.name, "usuarios");
  assert.deepEqual(UsuarioModel.schema.indexes(), []);
  const literal = fs.readFileSync(path.resolve(__dirname, "../../database/validators/validar-usuarios.mongodb.js"), "utf8");
  const cfg = vm.runInNewContext("(" + literal.slice(literal.indexOf("db.runCommand(") + 14, literal.lastIndexOf(");")) + ")");
  const { errosSchema } = require("../../database/seed/lib-bd6.cjs");
  assert.deepEqual(errosSchema(mongoose.mongo.BSON.EJSON.serialize(objeto), cfg.validator.$jsonSchema), []);
});
