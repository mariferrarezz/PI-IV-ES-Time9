'use strict';

// Carrega e confere o lote principal de 185 documentos; implementa sua inserção e validação.
// Importar este módulo não conecta ao MongoDB.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const {createRequire} = require('node:module');
const raiz = path.resolve(__dirname, '../..');
const backend = createRequire(path.join(raiz, 'backend/package.json'));
const {MongoClient, BSON} = backend('mongoose').mongo;
const {EJSON} = BSON;
const BANCO = 'sentinela';
const arquivos = ['manifesto-bd6.json', 'documentos-sinteticos-bd6.json', 'catalogo-pendente-bd6.json', 'pesquisa-catalogo-bd6.json'];
// Os manifestos preservam nomes históricos; resolver sem alterar bytes/hashes.
const arquivoSeed = nome => path.join(__dirname, ...(['pesquisa-catalogo-bd6.json', 'mapeamento-catalogo-bd6.json'].includes(nome) ? ['preparacao', nome] : [nome]));
const copiar = v => JSON.parse(JSON.stringify(v));
const hash = s => crypto.createHash('sha256').update(s).digest('hex');
function falhar(codigo, detalhes = []) {
  const e = new Error(codigo); e.codigoSeguro = codigo; e.detalhesSeguros = detalhes; throw e;
}
function normal(v) {
  if (Array.isArray(v)) return v.map(normal);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map(k => [k, normal(v[k])]));
  return v;
}
const assinatura = v => JSON.stringify(normal(EJSON.serialize(v, {relaxed: false})));
const igual = (a, b) => assinatura(a) === assinatura(b);
const bson = d => d === undefined ? undefined : EJSON.deserialize(copiar(d), {relaxed: false});
const id = d => d._id.$oid;
const numero = v => Number(typeof v === 'object' ? Object.values(v)[0] : v);
const dia = v => Date.parse(v.$date);

// Conferência local dos keywords efetivamente utilizados nos schemas atuais.
// O servidor ainda validará cada escrita; isto não substitui Schema Validation BSON.
function tipo(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'object') {
    if ('$oid' in v) return Object.keys(v).length === 1 && /^[a-f\d]{24}$/i.test(v.$oid) ? 'objectId' : 'invalido';
    if ('$date' in v) return Object.keys(v).length === 1 && typeof v.$date === 'string' && Number.isFinite(dia(v)) ? 'date' : 'invalido';
    for (const [k, t] of Object.entries({$numberInt: 'int', $numberLong: 'long', $numberDouble: 'double', $numberDecimal: 'decimal'})) {
      if (k in v) return Object.keys(v).length === 1 && Number.isFinite(Number(v[k])) ? t : 'invalido';
    }
    return 'object';
  }
  if (typeof v === 'number') return Number.isInteger(v) && v >= -2147483648 && v <= 2147483647 ? 'int' : 'double';
  return typeof v === 'boolean' ? 'bool' : typeof v;
}
function errosSchema(v, s, local = '$') {
  const erros = [], erro = regra => erros.push({local, regra}), t = tipo(v);
  if (s.bsonType && ![].concat(s.bsonType).includes(t)) erro('bsonType');
  if (s.enum && !s.enum.some(e => JSON.stringify(e) === JSON.stringify(v))) erro('enum');
  if (typeof v === 'string') {
    if (s.minLength !== undefined && [...v].length < s.minLength) erro('minLength');
    if (s.maxLength !== undefined && [...v].length > s.maxLength) erro('maxLength');
    if (s.pattern && !new RegExp(s.pattern).test(v)) erro('pattern');
  }
  if (['int', 'long', 'double', 'decimal'].includes(t)) {
    const n = numero(v);
    if (!Number.isFinite(n)) erro('finitude');
    if (s.minimum !== undefined && (s.exclusiveMinimum ? n <= s.minimum : n < s.minimum)) erro('minimum');
    if (s.maximum !== undefined && (s.exclusiveMaximum ? n >= s.maximum : n > s.maximum)) erro('maximum');
  }
  if (t === 'array') {
    if (s.minItems !== undefined && v.length < s.minItems) erro('minItems');
    if (s.maxItems !== undefined && v.length > s.maxItems) erro('maxItems');
    if (s.uniqueItems && new Set(v.map(x => JSON.stringify(x))).size !== v.length) erro('uniqueItems');
    if (s.items) v.forEach((x, i) => erros.push(...errosSchema(x, s.items, local + '[' + i + ']')));
  }
  if (t === 'object') {
    for (const k of s.required || []) if (!(k in v)) erro('required:' + k);
    if (s.minProperties !== undefined && Object.keys(v).length < s.minProperties) erro('minProperties');
    for (const k of Object.keys(v)) {
      if (s.properties && k in s.properties) erros.push(...errosSchema(v[k], s.properties[k], local + '.' + k));
      else if (s.additionalProperties === false) erro('additionalProperties:' + k);
    }
    for (const [k, deps] of Object.entries(s.dependencies || {})) if (k in v) {
      if (Array.isArray(deps)) { for (const dep of deps) if (!(dep in v)) erro('dependencies:' + k + ':' + dep); }
      else erros.push(...errosSchema(v, deps, local));
    }
  }
  if (s.allOf) for (const sub of s.allOf) erros.push(...errosSchema(v, sub, local));
  if (s.anyOf && !s.anyOf.some(sub => !errosSchema(v, sub).length)) erro('anyOf');
  if (s.oneOf && s.oneOf.filter(sub => !errosSchema(v, sub).length).length !== 1) erro('oneOf');
  if (s.not && !errosSchema(v, s.not).length) erro('not');
  return erros;
}
function conferirKeywords(s) {
  const permitidos = new Set(['bsonType', 'required', 'properties', 'additionalProperties', 'minProperties', 'minLength', 'maxLength', 'pattern', 'enum', 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'minItems', 'maxItems', 'uniqueItems', 'items', 'dependencies', 'oneOf', 'allOf', 'anyOf', 'not', 'description', 'title']);
  for (const k of Object.keys(s)) if (!permitidos.has(k)) falhar('keyword_schema_nao_suportado', [k]);
  for (const sub of Object.values(s.properties || {})) conferirKeywords(sub);
  if (s.items) conferirKeywords(s.items);
  for (const sub of Object.values(s.dependencies || {})) if (!Array.isArray(sub)) conferirKeywords(sub);
  for (const k of ['oneOf', 'allOf', 'anyOf']) for (const sub of s[k] || []) conferirKeywords(sub);
  if (s.not) conferirKeywords(s.not);
}
function carregar() {
  const textos = arquivos.map(n => fs.readFileSync(arquivoSeed(n), 'utf8'));
  const [manifesto, sinteticos, catalogo, pesquisa] = textos.map(t => JSON.parse(t));
  const original = fs.readFileSync(path.join(__dirname, 'catalogo-completo-sentinela.json'));
  if (hash(original) !== manifesto.originalEditorial.sha256) falhar('original_editorial_alterado');
  const codigosEditoriais = new Set(JSON.parse(original.toString('utf8')).map(d => d.codigoEditorial));
  const configs = {};
  for (const nome of Object.keys(sinteticos)) {
    const texto = fs.readFileSync(path.join(__dirname, '../validators/validar-' + nome + '.mongodb.js'), 'utf8');
    // Apenas o literal de configuração, nunca use() ou db.runCommand().
    const inicio = texto.indexOf('db.runCommand('), fim = texto.lastIndexOf(');');
    if (inicio < 0 || fim <= inicio) falhar('formato_validador_divergente', [nome]);
    configs[nome] = vm.runInNewContext('(' + texto.slice(inicio + 14, fim) + ')', {}, {timeout: 1000});
    conferirKeywords(configs[nome].validator.$jsonSchema);
  }
  const indiceTexto = fs.readFileSync(path.join(__dirname, '../indexes/configurar-indices.mongodb.js'), 'utf8');
  const ini = indiceTexto.indexOf('const indices = '), fim = indiceTexto.indexOf('\n];', ini);
  if (ini < 0 || fim < 0) falhar('formato_indices_divergente');
  const indices = vm.runInNewContext('(' + indiceTexto.slice(ini + 16, fim + 2) + ')', {}, {timeout: 1000});
  if (Object.keys(configs).length !== 15 || indices.length !== 22) falhar('quantidade_configuracoes_divergente');
  const dados = Object.fromEntries(Object.keys(configs).map(c => [c, []])), porId = new Map();
  for (const conjunto of [sinteticos, catalogo]) for (const [col, docs] of Object.entries(conjunto)) {
    if (!(col in dados)) falhar('colecao_nao_prevista', [col]);
    for (const doc of docs) {
      const anterior = porId.get(id(doc));
      if (anterior) { if (anterior.col !== col || !igual(bson(anterior.doc), bson(doc))) falhar('id_repetido_divergente', [col, id(doc)]); }
      else { porId.set(id(doc), {col, doc}); dados[col].push(doc); }
    }
  }
  const aliasesFontes = {};
  for (const reg of manifesto.documentos.filter(d => d.colecao === 'fontes_conhecimento')) {
    const primarias = pesquisa.fontes.filter(f => f.alias === reg.alias || reg.alias === 'fonte_55' && f.alias === 'fonte_66');
    const novas = pesquisa.resolucaoDaSegundaPesquisa.novasFontes.filter(f => f.alias === reg.alias);
    aliasesFontes[reg.idReservado.$oid] = [...new Set([...primarias.flatMap(f => [f.urlOriginal, ...f.urlsDeVerificacao]), ...novas.flatMap(f => [f.url, f.texto])].filter(Boolean))];
  }
  const pacote = {manifesto, dados, porId, configs, indices, aliasesFontes, codigosEditoriais};
  pacote.impressao = hash(textos.join('\n') + assinatura(configs) + assinatura(indices));
  conferirLocal(pacote);
  return pacote;
}
const referencias = {usuarioId: 'usuarios', propriedadeId: 'propriedades', talhaoId: 'talhoes', culturaId: 'culturas', culturasIds: 'culturas', culturasAfetadasIds: 'culturas', fontesIds: 'fontes_conhecimento', plantacaoId: 'plantacoes', registradoPor: 'usuarios', ocorrenciaId: 'ocorrencias', tratamentoId: 'tratamentos', monitoramentoId: 'monitoramentos', autorId: 'usuarios', ocorrenciaOrigemId: 'ocorrencias', enviadaPor: 'usuarios', experienciaId: 'experiencias_comunidade', denuncianteId: 'usuarios', revisadoPor: 'usuarios', analisadoPor: 'usuarios', problemaAgricolaId: 'problemas_agricolas', tratamentoOrigemId: 'tratamentos', avaliacaoOrigemId: 'avaliacoes_tratamento'};
function conferirLocal(p) {
  const erros = [], vistos = new Set();
  for (const reg of p.manifesto.documentos) {
    if (vistos.has(reg.idReservado.$oid)) falhar('manifesto_id_repetido');
    vistos.add(reg.idReservado.$oid);
    const item = p.porId.get(reg.idReservado.$oid);
    if (!item || item.col !== reg.colecao) falhar('manifesto_sem_documento', [reg.alias]);
  }
  if (vistos.size !== p.porId.size) falhar('documento_sem_manifesto');
  function percorrer(v) {
    if (!v || typeof v !== 'object') return;
    for (const [k, val] of Object.entries(v)) {
      if (referencias[k]) for (const ref of Array.isArray(val) ? val : [val]) {
        const alvo = p.porId.get(ref.$oid);
        if (!alvo || alvo.col !== referencias[k]) falhar('referencia_local_ausente', [k]);
      }
      if (k === 'contexto' && val.tipo === 'ocorrencia' && p.porId.get(val.id.$oid)?.col !== 'ocorrencias') falhar('contexto_local_ausente');
      percorrer(val);
    }
  }
  for (const [col, docs] of Object.entries(p.dados)) {
    const cont = p.manifesto.contagens.find(c => c.colecao === col);
    if (!cont || cont.preparadosLocalmente !== docs.length) falhar('contagem_manifesto_divergente', [col]);
    for (const doc of docs) { erros.push(...errosSchema(doc, p.configs[col].validator.$jsonSchema, col + ':' + id(doc))); percorrer(doc); }
  }
  if (erros.length) falhar('schema_local_incompativel', erros.slice(0, 30));
  const obter = ref => p.porId.get(ref.$oid).doc;
  const chaveNatural = (col, d) => {
    const campos = {usuarios: ['firebaseUid', 'cpf'], culturas: ['nome'], problemas_agricolas: ['codigoEditorial'], fontes_conhecimento: ['url']};
    const chaves = (campos[col] || []).map(k => k + ':' + String(d[k]).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim());
    if (col === 'fontes_conhecimento') chaves.push(('obra:' + d.titulo + ':' + d.instituicaoOuAutor).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim());
    return chaves;
  };
  for (const [col, docs] of Object.entries(p.dados)) {
    const chaves = new Set();
    for (const d of docs) for (const chave of chaveNatural(col, d)) {
      if (chaves.has(chave)) falhar('chave_natural_local_repetida', [col]);
      chaves.add(chave);
    }
  }
  const dono = plantacao => obter(obter(obter(plantacao.talhaoId).propriedadeId).usuarioId);
  for (const prop of p.dados.propriedades) {
    const area = p.dados.talhoes.filter(t => t.propriedadeId.$oid === id(prop)).reduce((n, t) => n + numero(t.areaHa), 0);
    if (area > numero(prop.areaTotalHa)) falhar('soma_areas_divergente', [id(prop)]);
  }
  for (const pl of p.dados.plantacoes) if (pl.areaPlantadaHa && numero(pl.areaPlantadaHa) > numero(obter(pl.talhaoId).areaHa)) falhar('area_plantada_divergente', [id(pl)]);
  for (const oc of p.dados.ocorrencias) {
    const pl = obter(oc.plantacaoId);
    if (id(dono(pl)) !== oc.registradoPor.$oid) falhar('proprietario_ocorrencia_divergente', [id(oc)]);
    if (pl.dataPlantio && dia(oc.dataObservacao) < dia(pl.dataPlantio)) falhar('ocorrencia_antes_plantio', [id(oc)]);
    if (oc.encerradoEm && dia(oc.encerradoEm) < dia(oc.dataObservacao)) falhar('encerramento_antes_observacao', [id(oc)]);
  }
  for (const tr of p.dados.tratamentos) {
    const oc = obter(tr.ocorrenciaId);
    if (dia(tr.dataAplicacao) < dia(oc.dataObservacao) || oc.encerradoEm && dia(tr.dataAplicacao) > dia(oc.encerradoEm)) falhar('data_tratamento_divergente', [id(tr)]);
  }
  for (const mo of p.dados.monitoramentos) if (mo.ocorrenciaId) {
    const oc = obter(mo.ocorrenciaId);
    if (mo.plantacaoId.$oid !== oc.plantacaoId.$oid || dia(mo.dataObservacao) < dia(oc.dataObservacao) || oc.encerradoEm && dia(mo.dataObservacao) > dia(oc.encerradoEm)) falhar('monitoramento_divergente', [id(mo)]);
  }
  for (const av of p.dados.avaliacoes_tratamento) {
    const tr = obter(av.tratamentoId), oc = obter(tr.ocorrenciaId);
    if (dia(av.dataAvaliacao) < dia(tr.dataAplicacao) || oc.encerradoEm && dia(av.dataAvaliacao) > dia(oc.encerradoEm)) falhar('data_avaliacao_divergente', [id(av)]);
    if (av.monitoramentoId) {
      const mo = obter(av.monitoramentoId);
      if (mo.ocorrenciaId?.$oid !== tr.ocorrenciaId.$oid || dia(mo.dataObservacao) < dia(tr.dataAplicacao) || dia(mo.dataObservacao) > dia(av.dataAvaliacao)) falhar('vinculo_avaliacao_divergente', [id(av)]);
    }
  }
  for (const al of p.dados.alertas) {
    const oc = obter(al.contexto.id);
    if (oc.intensidade !== 'alta' || id(dono(obter(oc.plantacaoId))) !== al.usuarioId.$oid) falhar('alerta_divergente', [id(al)]);
  }
  if (p.dados.problemas_agricolas.length !== 40 || p.dados.problemas_agricolas.some(d => d.ativo !== false || d.revisaoEditorial.status !== 'pendente' || d.revisadoEm)) falhar('estado_catalogo_divergente');
  if (p.dados.problemas_agricolas.some(d => !p.codigosEditoriais.has(d.codigoEditorial)) || p.dados.problemas_agricolas.filter(d => d.tipo === 'praga').length !== 20 || p.dados.problemas_agricolas.filter(d => d.tipo === 'doenca').length !== 20) falhar('escopo_das_40_fichas_divergente');
  if (p.dados.adocoes_tratamento.length || p.dados.denuncias_comunidade.length || p.dados.experiencias_comunidade.some(d => d.moderacao.status !== 'pendente')) falhar('cenario_comunidade_ainda_nao_liberado');
}
function campo(doc, caminho) { return caminho.split('.').reduce((v, k) => v?.[k], doc); }
function dentro(doc, filtro = {}) {
  // Filtros parciais atuais são igualdades escalares. Falhar fechado se evoluírem.
  return Object.entries(filtro).every(([k, v]) => {
    if (k.startsWith('$') || v && typeof v === 'object') falhar('filtro_parcial_requer_revisao', [k]);
    return igual(bson(campo(doc, k)), bson(v));
  });
}
function familias(p) {
  return p.manifesto.ciclosHistoricos.map(c => {
    const localizar = alias => p.porId.get(p.manifesto.documentos.find(d => d.alias === alias).idReservado.$oid).doc;
    const pl = localizar(c.plantacaoAlias), oc = localizar(c.ocorrenciaAlias);
    const tr = p.dados.tratamentos.filter(d => d.ocorrenciaId.$oid === id(oc));
    const mo = p.dados.monitoramentos.filter(d => d.ocorrenciaId?.$oid === id(oc));
    const av = p.dados.avaliacoes_tratamento.filter(d => tr.some(t => id(t) === d.tratamentoId.$oid));
    return {pl, oc, tr, mo, av, todos: [pl, oc, ...tr, ...mo, ...av]};
  });
}
async function configuracao(db, p) {
  const infos = await db.listCollections({}, {nameOnly: false}).toArray(), encontrados = {};
  for (const [col, cfg] of Object.entries(p.configs)) {
    const info = infos.find(i => i.name === col), op = info?.options || {};
    if (!info || info.type !== 'collection') falhar('colecao_ausente_ou_incompativel', [col]);
    if (!igual(op.validator || {}, cfg.validator) || (op.validationLevel || 'strict') !== cfg.validationLevel || (op.validationAction || 'error') !== cfg.validationAction || op.collation || op.capped || op.timeseries) falhar('configuracao_divergente', [col]);
    encontrados[col] = await db.collection(col).listIndexes().toArray();
  }
  for (const esperado of p.indices) {
    const op = esperado.opcoes;
    const corresponde = atual => igual(Object.entries(atual.key), Object.entries(esperado.key)) && !!atual.unique === !!op.unique && igual(atual.partialFilterExpression || {}, op.partialFilterExpression || {}) && !atual.sparse && !atual.hidden && !atual.collation && atual.expireAfterSeconds === undefined && !atual.storageEngine && !atual.wildcardProjection;
    const porNome = encontrados[esperado.colecao].find(i => i.name === esperado.nome);
    if (porNome && !corresponde(porNome) || !encontrados[esperado.colecao].some(corresponde)) falhar('indice_ausente_ou_divergente', [esperado.colecao, esperado.nome]);
  }
  return encontrados; // Inclui adicionais, preservados integralmente.
}
function filtrosNaturais(col, doc, aliasesFontes = {}) {
  const f = [];
  if (col === 'usuarios') f.push({firebaseUid: bson(doc.firebaseUid)}, {cpf: doc.cpf});
  if (col === 'culturas') f.push({nome: doc.nome});
  if (col === 'fontes_conhecimento') f.push(...[...new Set([doc.url, ...(aliasesFontes[id(doc)] || [])])].map(url => ({url})), {titulo: doc.titulo, instituicaoOuAutor: doc.instituicaoOuAutor});
  if (col === 'problemas_agricolas') f.push({codigoEditorial: doc.codigoEditorial}, {nomeComum: doc.nomeComum, tipo: doc.tipo});
  return f;
}
async function preConferir(db, p, indices, session) {
  p = await require('./lib-estado-editorial-bd6.cjs')(db, p, session, {igual, bson, errosSchema});
  const presentes = new Set(), totais = {};
  for (const [col, docs] of Object.entries(p.dados)) {
    totais[col] = {preparados: docs.length, existentesIguais: 0, novos: 0};
    const atuais = docs.length ? await db.collection(col).find({_id: {$in: docs.map(d => bson(d._id))}}, {session}).toArray() : [];
    const porId = new Map(atuais.map(d => [d._id.toHexString(), d]));
    for (const doc of docs) {
      const atual = porId.get(id(doc));
      if (atual) {
        if (!igual(atual, bson(doc))) falhar('documento_existente_divergente_preservado', [col, id(doc)]);
        presentes.add(id(doc)); totais[col].existentesIguais++;
      } else totais[col].novos++;
    }
    const naturais = docs.flatMap(doc => filtrosNaturais(col, doc, p.aliasesFontes));
    if (naturais.length) {
      const encontrados = await db.collection(col).find({$or: naturais}, {session, collation: {locale: 'pt', strength: 1}, projection: {_id: 1}}).toArray();
      const idsLocais = new Set(docs.map(id));
      if (encontrados.some(d => !idsLocais.has(d._id.toHexString()))) falhar('possivel_equivalente_com_outro_id_resolver_mapa', [col]);
    }
  }
  for (const familia of familias(p)) {
    const n = familia.todos.filter(d => presentes.has(id(d))).length;
    if (n && n !== familia.todos.length) falhar('historico_parcial_requer_analise_sem_reabrir_pais', [id(familia.pl)]);
    if (!n && p.dados.plantacoes.some(d => d.talhaoId.$oid === familia.pl.talhaoId.$oid && d.status === 'ativa' && presentes.has(id(d)))) falhar('historico_novo_com_plantacao_atual_existente', [id(familia.pl)]);
  }
  for (const [col, lista] of Object.entries(indices)) for (const ind of lista.filter(i => i.unique && i.name !== '_id_')) {
    if (ind.sparse || ind.collation || Object.values(ind.key).some(v => ![1, -1].includes(Number(v)))) falhar('indice_unico_adicional_requer_analise', [col, ind.name]);
    const vistos = new Set(), variantes = [...p.dados[col]];
    if (col === 'plantacoes') for (const f of familias(p)) if (!presentes.has(id(f.pl))) variantes.push({...f.pl, status: 'ativa'});
    for (const doc of variantes) if (dentro(doc, ind.partialFilterExpression)) {
      const campos = Object.keys(ind.key);
      if (campos.some(k => Array.isArray(campo(doc, k)))) falhar('indice_unico_multikey_requer_analise', [col, ind.name]);
      const chave = assinatura(campos.map(k => bson(campo(doc, k) ?? null)));
      // As variantes históricas se encerram antes do plantio atual; auditar o snapshot final separadamente.
      if (p.dados[col].includes(doc)) { if (vistos.has(chave)) falhar('duplicidade_local', [col, ind.name]); vistos.add(chave); }
      const filtro = {$and: [Object.fromEntries(campos.map(k => [k, bson(campo(doc, k) ?? null)])), ind.partialFilterExpression || {}, {_id: {$ne: bson(doc._id)}}]};
      if (await db.collection(col).findOne(filtro, {session, projection: {_id: 1}})) falhar('colisao_indice_unico_existente', [col, ind.name, id(doc)]);
    }
  }
  return {presentes, totais, estadoEditorialDemonstracao: p.demonstracaoEditorial || 'nao_aplicavel'};
}
function plano(p, presentes) {
  const a = [], usados = new Set(), inserir = (col, d) => { a.push({operacao: 'inserir', col, doc: d}); usados.add(id(d)); };
  // O questionário do usuário já referencia culturas; elas precisam vir primeiro.
  for (const col of ['culturas', 'fontes_conhecimento', 'problemas_agricolas', 'usuarios', 'propriedades', 'talhoes']) for (const d of p.dados[col]) inserir(col, d);
  for (const f of familias(p)) {
    f.todos.forEach(d => usados.add(id(d)));
    if (f.todos.every(d => presentes.has(id(d)))) continue;
    const pl = copiar(f.pl); pl.status = 'ativa'; delete pl.dataEncerramento;
    const oc = copiar(f.oc); oc.status = 'aberta'; delete oc.encerradoEm; delete oc.motivoEncerramento;
    inserir('plantacoes', pl); inserir('ocorrencias', oc);
    for (const [col, docs] of [['tratamentos', f.tr], ['monitoramentos', f.mo], ['avaliacoes_tratamento', f.av]]) for (const d of docs) inserir(col, d);
    a.push({operacao: 'encerrar', col: 'ocorrencias', doc: f.oc, anterior: oc});
    a.push({operacao: 'encerrar', col: 'plantacoes', doc: f.pl, anterior: pl});
  }
  for (const col of ['plantacoes', 'ocorrencias', 'tratamentos', 'monitoramentos', 'avaliacoes_tratamento', 'alertas', 'experiencias_comunidade', 'adocoes_tratamento', 'denuncias_comunidade']) for (const d of p.dados[col]) if (!usados.has(id(d))) inserir(col, d);
  for (const ac of a) if (errosSchema(ac.doc, p.configs[ac.col].validator.$jsonSchema).length) falhar('estado_intermediario_invalido', [ac.col, id(ac.doc)]);
  return a;
}
async function validar(db, p, session) {
  p = await require('./lib-estado-editorial-bd6.cjs')(db, p, session, {igual, bson, errosSchema});
  const colecoes = [], problemas = [];
  for (const [col, docs] of Object.entries(p.dados)) {
    const ids = docs.map(d => bson(d._id));
    const atuais = docs.length ? await db.collection(col).find({_id: {$in: ids}}, {session}).toArray() : [];
    const mapa = new Map(atuais.map(d => [d._id.toHexString(), d]));
    let iguais = 0;
    for (const d of docs) {
      const atual = mapa.get(id(d));
      if (atual && igual(atual, bson(d))) iguais++;
      else problemas.push({colecao: col, id: id(d), situacao: atual ? 'divergente_preservado' : 'ausente'});
    }
    // Verificação MongoDB real do schema, somente sobre os IDs da massa.
    const invalidos = docs.length ? await db.collection(col).countDocuments({_id: {$in: ids}, $nor: [p.configs[col].validator]}, {session}) : 0;
    if (invalidos) problemas.push({colecao: col, situacao: 'schema_incompativel', quantidade: invalidos});
    colecoes.push({colecao: col, esperados: docs.length, encontrados: atuais.length, identicos: iguais, invalidos});
  }
  const verificacoes = [];
  async function contar(nome, col, filtro, esperado) {
    const encontrado = await db.collection(col).countDocuments(filtro, {session});
    verificacoes.push({nome, esperado, encontrado, aprovado: encontrado === esperado});
    if (encontrado !== esperado) problemas.push({situacao: 'filtro_divergente', nome});
  }
  const ids = col => p.dados[col].map(d => bson(d._id));
  for (const status of ['aberta', 'em_acompanhamento', 'encerrada']) await contar('ocorrencias_' + status, 'ocorrencias', {_id: {$in: ids('ocorrencias')}, status}, p.dados.ocorrencias.filter(d => d.status === status).length);
  await contar('catalogo_pendente_inativo', 'problemas_agricolas', {_id: {$in: ids('problemas_agricolas')}, ativo: false, 'revisaoEditorial.status': 'pendente'}, p.dados.problemas_agricolas.filter(d => !d.ativo && d.revisaoEditorial.status === 'pendente').length);
  await contar('catalogo_aprovado_simulado', 'problemas_agricolas', {_id: {$in: ids('problemas_agricolas')}, ativo: true, 'revisaoEditorial.status': 'aprovada'}, p.demonstracaoEditorial === 'aprovacao_simulada_exata' ? 1 : 0);
  await contar('experiencias_fora_do_feed', 'experiencias_comunidade', {_id: {$in: ids('experiencias_comunidade')}, 'moderacao.status': 'aprovada'}, 0);
  await contar('inspecoes_sem_ocorrencia', 'monitoramentos', {_id: {$in: ids('monitoramentos')}, ocorrenciaId: {$exists: false}}, p.dados.monitoramentos.filter(d => !d.ocorrenciaId).length);
  const sem = p.manifesto.documentos.find(d => d.alias === 'propriedade_a_sem_ocorrencias');
  if (!sem) falhar('cenario_sem_ocorrencias_nao_localizado');
  const talhoesSem = p.dados.talhoes.filter(d => d.propriedadeId.$oid === sem.idReservado.$oid).map(id);
  const plantasSem = p.dados.plantacoes.filter(d => talhoesSem.includes(d.talhaoId.$oid)).map(d => bson(d._id));
  await contar('propriedade_sem_ocorrencias_inclusive_registros_extras', 'ocorrencias', {plantacaoId: {$in: plantasSem}}, 0);
  // Igualdade integral + pacote local consistente comprova as referências esperadas presentes.
  return {aprovado: problemas.length === 0, estadoEditorialDemonstracao: p.demonstracaoEditorial || 'nao_aplicavel', colecoes, verificacoes, problemas, referencias: problemas.length ? 'nao_confirmadas_integralmente' : 'IDs e documentos de todas as referencias do pacote presentes e identicos, considerando somente a excecao editorial exata quando aplicada', limitacoes: ['Comparacao dos IDs do manifesto, nao contagem global das colecoes.', 'Leituras avulsas podem refletir gravacoes concorrentes; reservar janela sem edicoes.', 'Nao comprova autenticacao, autorizacao, revisao tecnica ou funcionamento da API.']};
}
async function inserir(db, p, indices, session) {
  let resultado;
  await session.withTransaction(async () => {
    const pre = await preConferir(db, p, indices, session), criados = new Set();
    let inseridos = 0, encerramentos = 0;
    const acoes = plano(p, pre.presentes);
    for (let i = 0; i < acoes.length; i++) {
      const ac = acoes[i];
      if (ac.operacao === 'inserir') {
        const lote = [];
        while (i < acoes.length && acoes[i].operacao === 'inserir' && acoes[i].col === ac.col) {
          if (!pre.presentes.has(id(acoes[i].doc))) lote.push(acoes[i].doc);
          i++;
        }
        i--;
        if (!lote.length) continue;
        const res = await db.collection(ac.col).insertMany(lote.map(bson), {session, ordered: true});
        if (!res.acknowledged || res.insertedCount !== lote.length) falhar('insercao_nao_confirmada');
        lote.forEach(d => criados.add(id(d))); inseridos += lote.length;
      } else {
        if (!criados.has(id(ac.doc))) falhar('tentativa_de_alterar_documento_preexistente');
        const res = await db.collection(ac.col).replaceOne(bson(ac.anterior), bson(ac.doc), {session});
        if (res.matchedCount !== 1 || res.modifiedCount !== 1) falhar('encerramento_nao_confirmado');
        encerramentos++;
      }
    }
    const conferencia = await validar(db, p, session);
    if (!conferencia.aprovado) falhar('validacao_antes_commit_falhou', conferencia.problemas);
    resultado = {aprovado: true, transacaoConfirmada: true, escritaExecutada: inseridos > 0, inseridos, preexistentesPreservados: pre.presentes.size, encerramentosSomenteDeNovos: encerramentos, conferencia};
  }, {readConcern: {level: 'snapshot'}, writeConcern: {w: 'majority'}, readPreference: 'primary', maxCommitTimeMS: 30000});
  return resultado;
}
async function executar(modo) {
  let cliente, session;
  try {
    const p = carregar();
    if (process.argv.some(a => a.startsWith('--banco=') && a !== '--banco=' + BANCO)) falhar('destino_nao_permitido');
    // Somente leitura do .env existente. Nenhuma credencial é incluída nos relatórios.
    if (!process.env.MONGODB_URI) backend('dotenv').config({path: path.join(raiz, 'backend/.env')});
    if (!process.env.MONGODB_URI) falhar('MONGODB_URI_ausente');
    cliente = new MongoClient(process.env.MONGODB_URI, {serverSelectionTimeoutMS: 10000});
    await cliente.connect();
    const db = cliente.db(BANCO), indices = await configuracao(db, p);
    let resultado;
    if (modo === 'validar') resultado = await validar(db, p);
    else if (modo === 'inserir' && process.argv.includes('--aplicar')) {
      session = cliente.startSession(); resultado = await inserir(db, p, indices, session);
    } else {
      const pre = await preConferir(db, p, indices);
      resultado = {aprovado: true, estadoEditorialDemonstracao: pre.estadoEditorialDemonstracao, contagens: pre.totais, operacoesPlanejadas: plano(p, pre.presentes).length, escritaExecutada: false};
    }
    const configuracoesConferidas = {colecoes: Object.keys(p.configs).length, validadores: Object.keys(p.configs).length, indicesBD4: p.indices.length, indicesExistentesPreservados: Object.fromEntries(Object.entries(indices).map(([col, lista]) => [col, lista.map(i => i.name)]))};
    console.log(JSON.stringify({banco: BANCO, modo, executadoEm: new Date().toISOString(), impressaoDoPacote: p.impressao, configuracoesConferidas, ...resultado}, null, 2));
    if (resultado.aprovado === false) process.exitCode = 1;
  } catch (e) {
    // Não imprimir message/stack do driver: podem conter URI, valores únicos ou dados pessoais.
    console.error(JSON.stringify({aprovado: false, codigo: e.codigoSeguro || 'erro_mongodb_ou_ambiente', codigoMongoDB: typeof e.code === 'number' ? e.code : undefined, detalhes: e.detalhesSeguros || [], orientacao: 'Interrompido. Conferir pre-conferencia/validacao antes de repetir; nenhum documento preexistente e sobrescrito. Em resultado de commit desconhecido, validar antes de repetir.'}, null, 2));
    process.exitCode = 1;
  } finally {
    for (const fechar of [() => session?.endSession(), () => cliente?.close()]) {
      try { await fechar(); }
      catch { console.error(JSON.stringify({aprovado: false, codigo: 'falha_ao_encerrar_conexao'})); process.exitCode = 1; }
    }
  }
}
module.exports = {arquivoSeed, carregar, errosSchema, conferirLocal, configuracao, preConferir, plano, inserir, validar, executar, bson, igual, assinatura, dentro, filtrosNaturais, familias, referencias};
