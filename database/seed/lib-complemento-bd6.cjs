'use strict';
// Confere, insere e valida as quatro experiências e três denúncias do complemento.
// Importar este módulo não conecta ao MongoDB nem carrega credenciais.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {createRequire} = require('node:module');
const lib = require('./lib-bd6.cjs');
const raiz = __dirname;
const backend = createRequire(path.join(raiz, '../../backend/package.json'));
const ler = n => JSON.parse(fs.readFileSync(path.join(raiz, n), 'utf8'));
function falhar(codigo, detalhes = []) { const e = new Error(codigo); e.codigoSeguro = codigo; e.detalhesSeguros = detalhes; throw e; }
function conferirLocal(base, dados, manifesto) {
const todos = new Map(base.porId);
const oid = v => v.$oid;
const tempo = v => Date.parse(v.$date);
for (const [arquivo, hash] of Object.entries(manifesto.arquivosPrincipaisPreservadosSha256)) {
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(lib.arquivoSeed(arquivo))).digest('hex'), hash, arquivo);
}
assert.equal(base.impressao, manifesto.estadoLotePrincipal.impressaoPacotePreConferido);
assert.equal(base.porId.size, 185);
assert.deepEqual(Object.fromEntries(Object.entries(dados).map(([c, ds]) => [c, ds.length])), {
  experiencias_comunidade: 4, adocoes_tratamento: 0, denuncias_comunidade: 3,
});
for (const [col, docs] of Object.entries(dados)) for (const doc of docs) {
  assert(!todos.has(oid(doc._id)), 'ID repetido');
  assert.deepEqual(lib.errosSchema(doc, base.configs[col].validator.$jsonSchema), [], col);
  todos.set(oid(doc._id), {col, doc});
}
assert.deepEqual(new Set(manifesto.documentos.map(d => oid(d.idReservado))),
  new Set(Object.values(dados).flat().map(d => oid(d._id))));
function referencias(v) {
  if (!v || typeof v !== 'object') return;
  for (const [k, valor] of Object.entries(v)) {
    if (lib.referencias[k]) for (const ref of Array.isArray(valor) ? valor : [valor]) {
      assert.equal(todos.get(oid(ref))?.col, lib.referencias[k], k);
    }
    referencias(valor);
  }
}
const obter = ref => todos.get(oid(ref)).doc;
for (const doc of Object.values(dados).flat()) referencias(doc);
for (const e of dados.experiencias_comunidade) {
  const oc = obter(e.ocorrenciaOrigemId), pl = obter(oc.plantacaoId);
  const prop = obter(obter(pl.talhaoId).propriedadeId), tr = obter(e.tratamentoOrigemId);
  assert.equal(oid(prop.usuarioId), oid(e.autorId));
  assert.equal(oid(pl.culturaId), oid(e.culturaId));
  assert.equal(obter(e.culturaId).nome, e.culturaNome);
  assert.equal(obter(e.autorId).nomePublico, e.nomePublico);
  assert.equal(oc.tipo, e.tipoProblema);
  assert.equal(oc.status, e.statusOcorrencia);
  assert.equal(oid(tr.ocorrenciaId), oid(oc._id));
  assert.deepEqual(e.metodo, {tipoMedida: tr.tipoMedida, descricao: tr.descricao});
  assert(tempo(tr.dataAplicacao) <= tempo(e.criadoEm));
  assert(tempo(e.criadoEm) <= tempo(e.atualizadoEm));
  if (e.moderacao.revisadoEm) assert(tempo(e.criadoEm) <= tempo(e.moderacao.revisadoEm) && tempo(e.moderacao.revisadoEm) <= tempo(e.atualizadoEm));
  if (e.publicadoEm) assert(tempo(e.criadoEm) <= tempo(e.publicadoEm) && tempo(e.publicadoEm) <= tempo(e.atualizadoEm));
  assert.equal(e.tipoProblema, 'nao_identificado');
  assert(!('problemaAgricolaId' in e));
}
for (const d of dados.denuncias_comunidade) {
  const e = obter(d.experienciaId);
  assert.notEqual(oid(e.autorId), oid(d.denuncianteId));
  assert(tempo(e.publicadoEm) <= tempo(d.criadoEm));
  assert(tempo(d.criadoEm) <= tempo(d.atualizadoEm));
  if (d.status === 'analisada') {
    assert(tempo(d.criadoEm) <= tempo(d.analisadoEm));
    assert.equal(tempo(d.analisadoEm), tempo(d.atualizadoEm));
    if (d.decisao === 'ocultar_publicacao') {
      assert.equal(e.moderacao.status, 'oculta');
      assert(tempo(d.criadoEm) < tempo(e.moderacao.revisadoEm));
      assert.deepEqual(e.moderacao.revisadoPor, d.analisadoPor);
      assert.deepEqual(e.moderacao.revisadoEm, d.analisadoEm);
    } else assert.equal(e.moderacao.status, 'aprovada');
  }
}
// Mesmo filtro parcial e mesmas chaves dos índices atuais; snapshots locais apenas.
const campo = (d, k) => k.split('.').reduce((v, s) => v?.[s], d);
for (const i of base.indices.filter(i => i.opcoes.unique)) {
  const vistos = new Set();
  for (const d of [...(base.dados[i.colecao] || []), ...(dados[i.colecao] || [])]) {
    if (!lib.dentro(d, i.opcoes.partialFilterExpression)) continue;
    const chave = JSON.stringify(Object.keys(i.key).map(k => campo(d, k)));
    assert(!vistos.has(chave), i.nome); vistos.add(chave);
  }
}
assert.equal(manifesto.adocoesBloqueadas.length, 3);
assert(base.dados.problemas_agricolas.every(d => !d.ativo && d.revisaoEditorial.status === 'pendente'));

}
function carregar() {
  const base = lib.carregar(), dados = ler('comunidade-complementar-bd6.json');
  const manifesto = ler('manifesto-comunidade-complementar-bd6.json');
  try { conferirLocal(base, dados, manifesto); } catch { falhar('complemento_local_incompativel'); }
  const combinado = {...base, dados: Object.fromEntries(Object.entries(base.dados).map(([c, ds]) => [c, [...ds, ...(dados[c] || [])]]))};
  const impressao = crypto.createHash('sha256').update(base.impressao + JSON.stringify(dados) + JSON.stringify(manifesto)).digest('hex');
  return {base, dados, manifesto, combinado, impressao};
}
async function preConferir(db, p, indices, session) {
  const principal = await lib.validar(db, p.base, session);
  if (!principal.aprovado) falhar('principal_ausente_ou_divergente_preservado', principal.problemas);
  // Reutiliza auditoria de IDs, igualdade BSON e TODOS os índices únicos existentes.
  const pre = await lib.preConferir(db, p.combinado, indices, session);
  const contagens = Object.fromEntries(Object.entries(p.dados).map(([c, ds]) => {
    const iguais = ds.filter(d => pre.presentes.has(d._id.$oid)).length;
    return [c, {preparados: ds.length, existentesIguais: iguais, novos: ds.length - iguais}];
  }));
  const presentes = Object.values(contagens).reduce((n, c) => n + c.existentesIguais, 0);
  if (presentes !== 0 && presentes !== 7) falhar('complemento_parcial_preservado_requer_analise', [presentes]);
  return {aprovado: true, estadoEditorialDemonstracao: principal.estadoEditorialDemonstracao, principalConferido: 185, contagens, novos: 7 - presentes, presentes, escritaExecutada: false};
}
async function validar(db, p, indices, session) {
  const pre = await preConferir(db, p, indices, session);
  if (pre.presentes !== 7) falhar('complemento_ausente', [pre.presentes]);
  const verificacoes = [];
  for (const [col, docs] of Object.entries(p.dados)) {
    if (!docs.length) continue;
    const ids = docs.map(d => lib.bson(d._id));
    const invalidos = await db.collection(col).countDocuments({_id: {$in: ids}, $nor: [p.base.configs[col].validator]}, {session});
    if (invalidos) falhar('schema_complemento_invalido', [col, invalidos]);
    verificacoes.push({colecao: col, encontradosIdenticos: docs.length, invalidos});
  }
  return {...pre, verificacoes, referencias: 'Pais do principal e snapshots do complemento presentes e identicos; cronologia conferida localmente sobre esses snapshots'};
}
async function inserir(db, p, indices, session) {
  let resultado;
  await session.withTransaction(async () => {
    const pre = await preConferir(db, p, indices, session);
    let inseridos = 0;
    if (pre.novos) {
      // Snapshots históricos simulados, gravados atomicamente. Nenhum update/replace.
      for (const col of ['experiencias_comunidade', 'denuncias_comunidade']) {
        const r = await db.collection(col).insertMany(p.dados[col].map(lib.bson), {session, ordered: true});
        inseridos += r.insertedCount;
      }
    }
    const conferencia = await validar(db, p, indices, session);
    resultado = {aprovado: true, transacaoConfirmada: true, inseridos, preexistentesDoComplementoPreservados: pre.presentes,
      escritaExecutada: inseridos > 0, conferencia};
  }, {readConcern: {level: 'snapshot'}, writeConcern: {w: 'majority'}});
  return resultado;
}
async function executar(modo) {
  let cliente, session;
  try {
    const p = carregar();
    if (process.argv.some(a => a.startsWith('--banco=') && a !== '--banco=sentinela')) falhar('destino_nao_permitido');
    if (!process.env.MONGODB_URI) backend('dotenv').config({path: path.join(raiz, '../../backend/.env')});
    if (!process.env.MONGODB_URI) falhar('MONGODB_URI_ausente');
    const {MongoClient} = backend('mongoose').mongo;
    cliente = new MongoClient(process.env.MONGODB_URI, {serverSelectionTimeoutMS: 10000});
    await cliente.connect();
    const db = cliente.db('sentinela'), indices = await lib.configuracao(db, p.base);
    let resultado;
    if (modo === 'validar') resultado = await validar(db, p, indices);
    else if (modo === 'inserir' && process.argv.includes('--aplicar')) {
      session = cliente.startSession(); resultado = await inserir(db, p, indices, session);
    } else resultado = await preConferir(db, p, indices);
    console.log(JSON.stringify({banco: 'sentinela', lote: 'complemento_comunidade', modo,
      executadoEm: new Date().toISOString(), impressaoComplemento: p.impressao,
      impressaoPrincipal: p.base.impressao, configuracoesConferidas: {colecoes: 15, validadores: 15, indicesBD4: 22},
      adocoesPlanejadasEmLoteSeparado: 3, ...resultado}, null, 2));
  } catch (e) {
    // Mensagens do driver e stacks podem conter credenciais ou valores pessoais.
    console.error(JSON.stringify({aprovado: false, codigo: e.codigoSeguro || 'erro_mongodb_ou_ambiente',
      codigoMongoDB: typeof e.code === 'number' ? e.code : undefined, detalhes: e.detalhesSeguros || [],
      orientacao: 'Interromper. Em erro/commit incerto, executar node database/seed/bd6.cjs comunidade validar antes de repetir; nunca sobrescrever divergencias.'}, null, 2));
    process.exitCode = 1;
  } finally {
    for (const fechar of [() => session?.endSession(), () => cliente?.close()]) {
      try { await fechar(); } catch { console.error(JSON.stringify({aprovado: false, codigo: 'falha_ao_encerrar_conexao'})); process.exitCode = 1; }
    }
  }
}
module.exports = {carregar, conferirLocal, preConferir, inserir, validar, executar};
