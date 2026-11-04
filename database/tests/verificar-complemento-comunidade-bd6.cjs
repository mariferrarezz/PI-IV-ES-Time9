'use strict';
// Verificação exclusivamente local: não carrega .env, não conecta e não grava.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const lib = require('../seed/lib-bd6.cjs');
const raiz = path.join(__dirname, '../seed');
const ler = n => JSON.parse(fs.readFileSync(path.join(raiz, n), 'utf8'));
const dados = ler('comunidade-complementar-bd6.json');
const manifesto = ler('manifesto-comunidade-complementar-bd6.json');
const base = lib.carregar();
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
  if (e.moderacao.revisadoEm) assert(tempo(e.moderacao.revisadoEm) <= tempo(e.atualizadoEm));
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
console.log(JSON.stringify({aprovado: true, somenteLocal: true, principalPreservado: 185,
  complemento: 7, adocoesBloqueadas: 3, referencias: 'resolvidas no pacote local, nao no Atlas',
  schema: 'schemas completos atuais', unicidade: 'chaves e filtros parciais locais; nao e teste do servidor'}));
