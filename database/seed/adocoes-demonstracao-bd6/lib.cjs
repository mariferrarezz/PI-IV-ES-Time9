'use strict';
// Prepara e confere oito documentos de adoção e a alteração editorial simulada da ficha existente.
// A aplicação exige --aplicar; importar este módulo não conecta ao banco.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {confereHashTexto} = require('../integridade-texto-bd6.cjs');
const assert = require('node:assert/strict');
const {createRequire} = require('node:module');
const comum = require('../lib-bd6.cjs');
const comunidade = require('../lib-complemento-bd6.cjs');
const backend = createRequire(path.resolve(__dirname, '../../../backend/package.json'));
const BANCO = 'sentinela';
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const ler = nome => JSON.parse(fs.readFileSync(path.join(__dirname, nome), 'utf8'));
const id = d => d._id.$oid;
function falhar(codigo, detalhes = []) { const e = new Error(codigo); e.codigoSeguro = codigo; e.detalhesSeguros = detalhes; throw e; }
function carregar() {
  const c = comunidade.carregar(), dados = ler('documentos.json'), manifesto = ler('manifesto.json'), alteracao = ler('alteracao-ficha.json');
  const p = {c, dados, manifesto, alteracao, base: c.base};
  try { conferirLocal(p); } catch { falhar('preparacao_demonstracao_incompativel'); }
  p.combinado = {...c.combinado, dados: Object.fromEntries(Object.entries(c.combinado.dados).map(([col, ds]) => [col, [...ds, ...dados[col]]]))};
  p.impressao = hash(c.impressao + JSON.stringify(dados) + JSON.stringify(manifesto) + JSON.stringify(alteracao));
  return p;
}
function conferirLocal(p) {
  const {base, c, dados, manifesto: m, alteracao: alt} = p;
  assert.equal(m.banco, BANCO); assert.equal(alt.banco, BANCO);
  for (const [nome, esperado] of Object.entries(m.preservarArquivosSha256)) assert(confereHashTexto(fs.readFileSync(comum.arquivoSeed(nome)), esperado), nome);
  const anterior = base.dados.problemas_agricolas.find(d => id(d) === id(alt.antes));
  assert.deepEqual(alt.antes, anterior);
  assert.equal(id(alt.antes), '88b8a8ae41cde9df3d9c5df2');
  assert.equal(id(alt.depois), id(alt.antes));
  assert.equal(alt.antes.codigoEditorial, 'lagarta-do-cartucho');
  assert.equal(alt.antes.ativo, false); assert.equal(alt.antes.revisaoEditorial.status, 'pendente');
  const esperado = JSON.parse(JSON.stringify(alt.antes));
  esperado.ativo = true; esperado.revisaoEditorial.status = 'aprovada';
  esperado.revisaoEditorial.observacoes = alt.depois.revisaoEditorial.observacoes;
  esperado.revisadoEm = {$date: alt.momentoSimulado}; esperado.atualizadoEm = {$date: alt.momentoSimulado};
  assert.deepEqual(alt.depois, esperado);
  assert(alt.depois.revisaoEditorial.observacoes.startsWith(alt.antes.revisaoEditorial.observacoes));
  assert(alt.depois.revisaoEditorial.observacoes.includes('SEM revisao agronomica real'));
  assert.equal(alt.depois.revisaoEditorial.registroAgrofitConferido, false);
  assert.deepEqual(comum.errosSchema(alt.depois, base.configs.problemas_agricolas.validator.$jsonSchema), []);
  const todos = new Map(base.porId);
  for (const [col, ds] of Object.entries(c.dados)) for (const d of ds) todos.set(id(d), {col, doc: d});
  assert.equal(todos.size, 192);
  assert.deepEqual(Object.keys(dados).sort(), Object.keys(base.configs).sort());
  assert.equal(Object.values(dados).flat().length, 8);
  assert.equal(dados.problemas_agricolas.length, 0);
  for (const [col, ds] of Object.entries(dados)) {
    assert.equal(m.contagens[col], ds.length);
    for (const d of ds) {
      assert(!todos.has(id(d))); assert.deepEqual(comum.errosSchema(d, base.configs[col].validator.$jsonSchema), []);
      todos.set(id(d), {col, doc: d});
    }
  }
  assert.equal(Object.keys(m.aliases).length, 8);
  for (const [a, ref] of Object.entries(m.aliases)) {
    assert.equal(ref.id.$oid, hash(m.namespace + ':' + a).slice(0, 24)); assert.equal(todos.get(ref.id.$oid).col, ref.colecao);
  }
  const obter = ref => todos.get(ref.$oid).doc;
  const alias = a => obter(m.aliases[a].id);
  const tempo = v => Date.parse(v.$date);
  const simulado = v => v.includes('SIMULACAO ACADEMICA');
  function refs(v) {
    if (!v || typeof v !== 'object') return;
    for (const [k, val] of Object.entries(v)) {
      if (comum.referencias[k]) for (const ref of Array.isArray(val) ? val : [val]) assert.equal(todos.get(ref.$oid)?.col, comum.referencias[k]);
      refs(val);
    }
  }
  const dono = oc => obter(obter(obter(oc.plantacaoId).talhaoId).propriedadeId).usuarioId;
  for (const d of Object.values(dados).flat()) refs(d);
  for (const oc of dados.ocorrencias) {
    const pl = obter(oc.plantacaoId), t = obter(pl.talhaoId), prop = obter(t.propriedadeId);
    assert.equal(pl.status, 'ativa'); assert(t.ativo && prop.ativa);
    assert.equal(dono(oc).$oid, oc.registradoPor.$oid);
    assert.equal(oc.problemaAgricolaId.$oid, id(alt.depois)); assert.equal(oc.tipo, alt.depois.tipo);
    assert.equal(oc.status, 'aberta'); assert(alt.depois.culturasAfetadasIds.some(ref => ref.$oid === pl.culturaId.$oid));
    assert(tempo(pl.dataPlantio) <= tempo(oc.dataObservacao)); assert(tempo(alt.depois.revisadoEm) < tempo(oc.dataObservacao));
    assert(simulado(oc.sintomas));
  }
  for (const tr of dados.tratamentos) {
    const oc = obter(tr.ocorrenciaId);
    assert.equal(dono(oc).$oid, tr.registradoPor.$oid); assert(tempo(oc.dataObservacao) <= tempo(tr.dataAplicacao));
    assert.equal(tr.tipoMedida, 'biologica'); assert(simulado(tr.descricao));
  }
  const e = alias('experiencia'), origem = alias('ocorrencia_a'), trOrigem = alias('tratamento_a');
  assert.equal(e.ocorrenciaOrigemId.$oid, id(origem)); assert.equal(e.autorId.$oid, dono(origem).$oid);
  assert.equal(e.nomePublico, obter(e.autorId).nomePublico);
  assert.equal(e.tratamentoOrigemId.$oid, id(trOrigem)); assert.equal(trOrigem.ocorrenciaId.$oid, id(origem));
  assert.deepEqual(e.metodo, Object.fromEntries(['tipoMedida', 'descricao', 'observacoes'].map(k => [k, trOrigem[k]])));
  assert.equal(e.culturaId.$oid, obter(origem.plantacaoId).culturaId.$oid); assert.equal(e.culturaNome, obter(e.culturaId).nome);
  assert.equal(e.problemaAgricolaId.$oid, id(alt.depois)); assert.equal(e.problemaNome, alt.depois.nomeComum);
  assert.equal(e.tipoProblema, origem.tipo); assert.equal(e.statusOcorrencia, origem.status);
  assert.equal(e.moderacao.status, 'aprovada'); assert(simulado(e.moderacao.motivo));
  assert(tempo(trOrigem.dataAplicacao) <= tempo(e.criadoEm)); assert(tempo(e.criadoEm) <= tempo(e.moderacao.revisadoEm));
  assert.deepEqual(e.publicadoEm, e.moderacao.revisadoEm);
  assert.deepEqual(new Set(dados.adocoes_tratamento.map(d => d.status)), new Set(['planejada', 'realizada', 'cancelada']));
  for (const ad of dados.adocoes_tratamento) {
    const destino = obter(ad.ocorrenciaId), plantacao = obter(destino.plantacaoId);
    assert.equal(ad.usuarioId.$oid, dono(destino).$oid); assert.notEqual(ad.usuarioId.$oid, e.autorId.$oid);
    assert.equal(ad.experienciaId.$oid, id(e)); assert.equal(ad.experienciaVersao, e.versao);
    assert.equal(plantacao.culturaId.$oid, e.culturaId.$oid); assert.equal(destino.problemaAgricolaId.$oid, e.problemaAgricolaId.$oid);
    assert.deepEqual(ad.metodoCopiado, e.metodo); assert(tempo(e.publicadoEm) < tempo(ad.criadoEm));
    assert(tempo(ad.criadoEm) <= tempo(ad.atualizadoEm));
    if (ad.status === 'realizada') {
      const tr = obter(ad.tratamentoId); assert.equal(tr.ocorrenciaId.$oid, id(destino));
      assert(tempo(ad.criadoEm) < tempo(tr.dataAplicacao)); assert.deepEqual(ad.atualizadoEm, tr.dataAplicacao);
    } else assert(!('tratamentoId' in ad));
  }
  assert(tempo(alias('adocao_cancelada').atualizadoEm) < tempo(alias('adocao_realizada').criadoEm));
  assert(tempo(alias('adocao_realizada').atualizadoEm) < tempo(alias('adocao_planejada').criadoEm));
  assert(tempo(alt.depois.revisadoEm) >= tempo(alt.antes.criadoEm));
  assert(tempo(alias('adocao_planejada').criadoEm) <= Date.now());
  for (const i of base.indices.filter(i => i.opcoes.unique)) {
    const vistos = new Set();
    for (const {col, doc} of todos.values()) if (col === i.colecao && comum.dentro(doc, i.opcoes.partialFilterExpression)) {
      const chave = comum.assinatura(Object.keys(i.key).map(k => comum.bson(k.split('.').reduce((v, s) => v?.[s], doc) ?? null)));
      assert(!vistos.has(chave)); vistos.add(chave);
    }
  }
}
function destino(db) { if (db.databaseName !== BANCO) falhar('destino_desenvolvimento_obrigatorio'); }
async function preConferir(db, p, indices, session, etapa = () => {}) {
  destino(db);
  etapa('conferir_principal');
  const original = await comum.validar(db, p.base, session);
  if (!original.aprovado) falhar('principal_divergente_preservado', original.problemas);
  etapa('conferir_comunidade');
  await comunidade.validar(db, p.c, indices, session);
  etapa('conferir_ficha');
  const atual = await db.collection('problemas_agricolas').findOne({_id: comum.bson(p.alteracao.antes._id)}, {session});
  const antes = comum.igual(atual, comum.bson(p.alteracao.antes)), depois = comum.igual(atual, comum.bson(p.alteracao.depois));
  if (!antes && !depois) falhar('ficha_divergente_preservada', [id(p.alteracao.antes)]);
  etapa('auditar_referencias_e_unicidade');
  const pre = await comum.preConferir(db, p.combinado, indices, session);
  const presentes = Object.values(p.dados).flat().filter(d => pre.presentes.has(id(d))).length;
  if (!(antes && presentes === 0) && !(depois && presentes === 8)) falhar('demonstracao_parcial_preservada', [presentes, antes ? 'antes' : 'depois']);
  return {aprovado: true, estado: antes ? 'antes_da_demonstracao' : 'demonstracao_aplicada', principalPreservado: 184,
    fichaExistenteComAlteracaoExplicita: 1, comunidadePreservada: 7, adicionaisPresentes: presentes,
    novos: 8 - presentes, fichasPendentesInativas: antes ? 40 : 39, aprovacoesEditoriaisSimuladas: depois ? 1 : 0,
    revisaoTecnicaRealComprovada: false, escritaExecutada: false};
}
async function validar(db, p, indices, session) {
  const pre = await preConferir(db, p, indices, session);
  if (pre.adicionaisPresentes !== 8) falhar('demonstracao_ainda_nao_aplicada');
  const verificacoes = [];
  for (const [col, docs] of Object.entries(p.dados)) if (docs.length) {
    const invalidos = await db.collection(col).countDocuments({_id: {$in: docs.map(d => comum.bson(d._id))}, $nor: [p.base.configs[col].validator]}, {session});
    if (invalidos) falhar('schema_demonstracao_invalido', [col, invalidos]);
    verificacoes.push({colecao: col, identicos: docs.length, invalidos});
  }
  return {...pre, verificacoes, totalDocumentosDosLotes: 200};
}
async function aplicar(db, p, indices, session) {
  destino(db); let resultado;
  await session.withTransaction(async () => {
    const pre = await preConferir(db, p, indices, session);
    let inseridos = 0, alterados = 0;
    if (pre.novos) {
      // Compare-and-swap do documento inteiro: protege estado anterior, IDs e campos.
      const r = await db.collection('problemas_agricolas').replaceOne(comum.bson(p.alteracao.antes), comum.bson(p.alteracao.depois), {session});
      if (r.matchedCount !== 1 || r.modifiedCount !== 1) falhar('estado_anterior_da_ficha_mudou');
      alterados = 1;
      for (const col of ['ocorrencias', 'tratamentos', 'experiencias_comunidade', 'adocoes_tratamento']) {
        const r = await db.collection(col).insertMany(p.dados[col].map(comum.bson), {session, ordered: true}); inseridos += r.insertedCount;
      }
    }
    const conferencia = await validar(db, p, indices, session);
    resultado = {aprovado: true, transacaoConfirmada: true, inseridos, fichaExistenteAlterada: alterados,
      escritaExecutada: inseridos > 0, conferencia};
  }, {readConcern: {level: 'snapshot'}, writeConcern: {w: 'majority'}});
  return resultado;
}
async function executar(modo) {
  let cliente, session;
  let etapa = 'preparacao_local';
  const ambiente = {origemUri: 'ainda_nao_carregada'};
  const marcarEtapa = valor => { etapa = valor; };
  try {
    const p = carregar();
    if (process.argv.some(a => a.startsWith('--banco=') && a !== '--banco=sentinela')) falhar('destino_desenvolvimento_obrigatorio');
    etapa = 'carregar_ambiente';
    ambiente.origemUri = process.env.MONGODB_URI ? 'variavel_do_processo' : 'backend/.env';
    if (!process.env.MONGODB_URI) {
      const carregamento = backend('dotenv').config({path: path.resolve(__dirname, '../../../backend/.env'), debug: false, quiet: true});
      if (carregamento.error) throw carregamento.error;
    }
    if (!process.env.MONGODB_URI) falhar('MONGODB_URI_ausente');
    if (!/^mongodb(?:\+srv)?:\/\//.test(process.env.MONGODB_URI)) falhar('MONGODB_URI_formato_invalido');
    etapa = 'carregar_driver';
    const {MongoClient} = backend('mongoose').mongo;
    etapa = 'criar_cliente';
    cliente = new MongoClient(process.env.MONGODB_URI, {serverSelectionTimeoutMS: 10000});
    // Só a modalidade da conexão; nunca retornar hosts, usuário ou opções completas.
    ambiente.modalidade = cliente.options.srvHost ? 'mongodb_srv' : 'mongodb_direto';
    etapa = 'conectar_mongodb';
    await cliente.connect(); const db = cliente.db(BANCO);
    etapa = 'conferir_configuracao';
    const indices = await comum.configuracao(db, p.base);
    let resultado;
    if (modo === 'validar') { etapa = 'validar_demonstracao'; resultado = await validar(db, p, indices); }
    else if (modo === 'aplicar' && process.argv.includes('--aplicar')) {
      etapa = 'aplicar_transacao';
      session = cliente.startSession(); resultado = await aplicar(db, p, indices, session);
    } else resultado = await preConferir(db, p, indices, undefined, marcarEtapa);
    console.log(JSON.stringify({banco: BANCO, lote: 'adocoes_demonstracao_academica', modo, impressao: p.impressao,
      ambiente, executadoEm: new Date().toISOString(), ...resultado}, null, 2));
  } catch (e) {
    console.error(JSON.stringify(require('../diagnostico-bd6.cjs').relatorio(e, {banco: BANCO,
      lote: 'adocoes_demonstracao_academica', modo, etapa, ambiente,
      escritaSolicitada: modo === 'aplicar' && process.argv.includes('--aplicar')}), null, 2));
    process.exitCode = 1;
  } finally {
    for (const fechar of [() => session?.endSession(), () => cliente?.close()]) {
      try { await fechar(); } catch { console.error(JSON.stringify({aprovado: false, codigo: 'falha_ao_encerrar_conexao'})); process.exitCode = 1; }
    }
  }
}
module.exports = {carregar, conferirLocal, preConferir, aplicar, validar, executar};
