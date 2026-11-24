import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";

// Somente dependências simuladas: nenhuma conexão com MongoDB, Firebase ou Java.
process.env.MONGODB_URI = "mongodb://127.0.0.1:1/sentinela";
process.env.FIREBASE_PROJECT_ID = "demo-sentinela-comunidade";
const { Types } = require("mongoose") as typeof import("mongoose");
const { criarApp } = require("../src/app") as typeof import("../src/app");
const { criarComunidadeService } = require("../src/modules/comunidade/comunidade.service") as typeof import("../src/modules/comunidade/comunidade.service");
const { MODERACAO_AUTOMATICA_ID } = require("../src/config/moderacao") as typeof import("../src/config/moderacao");
const { JavaIndisponivelError } = require("../src/services/validacao-java.service") as typeof import("../src/services/validacao-java.service");
const { NotFoundError } = require("../src/shared/errors") as typeof import("../src/shared/errors");
type Repo = import("../src/modules/comunidade/comunidade.repository").ComunidadeRepository;
type Origem = import("../src/modules/comunidade/comunidade.repository").OrigemExperiencia;

const autorId = new Types.ObjectId();
const ocorrenciaId = new Types.ObjectId();
const tratamentoId = new Types.ObjectId();
const avaliacaoId = new Types.ObjectId();
const problemaId = new Types.ObjectId();
const relogio = new Date("2026-11-23T15:00:00Z");

function origemBase(com: { tratamento?: boolean; avaliacao?: boolean } = {}): Origem {
  return {
    ocorrencia: { _id: ocorrenciaId, tipo: "praga", status: "em_acompanhamento", problemaAgricolaId: problemaId },
    culturaId: new Types.ObjectId(), culturaNome: "Soja", problemaNome: "Lagarta-do-cartucho",
    regiao: { municipio: "Limeira", estado: "SP" },
    ...(com.tratamento ? { tratamento: { _id: tratamentoId, tipoMedida: "biologica", descricao: "Aplicação de Bacillus thuringiensis" } } : {}),
    ...(com.avaliacao ? { avaliacao: { _id: avaliacaoId, resultado: "melhora_observada", dataAvaliacao: new Date("2026-11-20T12:00:00Z") } } : {}),
  };
}

function simulado(opcoes: { nomePublico?: string | null; origem?: Origem; existentes?: Record<string, any>[] } = {}) {
  const gravados: Record<string, any>[] = [...(opcoes.existentes ?? [])];
  const respostas = new Map<string, object>();
  const repo: Repo = {
    async buscarUsuario(uid) {
      if (uid !== "uid-autor") return null;
      return { _id: autorId, ...(opcoes.nomePublico === null ? {} : { nomePublico: opcoes.nomePublico ?? "Seu Zé" }) };
    },
    async carregarOrigem(usuarioId, ocorrencia, tratamento, avaliacao) {
      if (!usuarioId.equals(autorId) || !ocorrencia.equals(ocorrenciaId)) throw new NotFoundError("Ocorrência não encontrada");
      const o = opcoes.origem ?? origemBase({ tratamento: Boolean(tratamento), avaliacao: Boolean(avaliacao) });
      if (tratamento && !tratamento.equals(tratamentoId)) throw new NotFoundError("Tratamento não encontrado");
      return o;
    },
    async respostaAnterior(i) { return i.chave ? respostas.get(i.chave) : undefined; },
    async inserirExperiencia(doc, i) {
      if (gravados.some(g => g.ocorrenciaOrigemId.equals(doc.ocorrenciaOrigemId) && g.moderacao.status !== "retirada")) {
        const { AppError } = require("../src/shared/errors");
        throw new AppError(409, "Esta ocorrência já foi compartilhada na Comunidade", "EXPERIENCIA_JA_PUBLICADA");
      }
      gravados.push(doc);
      const r = { _id: doc._id, status: "aprovada" };
      if (i.chave) respostas.set(i.chave, r);
      return r;
    },
    async listarDoAutor(id) { return gravados.filter(g => g.autorId.equals(id) && g.moderacao.status !== "retirada"); },
    async buscarDoAutor(id, exp) { return gravados.find(g => g.autorId.equals(id) && g._id.equals(exp)) ?? null; },
    async marcarRetirada(exp, id, anterior, agora) {
      const g = gravados.find(x => x._id.equals(exp) && x.autorId.equals(id) && x.atualizadoEm.getTime() === anterior.getTime());
      if (!g) return false;
      g.moderacao = { ...g.moderacao, status: "retirada" }; g.atualizadoEm = agora; return true;
    },
  };
  const java: { conteudo?: any; meta?: any; chamadas: number; erros?: string[]; indisponivel?: boolean } = { chamadas: 0 };
  const validar = async (c: any, m: any) => {
    java.chamadas++; java.conteudo = c; java.meta = m;
    if (java.indisponivel) throw new JavaIndisponivelError();
    return java.erros ? { valido: false, erros: java.erros } : { valido: true, erros: [] };
  };
  const service = criarComunidadeService(repo, validar as never, () => relogio);
  return { service, gravados, java };
}

async function iniciarApi(service: ReturnType<typeof criarComunidadeService>) {
  const servidor = criarApp({ comunidade: service, bancoDisponivel: () => true,
    verificarToken: async token => { if (!token.startsWith("token-")) throw new Error("token inválido"); return { uid: token.slice(6) }; } }).listen(0, "127.0.0.1");
  await once(servidor, "listening");
  const porta = (servidor.address() as import("node:net").AddressInfo).port;
  const chamar = (metodo: string, caminho: string, corpo?: unknown, extra: Record<string, string> = {}, uid = "uid-autor") =>
    fetch(`http://127.0.0.1:${porta}${caminho}`, { method: metodo,
      headers: { Authorization: `Bearer token-${uid}`, "Content-Type": "application/json", ...extra },
      ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }) });
  return { chamar, fechar: () => { servidor.closeAllConnections(); return new Promise<void>(r => servidor.close(() => r())); } };
}

const corpo = { ocorrenciaId: String(ocorrenciaId), titulo: "Lagarta controlada com Bt", relato: "Apareceu no começo do mês e controlei em duas semanas." };

test("POST /comunidade/experiencias publica já aprovada, copiando os dados da ocorrência", async () => {
  const { service, gravados, java } = simulado();
  const api = await iniciarApi(service);
  try {
    const r = await api.chamar("POST", "/comunidade/experiencias", { ...corpo, tratamentoId: String(tratamentoId), avaliacaoId: String(avaliacaoId) });
    assert.equal(r.status, 201);
    const resposta = await r.json();
    assert.equal(resposta.status, "aprovada");
    assert.equal(gravados.length, 1);
    const g = gravados[0];
    assert.equal(g.nomePublico, "Seu Zé");
    assert.equal(g.culturaNome, "Soja");
    assert.equal(g.problemaNome, "Lagarta-do-cartucho");
    assert.equal(g.tipoProblema, "praga");
    assert.equal(g.statusOcorrencia, "em_acompanhamento");
    assert.deepEqual(g.regiao, { municipio: "Limeira", estado: "SP" });
    assert.deepEqual(g.metodo, { tipoMedida: "biologica", descricao: "Aplicação de Bacillus thuringiensis" });
    assert.equal(g.resultadoRelatado.resultado, "melhora_observada");
    assert(g.moderacao.revisadoPor.equals(MODERACAO_AUTOMATICA_ID));
    assert.equal(g.publicadoEm.getTime(), relogio.getTime());
    // Passou pelo Java com os mesmos dados que foram gravados.
    assert.equal(java.chamadas, 1);
    assert.equal(java.conteudo.titulo, corpo.titulo);
    assert.equal(java.meta.moderacao.status, "aprovada");
    assert.equal(java.meta.tratamentoOrigemPresente, true);
    assert.equal(java.meta.avaliacaoOrigemPresente, true);
  } finally { await api.fechar(); }
});

test("Documento publicado e retirado respeita o validator de experiencias_comunidade", async () => {
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const vm = require("node:vm") as typeof import("node:vm");
  const mongoose = require("mongoose") as typeof import("mongoose");
  const literal = fs.readFileSync(path.resolve(__dirname, "../../database/validators/validar-experiencias_comunidade.mongodb.js"), "utf8");
  const cfg = vm.runInNewContext("(" + literal.slice(literal.indexOf("db.runCommand(") + 14, literal.lastIndexOf(");")) + ")");
  const { errosSchema } = require("../../database/seed/lib-bd6.cjs");
  const { service, gravados } = simulado();
  await service.publicar("uid-autor", { ...corpo, tratamentoId: String(tratamentoId), avaliacaoId: String(avaliacaoId) });
  assert.deepEqual(errosSchema(mongoose.mongo.BSON.EJSON.serialize(gravados[0]), cfg.validator.$jsonSchema), []);
  // Conferência de que o validator é aplicado de fato: aprovada sem publicadoEm é recusada.
  const { publicadoEm: _p, ...semPublicacao } = gravados[0];
  assert.notDeepEqual(errosSchema(mongoose.mongo.BSON.EJSON.serialize(semPublicacao), cfg.validator.$jsonSchema), []);
  await service.retirar("uid-autor", String(gravados[0]._id));
  assert.equal(gravados[0].moderacao.status, "retirada");
  assert.deepEqual(errosSchema(mongoose.mongo.BSON.EJSON.serialize(gravados[0]), cfg.validator.$jsonSchema), []);
  // Sem tratamento e sem problema identificado também vale.
  const semProblema = simulado({ origem: { ...origemBase(), ocorrencia: { _id: ocorrenciaId, tipo: "nao_identificado", status: "aberta" }, problemaNome: undefined } });
  await semProblema.service.publicar("uid-autor", corpo);
  assert.equal("problemaAgricolaId" in semProblema.gravados[0], false);
  assert.equal("metodo" in semProblema.gravados[0], false);
  assert.deepEqual(errosSchema(mongoose.mongo.BSON.EJSON.serialize(semProblema.gravados[0]), cfg.validator.$jsonSchema), []);
});

test("Sem nome público, a publicação é recusada com NOME_PUBLICO_NECESSARIO", async () => {
  const { service, gravados, java } = simulado({ nomePublico: null });
  const api = await iniciarApi(service);
  try {
    const r = await api.chamar("POST", "/comunidade/experiencias", corpo);
    assert.equal(r.status, 409);
    assert.equal((await r.json()).codigo, "NOME_PUBLICO_NECESSARIO");
    assert.equal(gravados.length, 0);
    assert.equal(java.chamadas, 0);
  } finally { await api.fechar(); }
});

test("Ocorrência de outra pessoa ou inexistente responde 404", async () => {
  const { service, gravados } = simulado();
  const api = await iniciarApi(service);
  try {
    const r = await api.chamar("POST", "/comunidade/experiencias", { ...corpo, ocorrenciaId: String(new Types.ObjectId()) });
    assert.equal(r.status, 404);
    assert.equal(gravados.length, 0);
  } finally { await api.fechar(); }
});

test("Corpo inválido, campo a mais e avaliação sem tratamento são recusados antes do Java", async () => {
  const { service, java } = simulado();
  const api = await iniciarApi(service);
  try {
    for (const errado of [
      { ...corpo, titulo: "   " },
      { ...corpo, relato: "" },
      { ...corpo, titulo: "x".repeat(151) },
      { ...corpo, nomePublico: "Outro" },
      { ...corpo, avaliacaoId: String(avaliacaoId) },
      { ...corpo, ocorrenciaId: "123" },
    ]) {
      const r = await api.chamar("POST", "/comunidade/experiencias", errado);
      assert.equal(r.status, 400, JSON.stringify(errado));
    }
    assert.equal(java.chamadas, 0);
  } finally { await api.fechar(); }
});

test("Java recusou → 400 com detalhes; Java desligado → 503; nada é gravado", async () => {
  const recusa = simulado();
  recusa.java.erros = ["O título é obrigatório."];
  const desligado = simulado();
  desligado.java.indisponivel = true;
  for (const [caso, status, codigo] of [[recusa, 400, "ENTRADA_INVALIDA"], [desligado, 503, "JAVA_INDISPONIVEL"]] as const) {
    const api = await iniciarApi(caso.service);
    try {
      const r = await api.chamar("POST", "/comunidade/experiencias", corpo);
      assert.equal(r.status, status);
      assert.equal((await r.json()).codigo, codigo);
      assert.equal(caso.gravados.length, 0);
    } finally { await api.fechar(); }
  }
});

test("A mesma ocorrência não é compartilhada duas vezes; depois de retirar, pode de novo", async () => {
  const { service, gravados } = simulado();
  const api = await iniciarApi(service);
  try {
    assert.equal((await api.chamar("POST", "/comunidade/experiencias", corpo)).status, 201);
    const repetida = await api.chamar("POST", "/comunidade/experiencias", corpo);
    assert.equal(repetida.status, 409);
    assert.equal((await repetida.json()).codigo, "EXPERIENCIA_JA_PUBLICADA");
    assert.equal((await api.chamar("POST", `/comunidade/experiencias/${gravados[0]._id}/retirar`)).status, 200);
    assert.equal((await api.chamar("POST", "/comunidade/experiencias", corpo)).status, 201);
  } finally { await api.fechar(); }
});

test("Idempotency-Key repetida devolve a mesma resposta sem gravar de novo", async () => {
  const { service, gravados } = simulado();
  const api = await iniciarApi(service);
  try {
    const chave = { "Idempotency-Key": "a".repeat(32) };
    const primeira = await (await api.chamar("POST", "/comunidade/experiencias", corpo, chave)).json();
    const segunda = await api.chamar("POST", "/comunidade/experiencias", corpo, chave);
    assert.equal(segunda.status, 201);
    assert.equal((await segunda.json())._id, primeira._id);
    assert.equal(gravados.length, 1);
  } finally { await api.fechar(); }
});

test("GET /comunidade/minhas-experiencias lista só as do autor, sem ids de origem", async () => {
  const { service } = simulado();
  const api = await iniciarApi(service);
  try {
    await api.chamar("POST", "/comunidade/experiencias", corpo);
    const r = await api.chamar("GET", "/comunidade/minhas-experiencias");
    assert.equal(r.status, 200);
    const lista = await r.json();
    assert.equal(lista.length, 1);
    assert.equal(lista[0].titulo, corpo.titulo);
    assert.equal(lista[0].status, "aprovada");
    for (const campo of ["autorId", "ocorrenciaOrigemId", "tratamentoOrigemId", "moderacao", "relato"]) assert.equal(lista[0][campo], undefined, campo);
    const outro = await api.chamar("GET", "/comunidade/minhas-experiencias", undefined, {}, "uid-sem-perfil");
    assert.equal(outro.status, 404);
  } finally { await api.fechar(); }
});

test("Retirar: só o autor; oculta pela moderação não pode ser retirada; repetir não dá erro", async () => {
  const ocultaId = new Types.ObjectId();
  const oculta = { _id: ocultaId, autorId, ocorrenciaOrigemId: new Types.ObjectId(), nomePublico: "Seu Zé", culturaNome: "Soja", tipoProblema: "praga",
    statusOcorrencia: "aberta", titulo: "t", relato: "r", versao: 1, criadoEm: relogio, atualizadoEm: relogio,
    moderacao: { status: "oculta", revisadoPor: new Types.ObjectId(), revisadoEm: relogio, motivo: "Dados pessoais" } };
  const { service, gravados, java } = simulado({ existentes: [oculta] });
  const api = await iniciarApi(service);
  try {
    assert.equal((await api.chamar("POST", `/comunidade/experiencias/${ocultaId}/retirar`)).status, 409);
    await api.chamar("POST", "/comunidade/experiencias", corpo);
    const nova = gravados[1]._id;
    assert.equal((await api.chamar("POST", `/comunidade/experiencias/${nova}/retirar`, undefined, {}, "uid-sem-perfil")).status, 404);
    const r = await api.chamar("POST", `/comunidade/experiencias/${nova}/retirar`);
    assert.equal(r.status, 200);
    assert.equal((await r.json()).status, "retirada");
    assert.equal(java.meta.moderacao.status, "retirada");
    assert.equal(java.meta.moderacao.revisorPresente, true);
    assert(gravados[1].atualizadoEm.getTime() > relogio.getTime());
    const chamadas = java.chamadas;
    assert.equal((await api.chamar("POST", `/comunidade/experiencias/${nova}/retirar`)).status, 200);
    assert.equal(java.chamadas, chamadas);
    // A retirada some da lista; a oculta continua visível para o autor, com o status.
    const lista = await api.chamar("GET", "/comunidade/minhas-experiencias").then(x => x.json());
    assert.deepEqual(lista.map((e: any) => e.status), ["oculta"]);
  } finally { await api.fechar(); }
});
