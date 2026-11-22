'use strict';
// Importar/carregar não usa rede nem .env. Destino deliberadamente fixo.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {createRequire} = require('node:module');
const comum = require('../../seed/lib-bd6.cjs');
const backend = createRequire(path.resolve(__dirname, '../../../backend/package.json'));
const BANCO = 'sentinela_testes_bd6';
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const ler = n => JSON.parse(fs.readFileSync(path.join(__dirname, n), 'utf8'));
function falhar(codigo, detalhes = []) { const e = new Error(codigo); e.codigoSeguro = codigo; e.detalhesSeguros = detalhes; throw e; }
function carregar() {
  const compartilhado = comum.carregar(), manifesto = ler('manifesto.json'), dados = ler('documentos.json');
  const p = {dados, manifesto: {ciclosHistoricos: []}, configs: compartilhado.configs,
    indices: compartilhado.indices, aliasesFontes: {}, isolado: manifesto};
  try { conferirLocal(p, compartilhado); } catch { falhar('massa_isolada_local_incompativel'); }
  p.impressao = hash(JSON.stringify(dados) + JSON.stringify(manifesto) + comum.assinatura(p.configs) + comum.assinatura(p.indices));
  return p;
}
function conferirLocal(p, compartilhado) {
  const {dados, isolado: m} = p;
  assert.equal(m.banco, BANCO);
  for (const [nome, esperado] of Object.entries(m.compartilhadoPreservadoSha256)) {
    assert.equal(hash(fs.readFileSync(comum.arquivoSeed(nome))), esperado, nome);
  }
  assert.deepEqual(Object.keys(dados).sort(), Object.keys(p.configs).sort());
  const todos = new Map();
  for (const [col, docs] of Object.entries(dados)) {
    assert.equal(m.contagens[col], docs.length);
    for (const d of docs) {
      assert(!todos.has(d._id.$oid));
      assert(!compartilhado.porId.has(d._id.$oid));
      assert.deepEqual(comum.errosSchema(d, p.configs[col].validator.$jsonSchema), []);
      todos.set(d._id.$oid, {col, doc: d});
    }
  }
  assert.equal(todos.size, 22);
  assert.equal(Object.keys(m.aliases).length, 22);
  for (const [a, ref] of Object.entries(m.aliases)) {
    assert.equal(ref.id.$oid, hash(m.namespace + ':' + a).slice(0, 24));
    assert.equal(todos.get(ref.id.$oid)?.col, ref.colecao);
  }
  const obter = ref => todos.get(ref.$oid).doc;
  const alias = a => obter(m.aliases[a].id);
  function referencias(v) {
    if (!v || typeof v !== 'object') return;
    for (const [k, val] of Object.entries(v)) {
      if (comum.referencias[k]) for (const ref of Array.isArray(val) ? val : [val]) assert.equal(todos.get(ref.$oid)?.col, comum.referencias[k]);
      referencias(val);
    }
  }
  for (const {doc} of todos.values()) referencias(doc);
  const tempo = d => Date.parse(d.$date);
  const simulado = texto => texto.includes('SIMULACAO PARA TESTES');
  const ficha = alias('problema_catalogo');
  const fonteBase = compartilhado.dados.problemas_agricolas.find(d => d.codigoEditorial === m.fichaBase.codigoEditorial);
  assert(fonteBase); assert.equal(dados.problemas_agricolas.length, 1);
  // Preservar as seções da única ficha copiada, sem inventar outros problemas.
  const camposSimulados = new Set(['_id', 'culturasAfetadasIds', 'fontesIds', 'ativo', 'revisadoEm', 'revisaoEditorial', 'criadoEm', 'atualizadoEm']);
  for (const [k, v] of Object.entries(fonteBase)) if (!camposSimulados.has(k)) assert.deepEqual(ficha[k], v);
  assert.equal(ficha.ativo, true); assert.equal(ficha.revisaoEditorial.status, 'aprovada');
  assert(simulado(ficha.revisaoEditorial.observacoes));
  assert.equal(ficha.revisaoEditorial.registroAgrofitConferido, false);
  assert(tempo(ficha.criadoEm) <= tempo(ficha.revisadoEm));
  assert(tempo(ficha.revisadoEm) <= tempo(ficha.atualizadoEm));
  for (let i = 0; i < ficha.fontesIds.length; i++) {
    const original = obter(ficha.fontesIds[i]), fonte = compartilhado.dados.fontes_conhecimento.find(d => d._id.$oid === fonteBase.fontesIds[i].$oid);
    const semId = d => Object.fromEntries(Object.entries(d).filter(([k]) => k !== '_id'));
    assert.deepEqual(semId(original), semId(fonte));
  }
  const dono = oc => obter(obter(obter(obter(oc.plantacaoId).talhaoId).propriedadeId).usuarioId);
  for (const oc of dados.ocorrencias) {
    const pl = obter(oc.plantacaoId);
    assert.equal(pl.status, 'ativa'); assert.equal(oc.status, 'aberta');
    assert.equal(dono(oc)._id.$oid, oc.registradoPor.$oid);
    assert.equal(oc.problemaAgricolaId.$oid, ficha._id.$oid);
    assert.equal(oc.tipo, ficha.tipo);
    assert(ficha.culturasAfetadasIds.some(c => c.$oid === pl.culturaId.$oid));
    assert(tempo(ficha.revisadoEm) <= tempo(oc.dataObservacao));
    assert(tempo(pl.dataPlantio) <= tempo(oc.dataObservacao));
  }
  for (const tr of dados.tratamentos) {
    const oc = obter(tr.ocorrenciaId);
    assert.equal(tr.registradoPor.$oid, dono(oc)._id.$oid);
    assert(tempo(oc.dataObservacao) <= tempo(tr.dataAplicacao));
    assert(simulado(tr.descricao));
  }
  const e = alias('experiencia'), av = alias('avaliacao_a'), origem = alias('ocorrencia_a');
  assert.equal(e.autorId.$oid, dono(origem)._id.$oid);
  assert.equal(e.ocorrenciaOrigemId.$oid, origem._id.$oid);
  assert.equal(e.tratamentoOrigemId.$oid, alias('tratamento_a')._id.$oid);
  assert.equal(e.avaliacaoOrigemId.$oid, av._id.$oid);
  assert.equal(av.tratamentoId.$oid, e.tratamentoOrigemId.$oid);
  assert.equal(av.registradoPor.$oid, e.autorId.$oid);
  assert(tempo(alias('tratamento_a').dataAplicacao) <= tempo(av.dataAvaliacao));
  assert(tempo(av.dataAvaliacao) <= tempo(e.criadoEm));
  assert.deepEqual(e.resultadoRelatado, Object.fromEntries(['resultado', 'dataAvaliacao', 'observacoes'].map(k => [k, av[k]])));
  assert.equal(e.moderacao.status, 'aprovada'); assert(simulado(e.moderacao.motivo));
  assert(tempo(e.criadoEm) <= tempo(e.moderacao.revisadoEm));
  assert.deepEqual(e.publicadoEm, e.moderacao.revisadoEm);
  assert.equal(e.problemaNome, ficha.nomeComum); assert.equal(e.tipoProblema, origem.tipo);
  assert.equal(e.problemaAgricolaId.$oid, origem.problemaAgricolaId.$oid);
  assert.equal(e.culturaId.$oid, obter(origem.plantacaoId).culturaId.$oid);
  assert.equal(e.culturaNome, obter(e.culturaId).nome);
  assert.equal(e.nomePublico, obter(e.autorId).nomePublico);
  assert.deepEqual(e.metodo, Object.fromEntries(['tipoMedida', 'descricao'].map(k => [k, alias('tratamento_a')[k]])));
  assert.deepEqual(new Set(dados.adocoes_tratamento.map(d => d.status)), new Set(['planejada', 'realizada', 'cancelada']));
  for (const ad of dados.adocoes_tratamento) {
    const oc = obter(ad.ocorrenciaId), pl = obter(oc.plantacaoId);
    assert.equal(ad.usuarioId.$oid, dono(oc)._id.$oid);
    assert.notEqual(ad.usuarioId.$oid, e.autorId.$oid);
    assert.equal(ad.experienciaId.$oid, e._id.$oid); assert.equal(ad.experienciaVersao, e.versao);
    assert.equal(pl.culturaId.$oid, e.culturaId.$oid);
    assert.equal(oc.problemaAgricolaId.$oid, e.problemaAgricolaId.$oid);
    assert.deepEqual(ad.metodoCopiado, e.metodo);
    assert(tempo(e.publicadoEm) <= tempo(ad.criadoEm));
    assert(tempo(ad.criadoEm) <= tempo(ad.atualizadoEm));
    if (ad.status === 'realizada') {
      const tr = obter(ad.tratamentoId);
      assert.equal(tr.ocorrenciaId.$oid, oc._id.$oid);
      assert(tempo(ad.criadoEm) < tempo(tr.dataAplicacao));
      assert.deepEqual(ad.atualizadoEm, tr.dataAplicacao);
    } else assert(!('tratamentoId' in ad));
  }
  // Janelas não se sobrepõem: cancelar, realizar e só então abrir nova planejada.
  assert(tempo(alias('adocao_cancelada').atualizadoEm) < tempo(alias('adocao_realizada').criadoEm));
  assert(tempo(alias('adocao_realizada').atualizadoEm) < tempo(alias('adocao_planejada').criadoEm));
  for (const prop of dados.propriedades) assert(dados.talhoes.filter(t => t.propriedadeId.$oid === prop._id.$oid).reduce((n, t) => n + t.areaHa, 0) <= prop.areaTotalHa);
  for (const pl of dados.plantacoes) assert(pl.areaPlantadaHa <= obter(pl.talhaoId).areaHa);
  for (const i of p.indices.filter(i => i.opcoes.unique)) {
    const vistos = new Set();
    for (const d of dados[i.colecao]) if (comum.dentro(d, i.opcoes.partialFilterExpression)) {
      const chave = comum.assinatura(Object.keys(i.key).map(k => comum.bson(campo(d, k) ?? null)));
      assert(!vistos.has(chave)); vistos.add(chave);
    }
  }
}
const campo = (d, k) => k.split('.').reduce((v, s) => v?.[s], d);
function destino(db) { if (db.databaseName !== BANCO) falhar('destino_isolado_obrigatorio'); }
function corresponde(atual, i) {
  return comum.igual(Object.entries(atual.key), Object.entries(i.key)) && !!atual.unique === !!i.opcoes.unique &&
    comum.igual(atual.partialFilterExpression || {}, i.opcoes.partialFilterExpression || {}) &&
    !atual.sparse && !atual.collation && !atual.hidden && atual.expireAfterSeconds === undefined && !atual.storageEngine && !atual.wildcardProjection;
}
async function planoConfiguracao(db, p) {
  destino(db);
  const infos = await db.listCollections({}, {nameOnly: false}).toArray();
  const novas = [], indices = {}, criarIndices = [];
  for (const [col, cfg] of Object.entries(p.configs)) {
    const info = infos.find(c => c.name === col);
    if (!info) { novas.push(col); indices[col] = []; continue; }
    const op = info.options || {};
    if (info.type !== 'collection' || !comum.igual(op.validator || {}, cfg.validator) || (op.validationLevel || 'strict') !== 'strict' || (op.validationAction || 'error') !== 'error' || op.collation || op.capped || op.timeseries) falhar('configuracao_isolada_divergente_preservada', [col]);
    indices[col] = await db.collection(col).listIndexes().toArray();
    const invalidos = await db.collection(col).countDocuments({$nor: [cfg.validator]});
    if (invalidos) falhar('documentos_isolados_invalidos_preservados', [col, invalidos]);
  }
  for (const i of p.indices) {
    const lista = indices[i.colecao], nome = lista.find(a => a.name === i.nome);
    if (nome && !corresponde(nome, i)) falhar('indice_isolado_divergente_preservado', [i.colecao, i.nome]);
    if (lista.some(a => comum.igual(Object.entries(a.key), Object.entries(i.key)) && !corresponde(a, i))) falhar('chaves_isoladas_com_opcoes_divergentes', [i.colecao, i.nome]);
    if (!lista.some(a => corresponde(a, i))) criarIndices.push(i);
    if (i.opcoes.unique && !novas.includes(i.colecao)) {
      const duplicados = await db.collection(i.colecao).aggregate([
        {$match: i.opcoes.partialFilterExpression || {}},
        {$group: {_id: Object.fromEntries(Object.keys(i.key).map((k, n) => ['c' + n, '$' + k])), total: {$sum: 1}}},
        {$match: {total: {$gt: 1}}}, {$limit: 1}, {$project: {_id: 0, total: 1}},
      ]).toArray();
      if (duplicados.length) falhar('duplicidade_isolada_preservada', [i.colecao, i.nome]);
    }
  }
  // Considera também os índices ainda planejados, sem criar nada durante auditoria.
  const previstos = Object.fromEntries(Object.keys(p.dados).map(c => [c, [...indices[c],
    ...criarIndices.filter(i => i.colecao === c).map(i => ({name: i.nome, key: i.key, ...i.opcoes}))]]));
  await comum.preConferir(db, p, previstos);
  return {novas, criarIndices};
}
async function configurar(db, p, aplicar = false) {
  const plano = await planoConfiguracao(db, p);
  if (aplicar) {
    for (const col of plano.novas) {
      const {validator, validationLevel, validationAction} = p.configs[col];
      await db.createCollection(col, {validator, validationLevel, validationAction});
    }
    for (const i of plano.criarIndices) await db.collection(i.colecao).createIndex(i.key, {name: i.nome, ...i.opcoes});
    await comum.configuracao(db, p);
  }
  return {aprovado: true, colecoesAusentes: plano.novas, indicesAusentes: plano.criarIndices.map(i => i.nome), escritaExecutada: aplicar && (plano.novas.length > 0 || plano.criarIndices.length > 0), configuracaoConferida: aplicar};
}
async function preConferir(db, p, indices, session) {
  destino(db);
  const pre = await comum.preConferir(db, p, indices, session);
  const presentes = pre.presentes.size;
  if (presentes !== 0 && presentes !== 22) falhar('massa_isolada_parcial_preservada', [presentes]);
  return {aprovado: true, presentes, novos: 22 - presentes, contagens: pre.totais, escritaExecutada: false};
}
async function validar(db, p, indices, session) {
  const pre = await preConferir(db, p, indices, session);
  if (pre.presentes !== 22) falhar('massa_isolada_ausente', [pre.presentes]);
  const verificacoes = [];
  for (const [col, docs] of Object.entries(p.dados)) if (docs.length) {
    const invalidos = await db.collection(col).countDocuments({_id: {$in: docs.map(d => comum.bson(d._id))}, $nor: [p.configs[col].validator]}, {session});
    if (invalidos) falhar('schema_isolado_invalido', [col, invalidos]);
    verificacoes.push({colecao: col, identicos: docs.length, invalidos});
  }
  return {...pre, verificacoes, referencias: 'Snapshots esperados presentes e identicos; compatibilidade e cronologia verificadas sobre esses snapshots', revisaoTecnicaComprovada: false};
}
const ORDEM = ['culturas', 'fontes_conhecimento', 'problemas_agricolas', 'usuarios', 'propriedades', 'talhoes', 'plantacoes', 'ocorrencias', 'tratamentos', 'avaliacoes_tratamento', 'experiencias_comunidade', 'adocoes_tratamento'];
async function inserir(db, p, indices, session) {
  destino(db); let resultado;
  await session.withTransaction(async () => {
    const pre = await preConferir(db, p, indices, session);
    let inseridos = 0;
    if (pre.novos) for (const col of ORDEM) {
      const r = await db.collection(col).insertMany(p.dados[col].map(comum.bson), {session, ordered: true});
      inseridos += r.insertedCount;
    }
    const conferencia = await validar(db, p, indices, session);
    resultado = {aprovado: true, transacaoConfirmada: true, inseridos, escritaExecutada: inseridos > 0, conferencia};
  }, {readConcern: {level: 'snapshot'}, writeConcern: {w: 'majority'}});
  return resultado;
}
async function executar(modo) {
  // Plano abandonado e arquivado. Nunca conectar/configurar outro banco por ele.
  console.error(JSON.stringify({aprovado: false, codigo: 'plano_isolado_arquivado_nao_executar'}));
  process.exitCode = 1;
  return;
  let cliente, session;
  try {
    const p = carregar();
    if (process.argv.some(a => a.startsWith('--banco=') && a !== '--banco=' + BANCO)) falhar('destino_isolado_obrigatorio');
    if (!process.env.MONGODB_URI) backend('dotenv').config({path: path.resolve(__dirname, '../../../backend/.env')});
    if (!process.env.MONGODB_URI) falhar('MONGODB_URI_ausente');
    const {MongoClient} = backend('mongoose').mongo;
    cliente = new MongoClient(process.env.MONGODB_URI, {serverSelectionTimeoutMS: 10000});
    await cliente.connect(); const db = cliente.db(BANCO);
    let resultado;
    if (modo === 'configurar') resultado = await configurar(db, p, process.argv.includes('--aplicar'));
    else {
      const indices = await comum.configuracao(db, p);
      if (modo === 'validar') resultado = await validar(db, p, indices);
      else if (modo === 'inserir' && process.argv.includes('--aplicar')) {
        session = cliente.startSession(); resultado = await inserir(db, p, indices, session);
      } else resultado = await preConferir(db, p, indices);
    }
    console.log(JSON.stringify({banco: BANCO, modo, somenteSimulacao: true, executadoEm: new Date().toISOString(), impressao: p.impressao, ...resultado}, null, 2));
  } catch (e) {
    console.error(JSON.stringify({aprovado: false, codigo: e.codigoSeguro || 'erro_mongodb_ou_ambiente', codigoMongoDB: typeof e.code === 'number' ? e.code : undefined,
      detalhes: e.detalhesSeguros || [], orientacao: 'Interromper. Configuracao pode ser parcial: conferir antes de repetir. Em commit incerto, validar primeiro; nunca excluir ou sobrescrever.'}, null, 2));
    process.exitCode = 1;
  } finally {
    for (const fechar of [() => session?.endSession(), () => cliente?.close()]) {
      try { await fechar(); } catch { console.error(JSON.stringify({aprovado: false, codigo: 'falha_ao_encerrar_conexao'})); process.exitCode = 1; }
    }
  }
}
module.exports = {BANCO, carregar, conferirLocal, planoConfiguracao, configurar, preConferir, inserir, validar, executar};
