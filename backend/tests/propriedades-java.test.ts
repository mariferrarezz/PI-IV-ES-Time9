import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { Types } from "mongoose";

process.env.MONGODB_URI = "mongodb://127.0.0.1:1/sentinela";
process.env.FIREBASE_PROJECT_ID = "demo-propriedades-java";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
const { criarApp } = require("../src/app") as typeof import("../src/app");
const { criarPropriedadesService } = require("../src/modules/propriedades/propriedades.service") as typeof import("../src/modules/propriedades/propriedades.service");
const { JavaIndisponivelError } = require("../src/services/validacao-java.service") as typeof import("../src/services/validacao-java.service");
type Repo = import("../src/modules/propriedades/propriedades.repository").PropriedadesRepository;
type Registro = import("../src/modules/propriedades/propriedades.schema").CriarPropriedadeDto & {
  _id: Types.ObjectId; usuarioId: Types.ObjectId; ativa: boolean; criadoEm: Date; atualizadoEm: Date;
};

test("POST propriedades: preparação, Java e bloqueio de escritas com mocks", async t => {
  const usuarioId = new Types.ObjectId();
  const documentos: Registro[] = [];
  let chamadasJava = 0;
  let entradaJava: unknown[] = [];
  let falha: "invalido" | "indisponivel" | "inesperado" | undefined;
  const eventos: string[] = [];
  const repo: Repo = {
    async criar(dono, dados) {
      eventos.push("gravar");
      const doc: Registro = { ...dados, ativa: dados.ativa ?? true, usuarioId: dono, _id: new Types.ObjectId(), criadoEm: new Date(), atualizadoEm: new Date() };
      documentos.push(doc); return doc;
    },
    async buscarPorId() { return documentos[0]; },
    async buscarParaAtualizacao() { return documentos[0]; },
    async atualizar(_id, dono, dados) { return { ...documentos[0], ...dados }; },
    async comTransacao(acao) { return acao({} as import("mongoose").ClientSession); },
    async listarPorUsuario() { throw new Error("LISTAGEM_NAO_ESPERADA_NESTE_TESTE"); },
    async excluir() { throw new Error("EXCLUSAO_NAO_ESPERADA_NESTE_TESTE"); },
    async temTalhoes() { throw new Error("CONSULTA_NAO_ESPERADA_NESTE_TESTE"); },
    async areaAtivaExcede() { throw new Error("CONSULTA_NAO_ESPERADA_NESTE_TESTE"); },
  };
  const service = criarPropriedadesService(repo, {
    async buscarPorFirebaseUid(uid) { eventos.push("perfil"); return uid === "sem-perfil" ? null : { _id: usuarioId }; },
  }, async (...entrada) => {
    chamadasJava++; eventos.push("java"); entradaJava = entrada;
    if (falha === "indisponivel") throw new JavaIndisponivelError();
    if (falha === "inesperado") throw new Error("DETALHE_INTERNO_NAO_EXIBIR");
    return falha === "invalido" ? { valido: false, erros: ["O nome da propriedade é obrigatório.", "O município é obrigatório."] }
      : { valido: true, erros: [] };
  });
  const app = criarApp({ service, bancoDisponivel: () => true, verificarToken: async token => {
    if (!["a", "sem-perfil"].includes(token)) throw new Error("TOKEN_INVALIDO");
    return { uid: token };
  } });
  const server = app.listen(0, "127.0.0.1"); await once(server, "listening");
  const port = (server.address() as { port: number }).port;
  const valido = { nome: "  Fazenda 2  ", municipio: "  Cidade  ", estado: "SP", observacoes: "  Obs\t\r\nFim  " };
  async function pedido(corpo: unknown, token = "a", metodo = "POST", rota = "/propriedades") {
    const resposta = await fetch(`http://127.0.0.1:${port}${rota}`, {
      method: metodo, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(corpo), signal: AbortSignal.timeout(5000),
    });
    return { status: resposta.status, corpo: await resposta.json() as any };
  }
  try {
    await t.test("prepara textos antes do Java e grava somente após aprovação", async () => {
      const r = await pedido(valido);
      assert.equal(r.status, 201);
      assert.deepEqual(entradaJava, ["Fazenda 2", "Cidade", "SP", undefined, "Obs\t\r\nFim"]);
      assert.deepEqual(eventos, ["perfil", "java", "gravar"]);
      assert.equal(r.corpo.nome, "Fazenda 2"); assert.equal(r.corpo.ativa, true);
      assert.equal(r.corpo.usuarioId, String(usuarioId));
      assert.equal((await pedido(valido)).status, 201); // Mesmo nome é permitido.
      assert.equal(documentos.length, 2);
    });
    await t.test("opcionais omitidos continuam ausentes", async () => {
      assert.equal((await pedido({ nome: "Nome", municipio: "Cidade", estado: "SP", ativa: false })).status, 201);
      assert.deepEqual(entradaJava, ["Nome", "Cidade", "SP", undefined, undefined]);
      assert.equal(documentos[2].ativa, false);
      assert(!("areaTotalHa" in documentos[2])); assert(!("observacoes" in documentos[2]));
    });
    await t.test("Java inválido retorna 400 com todos os erros e não grava", async () => {
      falha = "invalido";
      const r = await pedido(valido);
      assert.equal(r.status, 400); assert.equal(r.corpo.codigo, "ENTRADA_INVALIDA");
      assert.deepEqual(r.corpo.detalhes, [{ mensagem: "O nome da propriedade é obrigatório." }, { mensagem: "O município é obrigatório." }]);
      assert.equal(documentos.length, 3);
    });
    await t.test("Java indisponível retorna 503 seguro e não grava", async () => {
      falha = "indisponivel";
      const r = await pedido(valido);
      assert.equal(r.status, 503); assert.equal(r.corpo.codigo, "JAVA_INDISPONIVEL");
      assert.equal(r.corpo.erro, "Serviço de validação Java indisponível"); assert.equal(documentos.length, 3);
    });
    await t.test("tipos, null, UF e campos protegidos barrados antes do Java", async () => {
      const antes = chamadasJava;
      for (const alteracao of [{ areaTotalHa: null }, { observacoes: null }, { nome: null }, { estado: "sp" }, { estado: " SP " },
        { estado: "XX" }, { areaTotalHa: "2" }, { areaTotalHa: 0 }, { ativa: "true" }, { usuarioId: String(usuarioId) },
        { _id: String(new Types.ObjectId()) }, { observacoes: "  " }, { nome: "a".repeat(151) }]) {
        assert.equal((await pedido({ ...valido, ...alteracao })).status, 400);
      }
      assert.equal(chamadasJava, antes); assert.equal(documentos.length, 3);
    });
    await t.test("sem token, token inválido e perfil ausente não chamam Java nem gravam", async () => {
      const antes = chamadasJava;
      assert.equal((await pedido(valido, "")).status, 401);
      assert.equal((await pedido(valido, "invalido")).status, 401);
      assert.equal((await pedido(valido, "sem-perfil")).status, 403);
      assert.equal(chamadasJava, antes); assert.equal(documentos.length, 3);
    });
    await t.test("atualização também valida o estado final antes de escrever", async () => {
      falha = undefined;
      const antes = chamadasJava;
      const r = await pedido({ nome: "Novo nome" }, "a", "PUT", `/propriedades/${documentos[0]._id}`);
      assert.equal(r.status, 200); assert.equal(chamadasJava, antes + 1);
      assert.deepEqual(entradaJava, ["Novo nome", "Cidade", "SP", undefined, "Obs\t\r\nFim"]);
    });
    await t.test("falha inesperada preserva 500 seguro e não grava", async () => {
      falha = "inesperado";
      const r = await pedido(valido);
      assert.equal(r.status, 500); assert.equal(r.corpo.codigo, "ERRO_INTERNO");
      assert(!JSON.stringify(r.corpo).includes("DETALHE_INTERNO")); assert.equal(documentos.length, 3);
    });
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(erro => erro ? reject(erro) : resolve()));
  }
});
