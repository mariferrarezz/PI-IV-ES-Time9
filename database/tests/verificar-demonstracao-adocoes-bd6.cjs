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

const demo = require('../seed/adocoes-demonstracao-bd6/lib.cjs');
const comunidade = require('../seed/lib-complemento-bd6.cjs');
(async () => {
 const p = demo.carregar(), testes = [];
 function novo() {
  const db = bancoMemoria(p.base); db.databaseName = 'sentinela';
  for (const [col, ds] of Object.entries(p.c.combinado.dados)) for (const d of ds) db.tabelas[col].set(d._id.$oid, l.bson(d));
  return db;
 }
 const db = novo(), indices = await l.configuracao(db,p.base);
 const antes = l.assinatura(Object.fromEntries(Object.entries(db.tabelas).map(([c,m])=>[c,[...m.values()]])));
 assert.equal(p.dados.problemas_agricolas.length,0); assert.equal(Object.values(p.dados).flat().length,8);
 testes.push('8 documentos, mesma ficha existente, estado anterior integral, schemas e cronologia');
 const pre = await demo.preConferir(db,p,indices); assert.equal(pre.novos,8);assert.equal(pre.fichasPendentesInativas,40);assert.equal(db.escritas,0);
 testes.push('pre-conferencia somente leitura exige os 192 registros anteriores');
 const r = await demo.aplicar(db,p,indices,db.session); assert.equal(r.inseridos,8);assert.equal(r.fichaExistenteAlterada,1);assert.equal(db.escritas,9);
 const depois = await demo.validar(db,p,indices);assert.equal(depois.totalDocumentosDosLotes,200);assert.equal(depois.fichasPendentesInativas,39);
 testes.push('uma alteracao explicita e oito insercoes atomicas; sem duplicar ficha');
 assert.equal((await l.validar(db,p.base)).estadoEditorialDemonstracao,'aprovacao_simulada_exata');
 assert.equal((await l.validar(db,p.base)).aprovado,true);assert.equal((await comunidade.validar(db,p.c,indices)).aprovado,true);
 const repetida = await demo.aplicar(db,p,indices,db.session);assert.equal(repetida.inseridos,0);assert.equal(repetida.fichaExistenteAlterada,0);assert.equal(db.escritas,9);
 testes.push('validadores dos lotes historicos aceitam somente excecao exata; repeticao sem escrita');
 for(const [col,ds] of Object.entries(p.c.combinado.dados))for(const d of ds){
  if(d._id.$oid!==p.alteracao.antes._id.$oid) assert(l.igual(db.tabelas[col].get(d._id.$oid),l.bson(d)));
 }
 testes.push('outros 191 documentos preservados integralmente');
 const parcial=novo();parcial.tabelas.problemas_agricolas.set(p.alteracao.depois._id.$oid,l.bson(p.alteracao.depois));
 await assert.rejects(()=>demo.preConferir(parcial,p,indices),e=>e.codigoSeguro==='demonstracao_parcial_preservada');assert.equal(parcial.escritas,0);
 testes.push('ficha alterada sem lote completo bloqueia e preserva');
 const alterado=novo();alterado.tabelas.problemas_agricolas.get(p.alteracao.antes._id.$oid).descricao='Edicao alheia';
 assert.equal((await l.validar(alterado,p.base)).aprovado,false);
 await assert.rejects(()=>demo.aplicar(alterado,p,indices,alterado.session));assert.equal(alterado.escritas,0);
 testes.push('terceiro estado da ficha nao e aceito nem sobrescrito');
 const falha=novo();falha.falharNaInsercao=3;
 await assert.rejects(()=>demo.aplicar(falha,p,indices,falha.session),e=>e.code===121);
 assert.equal(l.assinatura(Object.fromEntries(Object.entries(falha.tabelas).map(([c,m])=>[c,[...m.values()]]))),antes);
 testes.push('falha apos alteracao da ficha reverte ficha e insercoes em rollback simulado');
 const errado=novo();errado.databaseName='sentinela_testes_bd6';
 await assert.rejects(()=>demo.aplicar(errado,p,indices,errado.session),e=>e.codigoSeguro==='destino_desenvolvimento_obrigatorio');
 testes.push('destino diferente do desenvolvimento rejeitado');
 const origem=demo.carregar();origem.dados.adocoes_tratamento.find(d=>d.status==='realizada').tratamentoId=origem.manifesto.aliases.tratamento_a.id;
 assert.throws(()=>demo.conferirLocal(origem));
 const duplicada=demo.carregar();duplicada.dados.adocoes_tratamento.find(d=>d.status==='cancelada').status='planejada';
 assert.throws(()=>demo.conferirLocal(duplicada));
 testes.push('tratamento incorreto e segunda planejada rejeitados');
 console.log(JSON.stringify({somenteLocal:true,gruposAprovados:testes.length,falhas:0,testes,conexaoAtlas:false,
  limite:'Mocks nao comprovam transacoes, permissoes, autoria ou revisao tecnica real.'},null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
