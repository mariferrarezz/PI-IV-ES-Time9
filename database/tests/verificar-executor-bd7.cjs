'use strict';
// Exercita somente em memória os filtros, resumos e proteção do CRUD temporário BD7.
// Não carrega .env, não cria conexão e não grava arquivos ou documentos remotos.
const assert = require('node:assert/strict');
const {createRequire} = require('node:module');
const path = require('node:path');
const req = createRequire(path.resolve(__dirname, '../../backend/package.json'));
const {BSON} = req('mongoose').mongo;
const base = require('../seed/lib-bd6.cjs');
const api = require('./validar-bd7.cjs');
const clone = d => BSON.EJSON.deserialize(BSON.EJSON.serialize(d));
function memoria(p, aceitarInvalidos = false) {
  const usuarioId = base.bson(p.dados.usuarios[0]._id);
  const anterior = base.bson(p.dados.propriedades[0]);
  const docs = new Map([[anterior._id.toHexString(), anterior]]), removidos = [];
  const seleciona = f => [...docs.values()].filter(d => f._id?.$in
    ? f._id.$in.some(id => id.equals(d._id)) : f._id.equals(d._id));
  const validar = d => {
    if (!aceitarInvalidos && base.errosSchema(BSON.EJSON.serialize(d), p.p.base.configs.propriedades.validator.$jsonSchema).length) {
      const e = new Error('schema_simulado'); e.code = 121; throw e;
    }
  };
  const props = {
    async countDocuments(f) { return seleciona(f).length; },
    async findOne(f) { return clone(seleciona(f)[0] || null); },
    async insertOne(d) {
      if (docs.has(d._id.toHexString())) { const e = new Error('duplicidade_simulada'); e.code = 11000; throw e; }
      validar(d); docs.set(d._id.toHexString(), clone(d)); return {acknowledged: true};
    },
    async updateOne(f, u) {
      const d = seleciona(f)[0], alterado = {...d, ...u.$set}; validar(alterado);
      docs.set(d._id.toHexString(), clone(alterado)); return {matchedCount: 1, modifiedCount: 1};
    },
    async deleteOne(f) { const d = seleciona(f)[0]; if (d) { docs.delete(d._id.toHexString()); removidos.push(d._id.toHexString()); } return {deletedCount: d ? 1 : 0}; },
    async deleteMany(f) { for (const d of seleciona(f)) { docs.delete(d._id.toHexString()); removidos.push(d._id.toHexString()); } },
  };
  return {db: {collection(c) {
    if (c === 'propriedades') return props;
    assert.equal(c, 'usuarios');
    return {findOne: async f => f._id.equals(usuarioId) ? {_id: usuarioId} : null,
      countDocuments: async f => f._id.equals(usuarioId) ? 1 : 0};
  }}, docs, removidos, anterior, usuarioId};
}
(async () => {
  const p = api.plano();
  const q = api.consultas(p);
  for (const s of ['planejada', 'realizada', 'cancelada']) assert.equal(q.find(x => x.nome === 'Adoção ' + s).esperados.length, 1);
  assert(q.some(x => x.nome === 'Inspeção sem ocorrência' && x.esperados.length));
  assert.equal(p.dados.problemas_agricolas.filter(d => d.ativo).length, 1);
  const resumo = api.resumoExplain({queryPlanner: {winningPlan: {stage: 'FETCH', inputStage: {stage: 'IXSCAN', indexName: 'ix_teste', indexBounds: {segredo: 'omitido'}}}, rejectedPlans: [{stage: 'SORT'}]},
    executionStats: {nReturned: 1, totalKeysExamined: 2, totalDocsExamined: 1}});
  assert.equal(resumo.ordenacaoEmMemoria, false); assert(!JSON.stringify(resumo).includes('omitido'));
  assert.equal(api.resumoExplain({}).retornados, null);
  const m = memoria(p), resultado = await api.crud(m.db, m.usuarioId);
  assert(resultado.aprovado); assert.equal(m.docs.size, 1);
  assert(base.igual(m.docs.get(m.anterior._id.toHexString()), m.anterior));
  assert(!m.removidos.includes(m.anterior._id.toHexString()));
  const permissivo = memoria(p, true);
  await assert.rejects(() => api.crud(permissivo.db, permissivo.usuarioId));
  assert.equal(permissivo.docs.size, 1); // Falha inesperada não vira aprovação; limpeza só dos próprios.
  const semLimpeza = memoria(p);
  const col = semLimpeza.db.collection('propriedades');
  col.deleteMany = async () => { throw new Error('falha_simulada'); };
  await assert.rejects(() => api.crud(semLimpeza.db, semLimpeza.usuarioId), e => e.codigoSeguro === 'limpeza_temporarios_pendente' && e.idsTemporarios.length > 0);
  console.log(JSON.stringify({aprovado: true, somenteMemoria: true, gruposAprovados: 5,
    testes: ['Cenários e três adoções', 'Explain sem dados ou planos rejeitados', 'CRUD e limpeza só dos próprios temporários',
      'Aceitação inesperada de inválido causa falha', 'Falha de limpeza informa IDs para conferência'],
    limite: 'Mocks não comprovam comportamento, permissões ou validação no servidor MongoDB.'}, null, 2));
})().catch(() => { console.error('{"aprovado":false,"codigo":"teste_local_bd7_falhou"}'); process.exitCode = 1; });
