'use strict';
// Executa somente em memória. NÃO carrega .env, não cria MongoClient e não usa rede.
const assert = require('node:assert/strict');
const l = require('../seed/lib-bd6.cjs');
const {createRequire} = require('node:module');
const path = require('node:path');
const req = createRequire(path.resolve(__dirname, '../../backend/package.json'));
const {BSON} = req('mongoose').mongo;
const clone = v => BSON.EJSON.deserialize(BSON.EJSON.serialize(v, {relaxed: false}), {relaxed: false});
const cru = v => BSON.EJSON.serialize(v, {relaxed: true});
const campo = (d, k) => k.split('.').reduce((v, t) => v?.[t], d);
function eq(a, b, collation) {
  if (collation && typeof a === 'string' && typeof b === 'string') return a.localeCompare(b, 'pt', {sensitivity: 'base'}) === 0;
  return l.igual(a, b);
}
function corresponde(d, q, op = {}) {
  return Object.entries(q).every(([k, v]) => {
    if (k === '$and') return v.every(x => corresponde(d, x, op));
    if (k === '$or') return v.some(x => corresponde(d, x, op));
    if (k === '$nor') return !v.some(x => corresponde(d, x, op));
    if (k === '$jsonSchema') return !l.errosSchema(cru(d), v).length;
    const atual = campo(d, k);
    if (v && typeof v === 'object' && !v._bsontype && !(v instanceof Date)) {
      if ('$in' in v) return v.$in.some(x => eq(atual, x, op.collation));
      if ('$ne' in v) return !eq(atual, v.$ne, op.collation);
      if ('$exists' in v) return (atual !== undefined) === v.$exists;
    }
    return eq(atual, v, op.collation);
  });
}
function bancoMemoria(p) {
  const tabelas = Object.fromEntries(Object.keys(p.dados).map(c => [c, new Map()]));
  const indices = Object.fromEntries(Object.keys(p.dados).map(c => [c, [{name: '_id_', key: {_id: 1}, unique: true}]]));
  for (const i of p.indices) indices[i.colecao].push({name: i.nome, key: i.key, ...i.opcoes});
  indices.propriedades.push({name: 'ownerUid_1', key: {ownerUid: 1}});
  const db = {
    tabelas, indices, escritas: 0, falharNaInsercao: null, insercoes: 0,
    listCollections() { return {toArray: async () => Object.entries(p.configs).map(([name, c]) => ({name, type: 'collection', options: {validator: c.validator, validationLevel: c.validationLevel, validationAction: c.validationAction}}))}; },
    collection(col) {
      return {
        listIndexes: () => ({toArray: async () => indices[col]}),
        async findOne(filtro, op = {}) {
          const d = [...tabelas[col].values()].find(v => corresponde(v, filtro, op));
          return d ? clone(op.projection ? {_id: d._id} : d) : null;
        },
        find: (filtro, op = {}) => ({toArray: async () => [...tabelas[col].values()].filter(d => corresponde(d, filtro, op)).map(d => clone(op.projection ? {_id: d._id} : d))}),
        async countDocuments(filtro) { return [...tabelas[col].values()].filter(d => corresponde(d, filtro)).length; },
        async insertOne(d) {
          db.insercoes++;
          if (db.falharNaInsercao === db.insercoes) { const e = new Error('falha simulada'); e.code = 121; throw e; }
          if (tabelas[col].has(d._id.toHexString())) { const e = new Error('duplicado simulado'); e.code = 11000; throw e; }
          assert.equal(l.errosSchema(cru(d), p.configs[col].validator.$jsonSchema).length, 0);
          function conferirReferencias(v) {
            if (!v || typeof v !== 'object' || v._bsontype || v instanceof Date) return;
            for (const [k, ref] of Object.entries(v)) {
              if (l.referencias[k]) for (const alvo of Array.isArray(ref) ? ref : [ref]) {
                const proprio = l.referencias[k] === col && alvo.toHexString() === d._id.toHexString();
                assert.ok(proprio || tabelas[l.referencias[k]].has(alvo.toHexString()), 'Referencia precisa existir antes do filho: ' + col + '.' + k);
              }
              if (k === 'contexto') assert.ok(tabelas.ocorrencias.has(ref.id.toHexString()));
              conferirReferencias(ref);
            }
          }
          conferirReferencias(d);
          // Confere as restrições únicas atuais também durante estados históricos intermediários.
          for (const i of indices[col].filter(i => i.unique && i.name !== '_id_')) if (l.dentro(cru(d), i.partialFilterExpression)) {
            const filtro = {...Object.fromEntries(Object.keys(i.key).map(k => [k, campo(d, k)])), ...(i.partialFilterExpression || {})};
            if ([...tabelas[col].values()].some(x => corresponde(x, filtro))) { const e = new Error('unico simulado'); e.code = 11000; throw e; }
          }
          tabelas[col].set(d._id.toHexString(), clone(d)); db.escritas++;
          return {acknowledged: true, insertedId: d._id};
        },
        async insertMany(docs) {
          for (const d of docs) await db.collection(col).insertOne(d);
          return {acknowledged: true, insertedCount: docs.length};
        },
        async replaceOne(filtro, d) {
          const anterior = [...tabelas[col].values()].find(x => corresponde(x, filtro));
          if (!anterior) return {matchedCount: 0, modifiedCount: 0};
          tabelas[col].set(d._id.toHexString(), clone(d)); db.escritas++;
          return {matchedCount: 1, modifiedCount: 1};
        },
      };
    },
  };
  db.session = {async withTransaction(fn) {
    const antes = Object.fromEntries(Object.entries(tabelas).map(([c, m]) => [c, new Map([...m].map(([k, d]) => [k, clone(d)]))]));
    try { await fn(); }
    catch (e) { for (const c of Object.keys(tabelas)) { tabelas[c].clear(); for (const [k, d] of antes[c]) tabelas[c].set(k, d); } throw e; }
  }};
  return db;
}

const c = require('../seed/lib-complemento-bd6.cjs');
(async () => {
  const p = c.carregar(), testes = [];
  const novo = () => {
    const db = bancoMemoria(p.base);
    for (const [col, docs] of Object.entries(p.base.dados)) for (const d of docs) db.tabelas[col].set(d._id.$oid, l.bson(d));
    // Qualquer tentativa de substituir um preexistente deve falhar no teste.
    const collection = db.collection.bind(db);
    db.collection = col => ({...collection(col), replaceOne: async () => {throw new Error('replace proibido');}});
    return db;
  };
  const db = novo(), indices = await l.configuracao(db, p.base);
  const antes = l.assinatura(Object.fromEntries(Object.entries(db.tabelas).map(([col, m]) => [col, [...m.values()]])));
  const pre = await c.preConferir(db, p, indices);
  assert.equal(pre.novos, 7); assert.equal(db.escritas, 0);
  testes.push('pre-conferencia somente leitura e 185 pais identicos');
  await assert.rejects(() => c.validar(db, p, indices), e => e.codigoSeguro === 'complemento_ausente');
  const r = await c.inserir(db, p, indices, db.session);
  assert.equal(r.inseridos, 7); assert.equal(db.escritas, 7);
  assert.equal((await c.validar(db, p, indices)).presentes, 7);
  const repetida = await c.inserir(db, p, indices, db.session);
  assert.equal(repetida.inseridos, 0); assert.equal(repetida.escritaExecutada, false); assert.equal(db.escritas, 7);
  for (const [col, docs] of Object.entries(p.base.dados)) for (const d of docs) assert(l.igual(db.tabelas[col].get(d._id.$oid), l.bson(d)));
  testes.push('insercao atomica sete, validacao posterior e repeticao sem escritas');
  const parcial = novo(), e = p.dados.experiencias_comunidade[0];
  parcial.tabelas.experiencias_comunidade.set(e._id.$oid, l.bson(e));
  await assert.rejects(() => c.preConferir(parcial, p, indices), x => x.codigoSeguro === 'complemento_parcial_preservado_requer_analise');
  assert.equal(parcial.escritas, 0);
  testes.push('lote parcial interrompe sem completar ou sobrescrever automaticamente');
  const divergente = novo();
  divergente.tabelas.usuarios.delete(p.base.dados.usuarios[0]._id.$oid);
  await assert.rejects(() => c.preConferir(divergente, p, indices), x => x.codigoSeguro === 'principal_ausente_ou_divergente_preservado');
  testes.push('referencia do principal ausente bloqueia');
  const alterado = novo(), doc = l.bson(e); doc.relato = 'Alteracao preexistente preservada';
  alterado.tabelas.experiencias_comunidade.set(e._id.$oid, doc);
  await assert.rejects(() => c.preConferir(alterado, p, indices), x => x.codigoSeguro === 'documento_existente_divergente_preservado');
  assert.equal(alterado.tabelas.experiencias_comunidade.get(e._id.$oid).relato, doc.relato);
  testes.push('complemento preexistente divergente preservado');
  const falha = novo(); falha.falharNaInsercao = 5;
  await assert.rejects(() => c.inserir(falha, p, indices, falha.session), x => x.code === 121);
  assert.equal(l.assinatura(Object.fromEntries(Object.entries(falha.tabelas).map(([col, m]) => [col, [...m.values()]]))), antes);
  testes.push('falha inesperada propagada e rollback simulado');
  const d = JSON.parse(JSON.stringify(p.dados));
  d.denuncias_comunidade[2].criadoEm = {$date: '2026-10-01T12:00:00.000Z'};
  assert.throws(() => c.conferirLocal(p.base, d, p.manifesto));
  testes.push('cronologia impossivel rejeitada localmente');
  const ind = novo(); ind.indices.experiencias_comunidade[1].key = {publicadoEm: 1, _id: -1};
  await assert.rejects(() => l.configuracao(ind, p.base), x => x.codigoSeguro === 'indice_ausente_ou_divergente');
  testes.push('configuracao de indice divergente bloqueia');
  console.log(JSON.stringify({somenteLocal: true, gruposAprovados: testes.length, falhas: 0, testes,
    limite: 'Mocks nao comprovam transacao, permissoes ou Schema Validation no servidor. Nenhuma rede utilizada.'}, null, 2));
})().catch(() => { console.error(JSON.stringify({aprovado: false, codigo: 'falha_teste_local_complemento'})); process.exitCode = 1; });
