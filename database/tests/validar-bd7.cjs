'use strict';
// Local por padrão. Leitura/CRUD remotos exigem opções explícitas; nunca reaplica cargas.
// Usa o driver Node instalado no backend, sem alterar a API ou sua configuração.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {createRequire} = require('node:module');
const backend = createRequire(path.resolve(__dirname, '../../backend/package.json'));
const {MongoClient, ObjectId} = backend('mongoose').mongo;
const base = require('../seed/lib-bd6.cjs');
const demo = require('../seed/adocoes-demonstracao-bd6/lib.cjs');
const {relatorio} = require('../seed/diagnostico-bd6.cjs');
const raiz = path.resolve(__dirname, '../..');
const ler = nome => fs.readFileSync(path.join(raiz, nome), 'utf8');
const oid = d => d._id.$oid;
const campo = (d, k) => k.split('.').reduce((v, s) => v?.[s], d);
function corresponde(doc, filtro) {
  return Object.entries(filtro).every(([k, v]) => {
    const atual = campo(doc, k);
    if (v && typeof v === 'object' && !v.$oid && !v.$date) {
      return Object.entries(v).every(([op, valor]) => {
        if (op === '$exists') return (atual !== undefined) === valor;
        if (op === '$in') return valor.some(x => base.igual(base.bson(x), base.bson(atual)));
        if (op === '$gte') return Date.parse(atual?.$date) >= Date.parse(valor.$date);
        if (op === '$lt') return Date.parse(atual?.$date) < Date.parse(valor.$date);
        throw new Error('operador_local_nao_previsto');
      });
    }
    return (Array.isArray(atual) ? atual : [atual]).some(x => base.igual(base.bson(x), base.bson(v)));
  });
}
function plano() {
  const p = demo.carregar(); // Apenas leitura local; inclui verificações dos três lotes.
  const dados = structuredClone(p.combinado.dados);
  dados.problemas_agricolas = dados.problemas_agricolas.map(d => oid(d) === oid(p.alteracao.depois) ? p.alteracao.depois : d);
  const porId = new Map(Object.entries(dados).flatMap(([col, ds]) => ds.map(doc => [oid(doc), {col, doc}])));
  assert.equal(porId.size, 200);
  for (const [col, ds] of Object.entries(dados)) for (const d of ds) {
    assert.deepEqual(base.errosSchema(d, p.base.configs[col].validator.$jsonSchema), [], col);
    function refs(v) {
      if (!v || typeof v !== 'object') return;
      for (const [k, valor] of Object.entries(v)) {
        if (base.referencias[k]) for (const ref of Array.isArray(valor) ? valor : [valor]) {
          assert.equal(porId.get(ref.$oid)?.col, base.referencias[k], 'referencia_local');
        }
        refs(valor);
      }
    }
    refs(d);
    if (col === 'alertas') assert.equal(porId.get(d.contexto.id.$oid)?.col, 'ocorrencias');
  }
  for (const i of p.base.indices.filter(i => i.opcoes.unique)) {
    const vistos = new Set();
    for (const d of dados[i.colecao].filter(d => corresponde(d, i.opcoes.partialFilterExpression || {}))) {
      const chave = base.assinatura(Object.keys(i.key).map(k => base.bson(campo(d, k))));
      assert(!vistos.has(chave), 'unicidade_local'); vistos.add(chave);
    }
  }
  return {p, dados, porId};
}
function documentacao(p) {
  const bd3 = ler('docs/modelagem-mongodb.md');
  const cfg = p.base.configs;
  const t = ler('database/validators/configurar-validadores.mongodb.js');
  const ini = t.indexOf('const configuracoes = '), fim = t.indexOf('\n};', ini);
  const consolidados = vm.runInNewContext('(' + t.slice(ini + 22, fim + 2) + ')', {}, {timeout: 1000});
  const tipos = {String: 'string', ObjectId: 'objectId', Date: 'date', Boolean: 'bool', Object: 'object', Array: 'array'};
  const tabelas = [];
  for (const secao of bd3.split(/^### /m)) {
    const nome = secao.match(/^(?:5|10)\.\d+ ([a-z_]+)\s*\r?\n/)?.[1];
    if (!cfg[nome]) continue;
    const s = cfg[nome].validator.$jsonSchema;
    const linhas = secao.split(/\r?\n/).filter(l => /^\| [a-zA-Z_][\w.]* \|/.test(l) && !l.startsWith('| Campo |'));
    const principais = linhas.filter(l => !l.split('|')[1].includes('.'));
    // Somente a tabela principal: objetos aninhados são cobertos pelo schema completo e massa.
    const campos = principais.map(l => l.split('|')[1].trim()).filter(k => k in s.properties);
    for (const k of Object.keys(s.properties)) assert(campos.includes(k), nome + ':campo_sem_tabela:' + k);
    for (const linha of principais) {
      const [, k0, tipo0, obrigatorio] = linha.split('|');
      const k = k0.trim(); if (!(k in s.properties)) continue;
      const tipo = Object.keys(tipos).find(x => tipo0.trim().startsWith(x));
      if (tipo) assert([].concat(s.properties[k].bsonType).includes(tipos[tipo]), nome + ':tipo:' + k);
      if (obrigatorio?.trim() === 'S') assert(s.required.includes(k), nome + ':obrigatorio:' + k);
    }
    assert(base.igual(cfg[nome], consolidados[nome]), nome + ':consolidado_divergente');
    tabelas.push(nome);
  }
  assert.equal(new Set(tabelas).size, 15);
  const bd4 = ler('docs/regras-validacoes-indices.md');
  const trechos = [bd4.split('### 8.1 ')[1].split('### 8.2 ')[0], bd4.split('### 14.6 ')[1]];
  const esperados = [];
  for (const linha of trechos.join('\n').split(/\r?\n/)) {
    const partes = linha.split('|'), col = partes[1]?.trim();
    if (!cfg[col] || /adiar no MVP inicial/.test(linha)) continue;
    const literal = partes[2]?.match(/`(\{.*?\})`/)?.[1]; if (!literal) continue;
    const key = vm.runInNewContext('(' + literal + ')', {}, {timeout: 500});
    const unique = /unique: true/.test(linha) || /único/.test(partes[3]);
    let parcial = linha.match(/partialFilterExpression:\s*(\{[^}]*\})/)?.[1];
    if (col === 'experiencias_comunidade' && partes[3].trim().startsWith('P;')) parcial = '{"moderacao.status":"aprovada"}';
    const partial = parcial ? vm.runInNewContext('(' + parcial + ')', {}, {timeout: 500}) : {};
    esperados.push({col, key, unique, partial});
  }
  assert.equal(esperados.length, 22);
  for (const e of esperados) assert(p.base.indices.some(i => i.colecao === e.col &&
    base.igual(Object.entries(i.key), Object.entries(e.key)) && !!i.opcoes.unique === e.unique &&
    base.igual(i.opcoes.partialFilterExpression || {}, e.partial)), 'indice_bd4_divergente');
  return {colecoesBD3: tabelas.length, schemasIguais: 15, indicesBD4: 22, unicos: 4,
    limite: 'Tabelas principais: nomes, tipos explícitos e obrigatórios S; condições internas são conferidas pelo schema completo, testes existentes e revisão documental.'};
}
function casosSchema({p, dados}) {
  const casos = [];
  for (const [col, ds] of Object.entries(dados)) {
    const schema = p.base.configs[col].validator.$jsonSchema, valido = ds[0];
    assert(valido, 'colecao_sem_exemplo');
    assert.deepEqual(base.errosSchema(valido, schema), []);
    const obrigatorio = schema.required.find(k => k !== '_id');
    const ausente = structuredClone(valido); delete ausente[obrigatorio];
    const tipo = {...structuredClone(valido), _id: 'tipo-incorreto'};
    const extra = {...structuredClone(valido), campoNaoPermitidoBD7: true};
    for (const [nome, d] of [['obrigatorio_ausente', ausente], ['tipo_incorreto', tipo], ['campo_adicional', extra]]) {
      assert(base.errosSchema(d, schema).length > 0, col + ':' + nome);
    }
    casos.push({colecao: col, valido: true, obrigatorioAusenteRejeitado: true, tipoIncorretoRejeitado: true, campoAdicionalRejeitado: true});
  }
  return casos;
}
function consultas({dados, p}) {
  const a = p.manifesto.aliases;
  const usuario = dados.usuarios[0], propriedade = dados.propriedades.find(d => d.usuarioId.$oid === oid(usuario));
  const talhao = dados.talhoes.find(d => d.propriedadeId.$oid === oid(propriedade));
  const plantacao = dados.plantacoes.find(d => d.talhaoId.$oid === oid(talhao));
  const oc = dados.ocorrencias.find(d => oid(d) === a.ocorrencia_b.id.$oid);
  const tratamento = dados.tratamentos.find(d => oid(d) === a.tratamento_b.id.$oid);
  const exp = dados.experiencias_comunidade.find(d => oid(d) === a.experiencia.id.$oid);
  const recente = {criadoEm: -1, _id: -1}, obs = {dataObservacao: -1, _id: -1};
  const qs = [];
  const add = (nome, col, filtro, ordem) => qs.push({nome, col, filtro, ordem,
    esperados: dados[col].filter(d => corresponde(d, filtro)).map(oid)});
  add('Propriedades por produtor', 'propriedades', {usuarioId: usuario._id});
  add('Detalhe da propriedade', 'propriedades', {_id: propriedade._id});
  add('Talhões da propriedade', 'talhoes', {propriedadeId: propriedade._id});
  add('Plantações do talhão', 'plantacoes', {talhaoId: talhao._id});
  add('Plantações por safra e estado', 'plantacoes', {talhaoId: talhao._id, safra: plantacao.safra, status: plantacao.status});
  const cultura = exp.culturaId;
  add('Catálogo por cultura', 'problemas_agricolas', {culturasAfetadasIds: cultura, ativo: true, 'revisaoEditorial.status': 'aprovada'});
  add('Catálogo por cultura e tipo', 'problemas_agricolas', {culturasAfetadasIds: cultura, tipo: 'praga', ativo: true, 'revisaoEditorial.status': 'aprovada'});
  add('Ocorrências por plantação', 'ocorrencias', {plantacaoId: oc.plantacaoId}, obs);
  add('Ocorrências por problema', 'ocorrencias', {problemaAgricolaId: oc.problemaAgricolaId}, obs);
  add('Ocorrências por período', 'ocorrencias', {plantacaoId: oc.plantacaoId, dataObservacao: {$gte: {$date: '2026-11-01T00:00:00Z'}, $lt: {$date: '2026-12-01T00:00:00Z'}}}, obs);
  for (const status of ['aberta', 'em_acompanhamento', 'encerrada']) add('Ocorrências estado ' + status, 'ocorrencias', {status}, obs);
  for (const intensidade of ['baixa', 'media', 'alta']) add('Ocorrências intensidade ' + intensidade, 'ocorrencias', {intensidade}, obs);
  add('Monitoramentos da plantação', 'monitoramentos', {plantacaoId: oc.plantacaoId}, obs);
  const inspecao = dados.monitoramentos.find(d => !d.ocorrenciaId);
  add('Inspeção sem ocorrência', 'monitoramentos', {plantacaoId: inspecao.plantacaoId, ocorrenciaId: {$exists: false}}, obs);
  const monitoramento = dados.monitoramentos.find(d => d.ocorrenciaId);
  add('Monitoramentos por ocorrência', 'monitoramentos', {ocorrenciaId: monitoramento.ocorrenciaId}, obs);
  add('Tratamentos por ocorrência', 'tratamentos', {ocorrenciaId: tratamento.ocorrenciaId}, {dataAplicacao: -1, _id: -1});
  add('Avaliações por tratamento', 'avaliacoes_tratamento', {tratamentoId: dados.avaliacoes_tratamento[0].tratamentoId}, {dataAvaliacao: -1, _id: -1});
  add('Alertas não lidos', 'alertas', {usuarioId: dados.alertas[0].usuarioId, lidoEm: {$exists: false}}, recente);
  for (const status of ['pendente', 'aprovada', 'rejeitada', 'oculta', 'retirada']) add('Moderação ' + status, 'experiencias_comunidade', {'moderacao.status': status}, {criadoEm: 1, _id: 1});
  add('Feed por cultura e problema', 'experiencias_comunidade', {'moderacao.status': 'aprovada', culturaId: cultura, problemaAgricolaId: oc.problemaAgricolaId}, {publicadoEm: -1, _id: -1});
  for (const status of ['planejada', 'realizada', 'cancelada']) add('Adoção ' + status, 'adocoes_tratamento', {usuarioId: oc.registradoPor, status}, recente);
  add('Planejada por par', 'adocoes_tratamento', {experienciaId: exp._id, ocorrenciaId: oc._id, status: 'planejada'});
  for (const status of ['pendente', 'analisada']) add('Denúncias ' + status, 'denuncias_comunidade', {status}, {criadoEm: 1, _id: 1});
  return qs;
}
function resumoExplain(e) {
  const indices = new Set(), estagios = new Set();
  function visitar(v) {
    if (!v || typeof v !== 'object') return;
    if (typeof v.stage === 'string') estagios.add(v.stage);
    if (typeof v.indexName === 'string') indices.add(v.indexName);
    for (const [k, x] of Object.entries(v)) if (!['rejectedPlans', 'allPlansExecution'].includes(k)) visitar(x);
  }
  visitar(e.queryPlanner?.winningPlan); visitar(e.executionStats?.executionStages);
  return {indices: [...indices], estagios: [...estagios], retornados: e.executionStats?.nReturned ?? null,
    chavesExaminadas: e.executionStats?.totalKeysExamined ?? null, documentosExaminados: e.executionStats?.totalDocsExamined ?? null,
    ordenacaoEmMemoria: estagios.has('SORT'), collscan: estagios.has('COLLSCAN')};
}
async function auditarExistentes(db, p) {
  const linhas = [], referencias = [];
  for (const [col, cfg] of Object.entries(p.base.configs)) {
    const total = await db.collection(col).countDocuments({});
    const invalidos = await db.collection(col).countDocuments({$nor: [cfg.validator]});
    const idsInvalidos = invalidos ? (await db.collection(col).find({$nor: [cfg.validator]}, {projection: {_id: 1}}).limit(5).toArray()).map(d => String(d._id)) : [];
    const projecao = {_id: 1};
    function caminhos(schema, prefixo = '') {
      for (const [k, s] of Object.entries(schema.properties || {})) {
        const caminho = prefixo + k;
        if (base.referencias[k]) projecao[caminho] = 1;
        else caminhos(s.items || s, caminho + '.');
      }
    }
    caminhos(cfg.validator.$jsonSchema);
    if (col === 'alertas') projecao['contexto.id'] = 1;
    for (const doc of await db.collection(col).find({}, {projection: projecao}).toArray()) {
      function refs(v) {
        if (!v || typeof v !== 'object') return;
        for (const [k, valor] of Object.entries(v)) {
          if (base.referencias[k]) for (const ref of Array.isArray(valor) ? valor : [valor]) {
            if (ref?._bsontype === 'ObjectId') referencias.push({col, origem: String(doc._id), destino: base.referencias[k], id: ref});
          }
          refs(valor);
        }
      }
      refs(doc);
      if (col === 'alertas' && doc.contexto?.id?._bsontype === 'ObjectId') referencias.push({col, origem: String(doc._id), destino: 'ocorrencias', id: doc.contexto.id});
    }
    linhas.push({colecao: col, totalGlobal: total, invalidos, idsInvalidos, idsTruncados: invalidos > 5});
  }
  const faltantes = [];
  for (const destino of Object.keys(p.base.configs)) {
    const refs = referencias.filter(r => r.destino === destino);
    if (!refs.length) continue;
    const existentes = new Set((await db.collection(destino).find({_id: {$in: refs.map(r => r.id)}}, {projection: {_id: 1}}).toArray()).map(d => String(d._id)));
    for (const r of refs) if (!existentes.has(String(r.id))) faltantes.push({colecao: r.col, id: r.origem, destino, idAusente: String(r.id)});
  }
  const colecoes = (await db.listCollections({}, {nameOnly: true}).toArray()).map(c => c.name);
  return {aprovado: linhas.every(l => !l.invalidos) && !faltantes.length, colecoes: linhas,
    colecoesAdicionais: colecoes.filter(c => !p.base.configs[c]), referenciasAusentes: faltantes.slice(0, 50),
    totalReferenciasAusentes: faltantes.length, limite: 'Leituras não são snapshot único. Referências consultadas não equivalem a foreign keys; regras de domínio são verificadas para os 200 snapshots BD6.'};
}
async function leituras(db, planoAtual) {
  const indices = await base.configuracao(db, planoAtual.p.base);
  const existentes = await auditarExistentes(db, planoAtual.p);
  if (!existentes.aprovado) {
    const e = new Error('documentos_ou_referencias_divergentes'); e.codigoSeguro = 'documentos_ou_referencias_divergentes';
    e.auditoriaSegura = existentes; throw e;
  }
  const massa = await demo.validar(db, planoAtual.p, indices);
  const resultados = [];
  for (const q of consultas(planoAtual)) {
    const filtro = base.bson(q.filtro), col = db.collection(q.col);
    // Conferência dos IDs BD6 separada do explain natural, sem forçar o plano por _id.
    const encontrados = await col.find({$and: [filtro, {_id: {$in: planoAtual.dados[q.col].map(d => base.bson(d._id))}}]}, {projection: {_id: 1}}).toArray();
    if (!base.igual(encontrados.map(d => d._id.toHexString()).sort(), [...q.esperados].sort())) {
      const e = new Error('filtro_bd7_divergente'); e.codigoSeguro = 'filtro_bd7_divergente'; e.consultaSegura = q.nome; throw e;
    }
    let cursor = col.find(filtro, {projection: {_id: 1}});
    if (q.ordem) cursor = cursor.sort(q.ordem);
    const r = resumoExplain(await cursor.limit(20).explain('executionStats'));
    resultados.push({consulta: q.nome, colecao: q.col, correspondenciasBD6: encontrados.length, ...r,
      limite: !r.retornados ? 'Sem resultados; não comprova custo com correspondências.' : 'Massa pequena; projeção mínima e limite 20, sem garantia de desempenho.'});
  }
  return {aprovado: true, existentes, massa, consultas: resultados};
}
async function crud(db, usuarioId, aoReservar = () => {}) {
  const col = db.collection('propriedades'), rodada = new ObjectId().toHexString();
  const candidatos = [], testes = [];
  const novo = async () => {
    const _id = new ObjectId();
    assert.equal(await col.countDocuments({_id}), 0);
    candidatos.push(_id);
    aoReservar({evento: 'id_temporario_reservado', colecao: 'propriedades', rodada, id: _id.toHexString()});
    return {_id, usuarioId, nome: 'TEMP BD7 ' + rodada, municipio: 'Município de teste', estado: 'SP',
      ativa: true, criadoEm: new Date(), atualizadoEm: new Date()};
  };
  async function rejeita(nome, operacao, codigo) {
    let obtido;
    try { await operacao(); } catch (e) { obtido = e.code; if (obtido !== codigo) throw e; }
    assert.equal(obtido, codigo, 'rejeicao_esperada_nao_ocorreu');
    testes.push({teste: nome, esperado: codigo, obtido, aprovado: true});
  }
  let falha;
  try {
    assert(await db.collection('usuarios').findOne({_id: usuarioId}, {projection: {_id: 1}}));
    const original = await novo();
    assert((await col.insertOne(original)).acknowledged);
    assert(base.igual(await col.findOne({_id: original._id}), original));
    testes.push({teste: 'Inserção e leitura válidas', aprovado: true});
    const alteracao = {observacoes: 'Atualização temporária BD7 ' + rodada, atualizadoEm: new Date()};
    const u = await col.updateOne({_id: original._id}, {$set: alteracao});
    assert.equal(u.matchedCount, 1); assert.equal(u.modifiedCount, 1);
    const preservado = await col.findOne({_id: original._id});
    assert.equal(preservado.observacoes, alteracao.observacoes);
    testes.push({teste: 'Atualização válida e leitura posterior', matchedCount: 1, modifiedCount: 1, aprovado: true});
    await rejeita('Atualização inválida', () => col.updateOne({_id: original._id}, {$set: {estado: 'XX'}}), 121);
    assert(base.igual(await col.findOne({_id: original._id}), preservado));
    testes.push({teste: 'Original preservado após rejeição', aprovado: true});
    await rejeita('Duplicidade do _id temporário', () => col.insertOne({...original}), 11000);
    for (const [nome, mudar] of [
      ['Obrigatório ausente', d => { delete d.nome; }],
      ['Tipo incorreto', d => { d.usuarioId = usuarioId.toHexString(); }],
      ['Enum inválido', d => { d.estado = 'XX'; }],
      ['Área não positiva', d => { d.areaTotalHa = 0; }],
      ['Campo adicional', d => { d.campoNaoPermitido = true; }],
    ]) {
      const d = await novo(); mudar(d);
      await rejeita(nome, () => col.insertOne(d), 121);
      assert.equal(await col.countDocuments({_id: d._id}), 0);
    }
    const semReferencia = await novo(); semReferencia.usuarioId = new ObjectId();
    assert.equal(await db.collection('usuarios').countDocuments({_id: semReferencia.usuarioId}), 0);
    assert((await col.insertOne(semReferencia)).acknowledged);
    assert.equal(await db.collection('usuarios').countDocuments({_id: semReferencia.usuarioId}), 0);
    testes.push({teste: 'ObjectId sem pai', schemaAceitou: true, referenciaAusenteIdentificadaPorConsulta: true,
      aprovado: true, limite: 'MongoDB não garante existência do pai; caso temporário removido na limpeza.'});
    assert.equal((await col.deleteOne({_id: original._id})).deletedCount, 1);
    assert.equal(await col.countDocuments({_id: original._id}), 0);
    testes.push({teste: 'Exclusão apenas do temporário criado', aprovado: true});
  } catch (e) { e.testesTemporarios = testes; falha = e; }
  finally {
    // Lista fechada de IDs novos e conferidos ausentes nesta execução; nunca filtrar por prefixo.
    try {
      if (candidatos.length) await col.deleteMany({_id: {$in: candidatos}});
      assert.equal(await col.countDocuments({_id: {$in: candidatos}}), 0);
    } catch {
      const e = new Error('limpeza_temporarios_pendente'); e.codigoSeguro = 'limpeza_temporarios_pendente';
      e.idsTemporarios = candidatos.map(id => id.toHexString()); e.testesTemporarios = testes; throw e;
    }
  }
  if (falha) throw falha;
  return {aprovado: true, rodada, testes, temporariosRestantes: 0,
    limite: 'Driver Node, sem API/Flutter; exclusão de pais preexistentes ou com dependentes não testada.'};
}
async function executar(args = process.argv.slice(2)) {
  const modo = args[0] || '--local';
  assert(['--local', '--leitura', '--crud'].includes(modo) &&
    (args.length <= 1 || modo === '--crud' && args.length === 2 && args[1] === '--autorizar-temporarios'), 'argumentos_invalidos');
  if (modo === '--crud') assert(args[1] === '--autorizar-temporarios', 'autorizacao_temporarios_ausente');
  let cliente, etapa = 'conferencia_local';
  try {
    const planoAtual = plano(), docs = documentacao(planoAtual.p), casos = casosSchema(planoAtual);
    const qs = consultas(planoAtual);
    if (modo === '--local') {
      console.log(JSON.stringify({aprovado: true, somenteLocal: true, ...docs, documentos: 200, casosSchema: casos,
        consultasPreparadas: qs.length, correspondenciasLocais: qs.map(q => ({consulta: q.nome, quantidade: q.esperados.length})),
        planosMongoDB: 'Não executados; testes locais não são executionStats.', conexaoAtlas: false}, null, 2)); return;
    }
    etapa = 'carregar_ambiente';
    const env = process.env.MONGODB_URI ? process.env : backend('dotenv').parse(fs.readFileSync(path.join(raiz, 'backend/.env')));
    assert(env.MONGODB_URI, 'uri_ausente');
    cliente = new MongoClient(env.MONGODB_URI, {serverSelectionTimeoutMS: 10000, retryWrites: false});
    etapa = 'conectar'; await cliente.connect();
    const db = cliente.db('sentinela');
    etapa = 'validar_massa_e_consultas'; const leitura = await leituras(db, planoAtual);
    let temporarios;
    if (modo === '--crud') {
      etapa = 'crud_temporario'; temporarios = await crud(db, base.bson(planoAtual.dados.usuarios[0]._id), r => console.log(JSON.stringify(r)));
      etapa = 'reconferir_200';
      await demo.validar(db, planoAtual.p, await base.configuracao(db, planoAtual.p.base));
    }
    console.log(JSON.stringify({banco: 'sentinela', modo, somenteLeitura: modo === '--leitura', leitura, temporarios,
      limite: 'Não comprova autorização, transições, revisão agronômica, desempenho em escala ou aceite da equipe.'}, null, 2));
  } catch (e) {
    console.error(JSON.stringify({...relatorio(e, {etapa, modo}), consulta: e.consultaSegura, auditoria: e.auditoriaSegura,
      testesTemporariosParciais: e.testesTemporarios, idsTemporariosParaConferencia: e.idsTemporarios}, null, 2));
    process.exitCode = 1;
  } finally { if (cliente) try { await cliente.close(); } catch { process.exitCode = 1; console.error('{"codigo":"falha_fechar_conexao"}'); } }
}
if (require.main === module) executar();
module.exports = {plano, documentacao, casosSchema, consultas, corresponde, resumoExplain, crud, executar};
