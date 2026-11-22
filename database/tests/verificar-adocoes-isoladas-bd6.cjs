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

const iso = require('../arquivo/isolado-adocoes-bd6/lib.cjs');
(async () => {
  const p = iso.carregar(), testes = [];
  assert.equal(Object.values(p.dados).flat().length, 22);
  assert.equal(p.dados.problemas_agricolas[0].codigoEditorial, 'lagarta-do-cartucho');
  testes.push('22 documentos, unica ficha das 40, schemas, simulacao, referencias e datas');
  function novo(configurado = true) {
    const db = bancoMemoria(p); db.databaseName = iso.BANCO;
    const presentes = new Set(configurado ? Object.keys(p.configs) : []);
    const collection = db.collection.bind(db);
    if (!configurado) for (const col of Object.keys(db.indices)) db.indices[col] = [];
    db.listCollections = () => ({toArray: async () => [...presentes].map(name => ({name, type: 'collection', options: {
      validator: p.configs[name].validator, validationLevel: 'strict', validationAction: 'error',
    }}))});
    db.createCollection = async (name, op) => {
      assert(!presentes.has(name)); assert(l.igual(op.validator, p.configs[name].validator));
      presentes.add(name); db.indices[name].push({name: '_id_', key: {_id: 1}, unique: true}); db.escritas++;
    };
    db.collection = col => ({...collection(col),
      aggregate: () => ({toArray: async () => db.duplicados && col === 'plantacoes' ? [{total: 2}] : []}),
      createIndex: async (key, op) => {db.indices[col].push({key, ...op}); db.escritas++; return op.name;},
      replaceOne: async () => {throw new Error('replace proibido');},
    });
    return db;
  }
  const vazio = novo(false), prev = await iso.configurar(vazio, p, false);
  assert.equal(prev.colecoesAusentes.length, 15); assert.equal(prev.indicesAusentes.length, 22); assert.equal(vazio.escritas, 0);
  await iso.configurar(vazio, p, true); assert.equal(vazio.escritas, 37);
  const repetida = await iso.configurar(vazio, p, true); assert.equal(repetida.escritaExecutada, false); assert.equal(vazio.escritas, 37);
  testes.push('configuracao planeja sem escrever, cria 15 e 22 e repete sem alterar');
  const db = novo(), indices = await l.configuracao(db, p);
  assert.equal((await iso.preConferir(db, p, indices)).novos, 22); assert.equal(db.escritas, 0);
  await assert.rejects(() => iso.validar(db, p, indices), e => e.codigoSeguro === 'massa_isolada_ausente');
  const r = await iso.inserir(db, p, indices, db.session);
  assert.equal(r.inseridos, 22); assert.equal((await iso.validar(db, p, indices)).presentes, 22);
  assert.equal((await iso.inserir(db, p, indices, db.session)).inseridos, 0); assert.equal(db.escritas, 22);
  testes.push('carga atomica, pais antes dos filhos, validacao e repeticao sem duplicacoes');
  const errado = novo(); errado.databaseName = 'sentinela';
  await assert.rejects(() => iso.configurar(errado, p, true), e => e.codigoSeguro === 'destino_isolado_obrigatorio');
  await assert.rejects(() => iso.inserir(errado, p, indices, errado.session), e => e.codigoSeguro === 'destino_isolado_obrigatorio');
  assert.equal(errado.escritas, 0); testes.push('destino sentinela rejeitado antes de qualquer escrita');
  const dup = novo(); dup.duplicados = true;
  await assert.rejects(() => iso.configurar(dup, p, true), e => e.codigoSeguro === 'duplicidade_isolada_preservada');
  assert.equal(dup.escritas, 0); testes.push('duplicidades bloqueiam configuracao sem exclusao');
  const parcial = novo(), u = p.dados.usuarios[0]; parcial.tabelas.usuarios.set(u._id.$oid, l.bson(u));
  await assert.rejects(() => iso.inserir(parcial, p, indices, parcial.session), e => e.codigoSeguro === 'massa_isolada_parcial_preservada');
  assert.equal(parcial.escritas, 0); testes.push('massa parcial preservada sem completar automaticamente');
  const divergente = novo(), alt = l.bson(u); alt.nomeCompleto = 'Mudanca preexistente'; divergente.tabelas.usuarios.set(u._id.$oid, alt);
  await assert.rejects(() => iso.preConferir(divergente, p, indices), e => e.codigoSeguro === 'documento_existente_divergente_preservado');
  assert.equal(divergente.tabelas.usuarios.get(u._id.$oid).nomeCompleto, alt.nomeCompleto);
  testes.push('preexistente divergente preservado');
  const f = novo(); f.falharNaInsercao = 21;
  await assert.rejects(() => iso.inserir(f, p, indices, f.session), e => e.code === 121);
  assert.equal(Object.values(f.tabelas).reduce((n, m) => n + m.size, 0), 0);
  testes.push('erro inesperado propagado e rollback simulado');
  const pf = iso.carregar(); pf.dados.adocoes_tratamento[1].tratamentoId = pf.dados.tratamentos[0]._id;
  assert.throws(() => iso.conferirLocal(pf, l.carregar()));
  const pn = iso.carregar(); pn.dados.adocoes_tratamento[2].status = 'planejada';
  assert.throws(() => iso.conferirLocal(pn, l.carregar()));
  testes.push('tratamento da origem e duplicidade planejada rejeitados localmente');
  const indexErrado = novo(); indexErrado.indices.adocoes_tratamento.find(i => i.unique && i.name !== '_id_').partialFilterExpression = {status: 'cancelada'};
  await assert.rejects(() => iso.configurar(indexErrado, p, true), e => e.codigoSeguro === 'indice_isolado_divergente_preservado');
  assert.equal(indexErrado.escritas, 0); testes.push('filtro parcial divergente nao e substituido');
  console.log(JSON.stringify({somenteLocal: true, bancoFuturo: iso.BANCO, documentos: 22, gruposAprovados: testes.length, falhas: 0, testes,
    limite: 'Somente mocks: nao comprova Atlas, permissoes, indices ou transacoes reais; nenhuma conexao.'}, null, 2));
})().catch(e => {console.error(e.stack); process.exitCode = 1;});
