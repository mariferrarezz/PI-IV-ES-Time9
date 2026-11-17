import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:net";
import { mongo, Types } from "mongoose";

// HTTP e Java reais; identidade e banco simulados. Nenhuma conexão ao Atlas.
process.env.MONGODB_URI = "mongodb://127.0.0.1:1/sentinela";
process.env.FIREBASE_PROJECT_ID = "demo-put-java";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
const { criarApp } = require("../src/app") as typeof import("../src/app");
const { criarPropriedadesService } = require("../src/modules/propriedades/propriedades.service") as typeof import("../src/modules/propriedades/propriedades.service");
const { validarPropriedadeNoJava } = require("../src/services/validacao-java.service") as typeof import("../src/services/validacao-java.service");
const { mesmaImagem } = require("../src/modules/propriedades/propriedades.atualizacao") as typeof import("../src/modules/propriedades/propriedades.atualizacao");
type Repo = import("../src/modules/propriedades/propriedades.repository").PropriedadesRepository;
type Registro = import("../src/modules/propriedades/propriedades.repository").RegistroAtualizacao;

test("PUT HTTP → service → TCP → Java real, com persistência simulada", async t => {
  const id = new Types.ObjectId(), usuarioId = new Types.ObjectId();
  let doc: Registro = { _id: id, usuarioId, nome: " Nome herdado ", municipio: "Cidade", estado: "SP",
    areaTotalHa: mongo.Decimal128.fromString("0.5"), observacoes: " Obs\\n\t\r\nFim ",
    ativa: false, criadoEm: new Date(1), atualizadoEm: new Date(10) };
  let escritas = 0, transacoes = 0, duranteJava: (() => void) | undefined;
  const repo = {
    async buscarParaAtualizacao() { return mongo.BSON.deserialize(mongo.BSON.serialize(doc), { promoteLongs: false }); },
    async atualizar(_id: unknown, _dono: unknown, patch: object, _session: unknown, controle: any) {
      assert(mesmaImagem(doc, controle.imagem));
      escritas++; doc = { ...doc, ...patch, atualizadoEm: controle.atualizadoEm }; return doc;
    },
    async comTransacao(acao: (session: object) => Promise<unknown>) { transacoes++; return acao({}); },
  } as unknown as Repo;
  const service = criarPropriedadesService(repo, { async buscarPorFirebaseUid() { return { _id: usuarioId }; } }, async (...campos) => {
    const resultado = await validarPropriedadeNoJava(...campos); duranteJava?.(); return resultado;
  });
  const app = criarApp({ service, bancoDisponivel: () => true, verificarToken: async () => ({ uid: "a" }) });
  const server = app.listen(0, "127.0.0.1"); await once(server, "listening");
  const port = (server.address() as { port: number }).port;
  async function put(nome: string) {
    const r = await fetch(`http://127.0.0.1:${port}/propriedades/${id}`, { method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: "Bearer TOKEN_SIMULADO" },
      body: JSON.stringify({ nome }), signal: AbortSignal.timeout(6000) });
    return { status: r.status, dados: await r.json() as any };
  }
  try {
    await t.test("nome parcial preserva opcionais BSON, false e delimitadores herdados", async () => {
      const observacoes = doc.observacoes;
      const r = await put("  Novo nome  ");
      assert.equal(r.status, 200); assert.equal(doc.nome, "Novo nome");
      assert.equal(doc.ativa, false); assert.equal(doc.observacoes, observacoes);
      assert(doc.areaTotalHa instanceof mongo.Decimal128); assert.equal(doc.areaTotalHa.toString(), "0.5");
    });
    await t.test("erro real do Java no estado herdado retorna 400 sem escrita", async () => {
      const antes = escritas, tx = transacoes; doc.municipio = "";
      const r = await put("Outro nome");
      assert.equal(r.status, 400); assert.deepEqual(r.dados.detalhes, [{ mensagem: "O município é obrigatório." }]);
      assert.equal(escritas, antes); assert.equal(transacoes, tx); doc.municipio = "Cidade";
    });
    await t.test("mudança após validação Java real gera conflito sem escrita", async () => {
      const antes = escritas;
      duranteJava = () => { doc.observacoes = "Concorrente"; };
      const r = await put("Nao gravar");
      assert.equal(r.status, 409); assert.equal(r.dados.codigo, "PROPRIEDADE_ALTERADA");
      assert.equal(escritas, antes); duranteJava = undefined;
    });
    await t.test("Java TCP indisponível retorna 503 antes da transação", async () => {
      const reserva = createServer(); reserva.listen(0, "127.0.0.1"); await once(reserva, "listening");
      const porta = (reserva.address() as { port: number }).port;
      await new Promise<void>(resolve => reserva.close(() => resolve()));
      const host = process.env.JAVA_HOST, anterior = process.env.JAVA_PORT;
      const antes = escritas, tx = transacoes;
      try {
        process.env.JAVA_HOST = "127.0.0.1"; process.env.JAVA_PORT = String(porta);
        const r = await put("Nao gravar");
        assert.equal(r.status, 503); assert.equal(r.dados.codigo, "JAVA_INDISPONIVEL");
        assert.equal(escritas, antes); assert.equal(transacoes, tx);
      } finally {
        if (host === undefined) delete process.env.JAVA_HOST; else process.env.JAVA_HOST = host;
        if (anterior === undefined) delete process.env.JAVA_PORT; else process.env.JAVA_PORT = anterior;
      }
    });
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
