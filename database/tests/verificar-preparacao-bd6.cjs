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
async function rejeitaCodigo(fn, codigo) { await assert.rejects(fn, e => e.codigoSeguro === codigo); }
(async () => {
  const p = l.carregar(), testes = [];
  assert.equal(p.porId.size, 185); assert.equal(p.dados.problemas_agricolas.length, 40);
  assert.equal(p.dados.culturas.length, 23); assert.equal(p.indices.length, 22);
  const acoes = l.plano(p, new Set());
  assert.ok(acoes.findIndex(a => a.col === 'culturas') < acoes.findIndex(a => a.col === 'usuarios'));
  const negra = p.dados.problemas_agricolas.find(d => d.codigoEditorial === 'podridao-negra-das-cruciferas');
  assert.equal(negra.formasControle.length, 1); assert.equal(negra.formasControle[0].tipo, 'cultural');
  testes.push('pacote, schemas completos, contagens e omissao explicita do controle incerto');

  const db = bancoMemoria(p), ind = await l.configuracao(db, p);
  const pre = await l.preConferir(db, p, ind);
  assert.equal(pre.presentes.size, 0); assert.equal(db.escritas, 0);
  assert.equal(db.indices.propriedades.at(-1).name, 'ownerUid_1');
  testes.push('pre-conferencia somente leitura e preservacao do indice adicional');

  const primeira = await l.inserir(db, p, ind, db.session);
  assert.equal(primeira.inseridos, 185); assert.equal(primeira.encerramentosSomenteDeNovos, 4);
  assert.equal(primeira.conferencia.aprovado, true);
  testes.push('primeira carga, ordem das referencias e dois ciclos historicos');
  const antes = db.escritas;
  const segunda = await l.inserir(db, p, ind, db.session);
  assert.equal(segunda.inseridos, 0); assert.equal(segunda.preexistentesPreservados, 185);
  assert.equal(segunda.encerramentosSomenteDeNovos, 0); assert.equal(db.escritas, antes);
  testes.push('repeticao sem insercoes, alteracoes ou reabertura de historicos');

  const alvo = p.dados.problemas_agricolas[0];
  db.tabelas.problemas_agricolas.get(alvo._id.$oid).descricao = 'Edicao posterior que deve ser preservada.';
  await rejeitaCodigo(() => l.inserir(db, p, ind, db.session), 'documento_existente_divergente_preservado');
  assert.equal(db.escritas, antes);
  assert.equal(db.tabelas.problemas_agricolas.get(alvo._id.$oid).descricao, 'Edicao posterior que deve ser preservada.');
  testes.push('documento preexistente divergente bloqueado e preservado');

  const colisao = bancoMemoria(p), fonte = clone(l.bson(p.dados.fontes_conhecimento[0]));
  fonte._id = new BSON.ObjectId('000000000000000000000001');
  colisao.tabelas.fontes_conhecimento.set(fonte._id.toHexString(), fonte);
  await rejeitaCodigo(() => l.preConferir(colisao, p, colisao.indices), 'possivel_equivalente_com_outro_id_resolver_mapa');
  assert.equal(colisao.escritas, 0);
  testes.push('possivel fonte equivalente com outro ID exige resolucao do mapa');

  const parcial = bancoMemoria(p), fam = l.familias(p)[0];
  parcial.tabelas.plantacoes.set(fam.pl._id.$oid, l.bson(fam.pl));
  await rejeitaCodigo(() => l.preConferir(parcial, p, parcial.indices), 'historico_parcial_requer_analise_sem_reabrir_pais');
  testes.push('historico parcial bloqueado sem reabrir pai encerrado');

  const indiceErrado = bancoMemoria(p);
  indiceErrado.indices.usuarios.find(i => i.name === 'uq_usuarios_firebaseUid').unique = false;
  await rejeitaCodigo(() => l.configuracao(indiceErrado, p), 'indice_ausente_ou_divergente');
  const ordemErrada = bancoMemoria(p), composto = ordemErrada.indices.plantacoes.find(i => Object.keys(i.key).length > 1);
  composto.key = Object.fromEntries(Object.entries(composto.key).reverse());
  await rejeitaCodigo(() => l.configuracao(ordemErrada, p), 'indice_ausente_ou_divergente');
  const schemaErrado = bancoMemoria(p), listar = schemaErrado.listCollections;
  schemaErrado.listCollections = () => ({toArray: async () => (await listar().toArray()).map((c, i) => i ? c : {...c, options: {...c.options, validationAction: 'warn'}})});
  await rejeitaCodigo(() => l.configuracao(schemaErrado, p), 'configuracao_divergente');
  const equivalente = bancoMemoria(p);
  equivalente.indices.usuarios.find(i => i.name === 'uq_usuarios_firebaseUid').name = 'nome_alternativo_mesma_definicao';
  await l.configuracao(equivalente, p);
  testes.push('divergencia de schema/configuracao, unique e ordem das chaves bloqueada');

  const falha = bancoMemoria(p); falha.falharNaInsercao = 12;
  await assert.rejects(() => l.inserir(falha, p, falha.indices, falha.session), e => e.code === 121);
  assert.equal(Object.values(falha.tabelas).reduce((n, m) => n + m.size, 0), 0);
  testes.push('falha de escrita propagada e rollback simulado');

  const semReferencia = l.carregar(), ref = semReferencia.dados.ocorrencias[0].plantacaoId;
  semReferencia.porId.delete(ref.$oid);
  assert.throws(() => l.conferirLocal(semReferencia));
  const incoerente = l.carregar(); incoerente.dados.avaliacoes_tratamento[0].dataAvaliacao = {$date: '2020-01-01T00:00:00.000Z'};
  assert.throws(() => l.conferirLocal(incoerente), e => e.codigoSeguro === 'data_avaliacao_divergente');
  testes.push('referencia ausente e data incoerente bloqueadas localmente');

  console.log(JSON.stringify({somenteMemoria: true, gruposAprovados: testes.length, falhas: 0, testes, limite: 'Mocks nao comprovam transacoes, permissoes, collation ou Schema Validation no servidor MongoDB.'}, null, 2));
})().catch(e => { console.error(e); process.exitCode = 1; });
