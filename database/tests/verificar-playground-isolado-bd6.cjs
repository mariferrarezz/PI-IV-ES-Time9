'use strict';
// Avalia o Playground em memória. Não conecta, não lê .env e não usa a extensão.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createRequire} = require('node:module');
const backend = createRequire(path.resolve(__dirname, '../../backend/package.json'));
const {EJSON} = backend('mongoose').mongo.BSON;
const comum = require('../seed/lib-bd6.cjs');
const p = require('../arquivo/isolado-adocoes-bd6/lib.cjs').carregar();
const fonte = fs.readFileSync(path.join(__dirname, '../arquivo/isolado-adocoes-bd6/conferir-configuracao.mongodb.js'), 'utf8');
assert(!/\.(insert\w*|update\w*|replace\w*|delete\w*|drop\w*|createCollection|createIndex\w*|runCommand)\s*\(/.test(fonte));
assert(!/\$(out|merge)\s*:/.test(fonte));
function corresponde(d, f) {
  return Object.entries(f).every(([k, v]) => {
    if (k === '$and') return v.every(s => corresponde(d, s));
    if (k === '$or') return v.some(s => corresponde(d, s));
    const atual = k.split('.').reduce((a, s) => a?.[s], d);
    if (v && typeof v === 'object' && !v._bsontype && !(v instanceof Date)) {
      if ('$in' in v) return v.$in.some(s => comum.igual(atual, s));
      if ('$ne' in v) return !comum.igual(atual, v.$ne);
    }
    return comum.igual(atual, v);
  });
}
function executar(op = {}) {
  let conexoes = 0;
  const dados = Object.fromEntries(Object.entries(p.dados).map(([c, ds]) => [c, op.povoado ? ds.map(comum.bson) : []]));
  if (op.divergente) dados.usuarios[0].nomeCompleto = 'Alteracao preservada';
  if (op.colisao) dados.usuarios.push({...comum.bson(p.dados.usuarios[0]), _id: comum.bson({$oid: '000000000000000000000001'})});
  const info = Object.entries(p.configs).map(([name, c]) => ({name, type: 'collection', options: c}));
  if (op.schema) info[0].options = {...info[0].options, validator: {}};
  const indices = Object.fromEntries(Object.keys(p.dados).map(c => [c, [
    {name: '_id_', key: {_id: 1}, unique: true}, ...p.indices.filter(i => i.colecao === c).map(i => ({name: i.nome, key: i.key, ...i.opcoes})),
  ]]));
  if (op.indice) indices.adocoes_tratamento.find(i => i.name.startsWith('uq_')).partialFilterExpression = {status: 'cancelada'};
  const db = {getSiblingDB(nome) {
    assert.equal(nome, 'sentinela_testes_bd6'); conexoes++;
    return {getName: () => nome, getCollectionInfos: () => {
      if (op.negado) { const e = new Error('Mensagem deliberadamente nao retornada'); e.code = 13; throw e; }
      return op.configurado ? info : [];
    }, getCollection(col) {
      assert(Object.keys(p.dados).includes(col));
      return {
        getIndexes: () => indices[col],
        countDocuments: () => op.invalido ? 1 : 0,
        find: filtro => ({collation() { return this; }, toArray: () => dados[col].filter(d => corresponde(d, filtro))}),
        findOne: filtro => dados[col].find(d => corresponde(d, filtro)) || null,
        aggregate: pipeline => ({toArray: () => {
          const incluidos = dados[col].filter(d => corresponde(d, pipeline[0].$match));
          const grupos = new Map();
          for (const d of incluidos) {
            const chave = comum.assinatura(Object.values(pipeline[1].$group._id).map(k => k.slice(1).split('.').reduce((v, s) => v?.[s], d)));
            grupos.set(chave, (grupos.get(chave) || 0) + 1);
          }
          return [...grupos.values()].filter(n => n > 1).slice(0, 1).map(total => ({total}));
        }}),
      };
    }};
  }};
  const sandbox = {db, EJSON, use: nome => assert.equal(nome, 'sentinela_testes_bd6')};
  const resultado = vm.runInNewContext(fonte, sandbox, {timeout: 10000});
  assert.equal(conexoes, 1);
  const copiado = vm.runInNewContext('snapshotEjson', sandbox);
  const snapshot = EJSON.deserialize(JSON.parse(JSON.stringify(copiado)));
  assert(comum.igual(snapshot.configs, p.configs));
  assert(comum.igual(snapshot.indices, p.indices));
  assert(comum.igual(snapshot.dados, Object.fromEntries(Object.entries(p.dados).map(([c, ds]) => [c, ds.map(comum.bson)]))));
  assert.equal(snapshot.impressao, p.impressao);
  assert.equal(resultado.escritaExecutada, false);
  return resultado;
}
const vazio = executar();
assert.equal(vazio.aprovado, true); assert.equal(vazio.colecoesAusentes.length, 15); assert.equal(vazio.indicesAusentes.length, 22); assert.equal(vazio.documentosNovos, 22);
const pronto = executar({configurado: true, povoado: true});
assert.equal(pronto.aprovado, true); assert.equal(pronto.configuracaoCompleta, true); assert.equal(pronto.documentosPresentesIguais, 22);
assert.equal(executar({configurado: true, povoado: true, schema: true}).codigo, 'configuracao_isolada_divergente_preservada');
assert.equal(executar({configurado: true, povoado: true, indice: true}).codigo, 'indice_isolado_divergente_preservado');
assert.equal(executar({configurado: true, povoado: true, divergente: true}).codigo, 'documento_existente_divergente_preservado');
assert.equal(executar({configurado: true, povoado: true, colisao: true}).codigo, 'duplicidade_isolada_preservada');
assert.equal(executar({configurado: true, invalido: true}).codigo, 'documentos_isolados_invalidos_preservados');
const negado = executar({negado: true});
assert.equal(negado.codigoMongoDB, 13); assert(!JSON.stringify(negado).includes('Mensagem deliberadamente'));
console.log(JSON.stringify({somenteLocal: true, aprovado: true, cenarios: 8, snapshotCompletoAtual: true,
  destinoExclusivo: 'sentinela_testes_bd6', escritaExecutada: false, conexaoRealExecutada: false}));
