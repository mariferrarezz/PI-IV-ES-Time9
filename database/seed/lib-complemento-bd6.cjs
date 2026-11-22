'use strict';
// Confere, insere e valida as quatro experiências e três denúncias do complemento.
// Importar este módulo não conecta ao MongoDB nem carrega credenciais.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {confereHashTexto} = require('./integridade-texto-bd6.cjs');
const {createRequire} = require('node:module');
const lib = require('./lib-bd6.cjs');
const raiz = __dirname;
const backend = createRequire(path.join(raiz, '../../backend/package.json'));
const ler = nome => JSON.parse(fs.readFileSync(path.join(raiz, nome), 'utf8'));
const oid = referencia => referencia.$oid;
const tempo = data => Date.parse(data.$date);

function falhar(codigo, detalhes = []) {
  const erro = new Error(codigo);
  erro.codigoSeguro = codigo;
  erro.detalhesSeguros = detalhes;
  throw erro;
}

function conferirPrincipalPreservado(base, manifesto) {
  for (const [arquivo, hashEsperado] of Object.entries(manifesto.arquivosPrincipaisPreservadosSha256)) {
    assert(confereHashTexto(fs.readFileSync(lib.arquivoSeed(arquivo)), hashEsperado), arquivo);
  }
  assert.equal(base.impressao, manifesto.estadoLotePrincipal.impressaoPacotePreConferido);
  assert.equal(base.porId.size, 185);
}

function adicionarDocumentosLocais(base, dados, documentosPorId) {
  for (const [col, documentos] of Object.entries(dados)) {
    for (const doc of documentos) {
      assert(!documentosPorId.has(oid(doc._id)), 'ID repetido');
      assert.deepEqual(lib.errosSchema(doc, base.configs[col].validator.$jsonSchema), [], col);
      documentosPorId.set(oid(doc._id), {col, doc});
    }
  }
}

function conferirReferencias(documento, documentosPorId) {
  if (!documento || typeof documento !== 'object') return;
  for (const [campo, valor] of Object.entries(documento)) {
    if (lib.referencias[campo]) {
      for (const referencia of Array.isArray(valor) ? valor : [valor]) {
        assert.equal(documentosPorId.get(oid(referencia))?.col, lib.referencias[campo], campo);
      }
    }
    conferirReferencias(valor, documentosPorId);
  }
}

function conferirExperiencia(experiencia, obter) {
  const ocorrencia = obter(experiencia.ocorrenciaOrigemId);
  const plantacao = obter(ocorrencia.plantacaoId);
  const propriedade = obter(obter(plantacao.talhaoId).propriedadeId);
  const tratamento = obter(experiencia.tratamentoOrigemId);
  assert.equal(oid(propriedade.usuarioId), oid(experiencia.autorId));
  assert.equal(oid(plantacao.culturaId), oid(experiencia.culturaId));
  assert.equal(obter(experiencia.culturaId).nome, experiencia.culturaNome);
  assert.equal(obter(experiencia.autorId).nomePublico, experiencia.nomePublico);
  assert.equal(ocorrencia.tipo, experiencia.tipoProblema);
  assert.equal(ocorrencia.status, experiencia.statusOcorrencia);
  assert.equal(oid(tratamento.ocorrenciaId), oid(ocorrencia._id));
  assert.deepEqual(experiencia.metodo, {tipoMedida: tratamento.tipoMedida, descricao: tratamento.descricao});
  assert(tempo(tratamento.dataAplicacao) <= tempo(experiencia.criadoEm));
  assert(tempo(experiencia.criadoEm) <= tempo(experiencia.atualizadoEm));
  if (experiencia.moderacao.revisadoEm) {
    assert(tempo(experiencia.criadoEm) <= tempo(experiencia.moderacao.revisadoEm) && tempo(experiencia.moderacao.revisadoEm) <= tempo(experiencia.atualizadoEm));
  }
  if (experiencia.publicadoEm) {
    assert(tempo(experiencia.criadoEm) <= tempo(experiencia.publicadoEm) && tempo(experiencia.publicadoEm) <= tempo(experiencia.atualizadoEm));
  }
  assert.equal(experiencia.tipoProblema, 'nao_identificado');
  assert(!('problemaAgricolaId' in experiencia));
}

function conferirDenuncia(denuncia, obter) {
  const experiencia = obter(denuncia.experienciaId);
  assert.notEqual(oid(experiencia.autorId), oid(denuncia.denuncianteId));
  assert(tempo(experiencia.publicadoEm) <= tempo(denuncia.criadoEm));
  assert(tempo(denuncia.criadoEm) <= tempo(denuncia.atualizadoEm));
  if (denuncia.status === 'analisada') {
    assert(tempo(denuncia.criadoEm) <= tempo(denuncia.analisadoEm));
    assert.equal(tempo(denuncia.analisadoEm), tempo(denuncia.atualizadoEm));
    if (denuncia.decisao === 'ocultar_publicacao') {
      assert.equal(experiencia.moderacao.status, 'oculta');
      assert(tempo(denuncia.criadoEm) < tempo(experiencia.moderacao.revisadoEm));
      assert.deepEqual(experiencia.moderacao.revisadoPor, denuncia.analisadoPor);
      assert.deepEqual(experiencia.moderacao.revisadoEm, denuncia.analisadoEm);
    } else {
      assert.equal(experiencia.moderacao.status, 'aprovada');
    }
  }
}

function conferirUnicidadeLocal(base, dados) {
  // Usa os filtros parciais reais, mas não substitui a restrição no servidor.
  const campo = (documento, caminho) => caminho.split('.').reduce((valor, parte) => valor?.[parte], documento);
  for (const indice of base.indices.filter(indice => indice.opcoes.unique)) {
    const vistos = new Set();
    for (const documento of [...(base.dados[indice.colecao] || []), ...(dados[indice.colecao] || [])]) {
      if (!lib.dentro(documento, indice.opcoes.partialFilterExpression)) continue;
      const chave = JSON.stringify(Object.keys(indice.key).map(nome => campo(documento, nome)));
      assert(!vistos.has(chave), indice.nome);
      vistos.add(chave);
    }
  }
}

function conferirLocal(base, dados, manifesto) {
  const documentosPorId = new Map(base.porId);
  conferirPrincipalPreservado(base, manifesto);
  assert.deepEqual(Object.fromEntries(Object.entries(dados).map(([col, documentos]) => [col, documentos.length])), {
    experiencias_comunidade: 4, adocoes_tratamento: 0, denuncias_comunidade: 3,
  });
  adicionarDocumentosLocais(base, dados, documentosPorId);
  assert.deepEqual(new Set(manifesto.documentos.map(documento => oid(documento.idReservado))),
    new Set(Object.values(dados).flat().map(documento => oid(documento._id))));

  const obter = referencia => documentosPorId.get(oid(referencia)).doc;
  for (const documento of Object.values(dados).flat()) conferirReferencias(documento, documentosPorId);
  for (const experiencia of dados.experiencias_comunidade) conferirExperiencia(experiencia, obter);
  for (const denuncia of dados.denuncias_comunidade) conferirDenuncia(denuncia, obter);
  conferirUnicidadeLocal(base, dados);
  // O bloqueio pertence ao manifesto histórico, anterior ao lote acadêmico de adoções.
  assert.equal(manifesto.adocoesBloqueadas.length, 3);
  assert(base.dados.problemas_agricolas.every(documento => !documento.ativo && documento.revisaoEditorial.status === 'pendente'));
}
function carregar() {
  const base = lib.carregar();
  const dados = ler('comunidade-complementar-bd6.json');
  const manifesto = ler('manifesto-comunidade-complementar-bd6.json');
  try {
    conferirLocal(base, dados, manifesto);
  } catch {
    falhar('complemento_local_incompativel');
  }
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
  // Aceita apenas lote inteiro ausente ou inteiro idêntico; não completa estados parciais.
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
    // Toda inserção depende da conferência dos pais e índices na mesma transação.
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
