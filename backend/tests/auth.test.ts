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
const { calcularIniciais } = require("../src/modules/auth/auth.service") as typeof import("../src/modules/auth/auth.service");
const { cpfValido, normalizarTelefone } = require("../src/modules/auth/auth.schema") as typeof import("../src/modules/auth/auth.schema");
type Repo = import("../src/modules/auth/auth.repository").AuthRepository;
type Perfil = import("../src/modules/auth/auth.repository").PerfilUsuario;

const CPF_VALIDO = "529.982.247-25"; // CPF fictício com dígitos verificadores corretos.
const { JavaIndisponivelError } = require("../src/services/validacao-java.service") as typeof import("../src/services/validacao-java.service");
type ValidacoesJava = import("../src/modules/auth/auth.service").ValidacoesJava;
type Resultado = { valido: boolean; erros: string[] };

// Java simulado: guarda o que recebeu. Os testes com o Java real são os test:*:java da Julia.
function javaSimulado(
  cadastro: Resultado | Error = { valido: true, erros: [] },
  opcionais: Resultado | Error = { valido: true, erros: [] },
) {
  const chamadas: Parameters<ValidacoesJava["validarCadastroPerfil"]>[0][] = [];
  const chamadasOpcionais: Parameters<ValidacoesJava["validarOpcionaisPerfil"]>[0][] = [];
  const java: ValidacoesJava = {
    async validarOpcionaisPerfil(campos) {
      chamadasOpcionais.push(campos);
      if (opcionais instanceof Error) throw opcionais;
      return opcionais;
    },
    async validarCadastroPerfil(campos) {
      chamadas.push(campos);
      if (cadastro instanceof Error) throw cadastro;
      return cadastro;
    },
    async validarQuestionario() { return { valido: true, erros: [] }; },
  };
  return { java, chamadas, chamadasOpcionais };
}

function repoEmMemoria() {
  const perfis: Perfil[] = [];
  const repo: Repo = {
    async indicesUnicosProntos() { return true; },
    async existeOutroComCampo(campo, valor, excetoUid) { return perfis.some(p => p[campo] === valor && p.firebaseUid !== excetoUid); },
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
    async atualizarNomePublico(uid, nomePublico) {
      const perfil = perfis.find(p => p.firebaseUid === uid);
      if (!perfil) return null;
      if (nomePublico === null) delete perfil.nomePublico; else perfil.nomePublico = nomePublico;
      return perfil;
    },
  };
  return { repo, perfis };
}

async function iniciarApi(repo: Repo, java = javaSimulado().java) {
  const app = criarApp({
    auth: criarAuthService(repo, undefined, java),
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

const cadastroValido = {
  nomeCompleto: "  Maria da Silva  ", cpf: CPF_VALIDO, telefone: "(19) 99876-5432", canalCodigoPreferido: "email", aceitouTermos: true,
};

test('Dados da conta não podem ser trocados depois do cadastro: PATCH /auth/dados-conta não existe', async () => {
  const { repo, perfis } = repoEmMemoria();
  await repo.criar({ firebaseUid: 'dono', nomeCompleto: 'Maria Silva', cpf: '52998224725', telefone: '+5519998765432', canalCodigoPreferido: 'email', termos: { versao: '1', aceitoEm: new Date() } });
  const api = await iniciarApi(repo);
  try {
    const resposta = await api.chamar('PATCH', '/auth/dados-conta', 'token-dono', { nomeCompleto: 'Maria Souza', cpf: CPF_VALIDO, telefone: '(11) 99999-0000' });
    assert.equal(resposta.status, 404);
    assert.equal(perfis[0].nomeCompleto, 'Maria Silva');
    assert.equal(perfis[0].telefone, '+5519998765432');
  } finally { await api.fechar(); }
});

test("CPF: exige exatamente 11 dígitos, inclusive sequências repetidas", () => {
  assert.equal(cpfValido("52998224725"), true);
  assert.equal(cpfValido("52998224724"), true);
  assert.equal(cpfValido("11111111111"), true);
  assert.equal(cpfValido("1234567890"), false);
  assert.equal(cpfValido("123456789012"), false);
});

test('CPF e telefone duplicados são rejeitados no cadastro', async () => {
  const { repo } = repoEmMemoria();
  const service = criarAuthService(repo, undefined, javaSimulado().java);
  await service.cadastrar('primeiro', cadastroValido);
  await assert.rejects(service.cadastrar('segundo', { ...cadastroValido, cpf: '52998224725', telefone: '(11) 99876-5432' }),
    (e: any) => e.code === 'CPF_JA_CADASTRADO');
  await assert.rejects(service.cadastrar('segundo', { ...cadastroValido, cpf: '11111111111', telefone: '+55 19 99876-5432' }),
    (e: any) => e.code === 'TELEFONE_JA_CADASTRADO');
  await service.cadastrar('segundo', { ...cadastroValido, cpf: '11111111111', telefone: '(11) 99876-5432' });
});

test('gravação é bloqueada sem índices e conflito concorrente é identificado por campo', async () => {
  const { repo } = repoEmMemoria();
  const semIndice = criarAuthService({ ...repo, async indicesUnicosProntos() { return false; } }, undefined, javaSimulado().java);
  await assert.rejects(semIndice.cadastrar('novo', cadastroValido), (e: any) => e.code === 'INDICES_USUARIO_INDISPONIVEIS');
  for (const campo of ['cpf', 'telefone'] as const) {
    const conflito = criarAuthService({ ...repo, async criar() { throw { code: 11000, keyPattern: { [campo]: 1 } }; } }, undefined, javaSimulado().java);
    await assert.rejects(conflito.cadastrar('novo', cadastroValido), (e: any) => e.code === (campo === 'cpf' ? 'CPF_JA_CADASTRADO' : 'TELEFONE_JA_CADASTRADO'));
  }
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
    assert.equal(corpo.canalCodigoPreferido, "email");
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
      { ...cadastroValido, cpf: "111.111.111-1" },
      { ...cadastroValido, telefone: "(19) 3876-5432" },
      { ...cadastroValido, nomeCompleto: " " },
      { ...cadastroValido, canalCodigoPreferido: "whatsapp" },
      { ...cadastroValido, canalCodigoPreferido: undefined },
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
    async existeOutroComCampo() { return false; },
    async indicesUnicosProntos() { return true; },
    async buscarPorFirebaseUid() { return null; },
    async criar() { throw { code: 11000, keyPattern: { firebaseUid: 1 } }; },
    async salvarQuestionario() { return null; },
    async atualizarNomePublico() { return null; },
  }, undefined, javaSimulado().java);
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

test("POST /auth/cadastro passa pelo Java antes de gravar", async () => {
  // Java recebe os dados já normalizados (CPF só dígitos, telefone +55) e o canal.
  {
    const { repo } = repoEmMemoria();
    const simulado = javaSimulado();
    const api = await iniciarApi(repo, simulado.java);
    try {
      assert.equal((await api.chamar("POST", "/auth/cadastro", "token-uid-maria", { ...cadastroValido, canalCodigoPreferido: "sms" })).status, 201);
      assert.deepEqual(simulado.chamadas, [{
        nomeCompleto: "Maria da Silva", cpf: "52998224725", telefoneCanonico: "+5519998765432", canalCodigoPreferido: "sms",
      }]);
    } finally { await api.fechar(); }
  }
  // Java recusa: 400 com as mensagens dele e nada é gravado.
  {
    const { repo, perfis } = repoEmMemoria();
    const api = await iniciarApi(repo, javaSimulado({ valido: false, erros: ["Mensagem do Java."] }).java);
    try {
      const resposta = await api.chamar("POST", "/auth/cadastro", "token-uid-maria", cadastroValido);
      assert.equal(resposta.status, 400);
      assert.deepEqual((await resposta.json()).detalhes, [{ mensagem: "Mensagem do Java." }]);
      assert.equal(perfis.length, 0);
    } finally { await api.fechar(); }
  }
  // Java desligado: 503 e nada é gravado.
  {
    const { repo, perfis } = repoEmMemoria();
    const api = await iniciarApi(repo, javaSimulado(new JavaIndisponivelError()).java);
    try {
      const resposta = await api.chamar("POST", "/auth/cadastro", "token-uid-maria", cadastroValido);
      assert.equal(resposta.status, 503);
      assert.equal((await resposta.json()).codigo, "JAVA_INDISPONIVEL");
      assert.equal(perfis.length, 0);
    } finally { await api.fechar(); }
  }
});

test("Modelo de usuário respeita o validator da coleção usuarios", async () => {
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const vm = require("node:vm") as typeof import("node:vm");
  const mongoose = require("mongoose") as typeof import("mongoose");
  const { UsuarioModel } = require("../src/modules/auth/auth.model") as typeof import("../src/modules/auth/auth.model");
  const doc = new UsuarioModel({
    firebaseUid: "uid-maria", nomeCompleto: "Maria da Silva", cpf: "52998224725", telefone: "+5519998765432",
    termos: { versao: "1.0", aceitoEm: new Date() }, canalCodigoPreferido: "email", criadoEm: new Date(), atualizadoEm: new Date(),
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

// ---------- Nome público e iniciais (PATCH /auth/perfil) ----------

test("Iniciais: primeiro e último nome, maiúsculas, ignorando símbolos", () => {
  assert.equal(calcularIniciais("Maria da Silva"), "MS");
  assert.equal(calcularIniciais("seu zé da roça"), "SR");
  assert.equal(calcularIniciais("Maria"), "M");
  assert.equal(calcularIniciais("  Élida   Ômega  "), "ÉÔ");
  assert.equal(calcularIniciais("João - Sítio 🌱"), "JS");
  assert.equal(calcularIniciais("🌱"), null);
});

test("Perfil devolve nomePublico null e iniciais do nome completo logo após o cadastro", async () => {
  const { repo } = repoEmMemoria();
  const api = await iniciarApi(repo);
  try {
    const cadastro = await (await api.chamar("POST", "/auth/cadastro", "token-uid-maria", cadastroValido)).json();
    assert.equal(cadastro.nomePublico, null);
    assert.equal(cadastro.iniciais, "MS");
    const me = await (await api.chamar("GET", "/auth/me", "token-uid-maria")).json();
    assert.equal(me.nomePublico, null);
    assert.equal(me.iniciais, "MS");
  } finally { await api.fechar(); }
});

test("PATCH /auth/perfil grava, edita e apaga o nome público, e as iniciais acompanham", async () => {
  const { repo, perfis } = repoEmMemoria();
  const simulado = javaSimulado();
  const api = await iniciarApi(repo, simulado.java);
  try {
    await api.chamar("POST", "/auth/cadastro", "token-uid-maria", cadastroValido);

    const primeira = await api.chamar("PATCH", "/auth/perfil", "token-uid-maria", { nomePublico: "  Seu Zé da Roça  " });
    assert.equal(primeira.status, 200);
    const corpo1 = await primeira.json();
    assert.equal(corpo1.nomePublico, "Seu Zé da Roça");
    assert.equal(corpo1.iniciais, "SR");
    assert.equal(corpo1.nomeCompleto, "Maria da Silva"); // nome completo não muda

    const segunda = await (await api.chamar("PATCH", "/auth/perfil", "token-uid-maria", { nomePublico: "Tia Lurdes" })).json();
    assert.equal(segunda.nomePublico, "Tia Lurdes");
    assert.equal(segunda.iniciais, "TL");
    assert.equal((await (await api.chamar("GET", "/auth/me", "token-uid-maria")).json()).iniciais, "TL");

    const apagado = await (await api.chamar("PATCH", "/auth/perfil", "token-uid-maria", { nomePublico: null })).json();
    assert.equal(apagado.nomePublico, null);
    assert.equal(apagado.iniciais, "MS"); // volta para o nome completo
    assert.equal("nomePublico" in perfis[0], false); // o campo some do banco (não grava null)

    // O Java recebe o nome já sem espaços nas pontas; para apagar, nenhum nome é enviado.
    assert.deepEqual(simulado.chamadasOpcionais, [{ nomePublico: "Seu Zé da Roça" }, { nomePublico: "Tia Lurdes" }, {}]);
  } finally { await api.fechar(); }
});

test("PATCH /auth/perfil recusa nome inválido, campo a mais e foto", async () => {
  const { repo, perfis } = repoEmMemoria();
  const simulado = javaSimulado();
  const api = await iniciarApi(repo, simulado.java);
  try {
    await api.chamar("POST", "/auth/cadastro", "token-uid-maria", cadastroValido);
    const invalidos = [
      {}, { nomePublico: "" }, { nomePublico: "   " }, { nomePublico: "Z" },
      { nomePublico: "a".repeat(81) }, { nomePublico: 123 },
      { nomePublico: "Seu Zé", nomeCompleto: "Outro Nome" },
      { nomePublico: "Seu Zé", fotoPerfil: { url: "https://example.com/a.jpg", publicId: "a" } },
      { fotoPerfil: { url: "https://example.com/a.jpg", publicId: "a" } },
    ];
    for (const corpo of invalidos) {
      const resposta = await api.chamar("PATCH", "/auth/perfil", "token-uid-maria", corpo);
      assert.equal(resposta.status, 400, JSON.stringify(corpo));
    }
    // 80 caracteres (emoji conta como um) é aceito.
    assert.equal((await api.chamar("PATCH", "/auth/perfil", "token-uid-maria", { nomePublico: "🌱".repeat(80) })).status, 200);
    assert.equal(simulado.chamadasOpcionais.length, 1); // só o válido chegou ao Java
    assert.equal(perfis[0].nomeCompleto, "Maria da Silva");
    assert.equal("fotoPerfil" in perfis[0], false);
  } finally { await api.fechar(); }
});

test("PATCH /auth/perfil: 404 sem perfil e 401 sem token", async () => {
  const { repo } = repoEmMemoria();
  const simulado = javaSimulado();
  const api = await iniciarApi(repo, simulado.java);
  try {
    const semPerfil = await api.chamar("PATCH", "/auth/perfil", "token-uid-joao", { nomePublico: "João" });
    assert.equal(semPerfil.status, 404);
    assert.equal((await semPerfil.json()).codigo, "PERFIL_NAO_ENCONTRADO");
    assert.equal((await api.chamar("PATCH", "/auth/perfil", undefined, { nomePublico: "João" })).status, 401);
    assert.equal(simulado.chamadasOpcionais.length, 0);
  } finally { await api.fechar(); }
});

test("PATCH /auth/perfil: Java recusa (400) ou desligado (503) e nada é gravado", async () => {
  {
    const { repo, perfis } = repoEmMemoria();
    const api = await iniciarApi(repo, javaSimulado(undefined, { valido: false, erros: ["Mensagem do Java."] }).java);
    try {
      await api.chamar("POST", "/auth/cadastro", "token-uid-maria", cadastroValido);
      const resposta = await api.chamar("PATCH", "/auth/perfil", "token-uid-maria", { nomePublico: "Seu Zé" });
      assert.equal(resposta.status, 400);
      assert.deepEqual((await resposta.json()).detalhes, [{ mensagem: "Mensagem do Java." }]);
      assert.equal("nomePublico" in perfis[0], false);
    } finally { await api.fechar(); }
  }
  {
    const { repo, perfis } = repoEmMemoria();
    const api = await iniciarApi(repo, javaSimulado(undefined, new JavaIndisponivelError()).java);
    try {
      await api.chamar("POST", "/auth/cadastro", "token-uid-maria", cadastroValido);
      const resposta = await api.chamar("PATCH", "/auth/perfil", "token-uid-maria", { nomePublico: "Seu Zé" });
      assert.equal(resposta.status, 503);
      assert.equal((await resposta.json()).codigo, "JAVA_INDISPONIVEL");
      assert.equal("nomePublico" in perfis[0], false);
    } finally { await api.fechar(); }
  }
});

test("Modelo de usuário com nome público respeita o validator da coleção usuarios", async () => {
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const vm = require("node:vm") as typeof import("node:vm");
  const mongoose = require("mongoose") as typeof import("mongoose");
  const { UsuarioModel } = require("../src/modules/auth/auth.model") as typeof import("../src/modules/auth/auth.model");
  const doc = new UsuarioModel({
    firebaseUid: "uid-maria", nomeCompleto: "Maria da Silva", nomePublico: "Seu Zé da Roça", cpf: "52998224725",
    telefone: "+5519998765432", termos: { versao: "1.0", aceitoEm: new Date() }, canalCodigoPreferido: "email",
    criadoEm: new Date(), atualizadoEm: new Date(),
  });
  await doc.validate();
  const literal = fs.readFileSync(path.resolve(__dirname, "../../database/validators/validar-usuarios.mongodb.js"), "utf8");
  const cfg = vm.runInNewContext("(" + literal.slice(literal.indexOf("db.runCommand(") + 14, literal.lastIndexOf(");")) + ")");
  const { errosSchema } = require("../../database/seed/lib-bd6.cjs");
  assert.deepEqual(errosSchema(mongoose.mongo.BSON.EJSON.serialize(doc.toObject()), cfg.validator.$jsonSchema), []);
});
