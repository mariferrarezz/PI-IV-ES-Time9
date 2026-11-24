import test from "node:test";
import assert from "node:assert/strict";

// Usa o servidor Java de verdade (JAVA_HOST/JAVA_PORT do .env) e um banco simulado em memória.
// Não acessa MongoDB nem Firebase. Ligar o Java antes: ver "Como ligar o ambiente".
process.env.MONGODB_URI ??= "mongodb://127.0.0.1:1/sentinela";
process.env.FIREBASE_PROJECT_ID ??= "demo-sentinela-comunidade";
const { Types } = require("mongoose") as typeof import("mongoose");
const { criarComunidadeService } = require("../src/modules/comunidade/comunidade.service") as typeof import("../src/modules/comunidade/comunidade.service");
type Repo = import("../src/modules/comunidade/comunidade.repository").ComunidadeRepository;
type Origem = import("../src/modules/comunidade/comunidade.repository").OrigemExperiencia;

const autorId = new Types.ObjectId();
const ocorrenciaId = new Types.ObjectId();

function servico(origem: Origem, relogio = new Date()) {
  const gravados: Record<string, any>[] = [];
  const repo: Repo = {
    async buscarUsuario() { return { _id: autorId, nomePublico: "Seu Zé" }; },
    async carregarOrigem() { return origem; },
    async respostaAnterior() { return undefined; },
    async inserirExperiencia(doc) { gravados.push(doc); return { _id: doc._id, status: "aprovada" }; },
    async listarDoAutor() { return gravados.filter(g => g.moderacao.status !== "retirada"); },
    async buscarDoAutor(_a, id) { return gravados.find(g => g._id.equals(id)) ?? null; },
    async marcarRetirada(id, _a, _ant, agora) { const g = gravados.find(x => x._id.equals(id))!; g.moderacao = { ...g.moderacao, status: "retirada" }; g.atualizadoEm = agora; return true; },
  };
  return { service: criarComunidadeService(repo, undefined, () => relogio), gravados };
}

const completa = (dataAvaliacao: Date): Origem => ({
  ocorrencia: { _id: ocorrenciaId, tipo: "praga", status: "em_acompanhamento", problemaAgricolaId: new Types.ObjectId() },
  culturaId: new Types.ObjectId(), culturaNome: "Soja", problemaNome: "Lagarta-do-cartucho", regiao: { municipio: "Limeira", estado: "SP" },
  tratamento: { _id: new Types.ObjectId(), tipoMedida: "biologica", descricao: "Aplicação de Bt" },
  avaliacao: { _id: new Types.ObjectId(), resultado: "melhora_observada", dataAvaliacao },
});
const corpo = (extra = {}) => ({ ocorrenciaId: String(ocorrenciaId), titulo: "Lagarta controlada", relato: "Controlei em duas semanas.", ...extra });

test("Java real aceita publicar com tratamento e avaliação e depois retirar", async () => {
  const { service, gravados } = servico(completa(new Date(Date.now() - 86_400_000)));
  const r = await service.publicar("uid", corpo({ tratamentoId: String(new Types.ObjectId()), avaliacaoId: String(new Types.ObjectId()) })) as { status: string };
  assert.equal(r.status, "aprovada");
  assert.equal(gravados.length, 1);
  const retirada = await service.retirar("uid", String(gravados[0]._id));
  assert.equal(retirada.status, "retirada");
});

test("Java real aceita publicar ocorrência não identificada, sem tratamento", async () => {
  const { service, gravados } = servico({ ocorrencia: { _id: ocorrenciaId, tipo: "nao_identificado", status: "aberta" },
    culturaId: new Types.ObjectId(), culturaNome: "Milho", regiao: { municipio: "Limeira", estado: "SP" } });
  await service.publicar("uid", corpo());
  assert.equal(gravados.length, 1);
  assert.equal((await service.retirar("uid", String(gravados[0]._id))).status, "retirada");
});

test("Java real recusa avaliação com data futura e nada é gravado", async () => {
  const { service, gravados } = servico(completa(new Date(Date.now() + 5 * 86_400_000)));
  await assert.rejects(service.publicar("uid", corpo({ tratamentoId: String(new Types.ObjectId()), avaliacaoId: String(new Types.ObjectId()) })),
    (e: any) => e.code === "ENTRADA_INVALIDA" && e.erros.length > 0);
  assert.equal(gravados.length, 0);
});
