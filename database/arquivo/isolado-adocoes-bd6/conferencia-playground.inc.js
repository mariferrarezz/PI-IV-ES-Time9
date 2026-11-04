// Corpo usado para gerar o Playground autossuficiente; não executar este fragmento.
// As consultas abaixo são exclusivamente de leitura no banco fixo isolado.
const relatorio = (() => {
  const destino = db.getSiblingDB('sentinela_testes_bd6');
  const resumo = {banco: 'sentinela_testes_bd6', somenteLeitura: true, escritaExecutada: false,
    impressaoPacote: pacote.impressao, configuracaoCompleta: false,
    colecoesAusentes: [], indicesAusentes: [], contagens: {}, indicesExistentesPreservados: {}};
  function interromper(codigo, detalhes = []) { const e = new Error(codigo); e.codigoSeguro = codigo; e.detalhesSeguros = detalhes; throw e; }
  function normal(v) {
    if (Array.isArray(v)) return v.map(normal);
    if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map(k => [k, normal(v[k])]));
    return v;
  }
  const assinatura = v => JSON.stringify(normal(EJSON.serialize(v, {relaxed: false})));
  const igual = (a, b) => assinatura(a) === assinatura(b);
  const campo = (d, k) => k.split('.').reduce((v, t) => v?.[t], d);
  const id = d => d._id.toHexString();
  function dentro(doc, filtro = {}) {
    return Object.entries(filtro).every(([k, v]) => {
      if (k.startsWith('$') || v && typeof v === 'object') interromper('filtro_parcial_requer_revisao', [k]);
      return igual(campo(doc, k), v);
    });
  }
  function corresponde(atual, esperado) {
    return igual(Object.entries(atual.key), Object.entries(esperado.key)) && !!atual.unique === !!esperado.opcoes.unique &&
      igual(atual.partialFilterExpression || {}, esperado.opcoes.partialFilterExpression || {}) &&
      !atual.sparse && !atual.collation && !atual.hidden && atual.expireAfterSeconds === undefined && !atual.storageEngine && !atual.wildcardProjection;
  }
  function naturais(col, doc) {
    if (col === 'usuarios') return [{firebaseUid: doc.firebaseUid}, {cpf: doc.cpf}];
    if (col === 'culturas') return [{nome: doc.nome}];
    if (col === 'fontes_conhecimento') return [{url: doc.url}, {titulo: doc.titulo, instituicaoOuAutor: doc.instituicaoOuAutor}];
    if (col === 'problemas_agricolas') return [{codigoEditorial: doc.codigoEditorial}, {nomeComum: doc.nomeComum, tipo: doc.tipo}];
    return [];
  }
  try {
    if (destino.getName() !== 'sentinela_testes_bd6') interromper('destino_isolado_obrigatorio');
    if (Object.keys(pacote.configs).length !== 15 || pacote.indices.length !== 22) interromper('snapshot_de_configuracao_invalido');
    const infos = destino.getCollectionInfos(), existentes = {};
    for (const [col, cfg] of Object.entries(pacote.configs)) {
      const info = infos.find(c => c.name === col);
      if (!info) { resumo.colecoesAusentes.push(col); existentes[col] = []; continue; }
      const op = info.options || {};
      if (info.type !== 'collection' || !igual(op.validator || {}, cfg.validator) || (op.validationLevel || 'strict') !== 'strict' ||
          (op.validationAction || 'error') !== 'error' || op.collation || op.capped || op.timeseries) interromper('configuracao_isolada_divergente_preservada', [col]);
      existentes[col] = destino.getCollection(col).getIndexes();
      resumo.indicesExistentesPreservados[col] = existentes[col].map(i => i.name);
      const invalidos = destino.getCollection(col).countDocuments({$nor: [cfg.validator]});
      if (invalidos) interromper('documentos_isolados_invalidos_preservados', [col, invalidos]);
    }
    const criar = [];
    for (const i of pacote.indices) {
      const lista = existentes[i.colecao], nome = lista.find(a => a.name === i.nome);
      if (nome && !corresponde(nome, i)) interromper('indice_isolado_divergente_preservado', [i.colecao, i.nome]);
      if (lista.some(a => igual(Object.entries(a.key), Object.entries(i.key)) && !corresponde(a, i))) interromper('chaves_isoladas_com_opcoes_divergentes', [i.colecao, i.nome]);
      if (!lista.some(a => corresponde(a, i))) criar.push(i);
      if (i.opcoes.unique && !resumo.colecoesAusentes.includes(i.colecao)) {
        const duplicados = destino.getCollection(i.colecao).aggregate([
          {$match: i.opcoes.partialFilterExpression || {}},
          {$group: {_id: Object.fromEntries(Object.keys(i.key).map((k, n) => ['c' + n, '$' + k])), total: {$sum: 1}}},
          {$match: {total: {$gt: 1}}}, {$limit: 1}, {$project: {_id: 0, total: 1}},
        ]).toArray();
        if (duplicados.length) interromper('duplicidade_isolada_preservada', [i.colecao, i.nome]);
      }
    }
    resumo.indicesAusentes = criar.map(i => ({colecao: i.colecao, nome: i.nome, key: i.key, ...i.opcoes}));
    let presentes = 0;
    for (const [col, docs] of Object.entries(pacote.dados)) {
      const atuais = docs.length ? destino.getCollection(col).find({_id: {$in: docs.map(d => d._id)}}).toArray() : [];
      const mapa = new Map(atuais.map(d => [id(d), d]));
      let iguais = 0;
      for (const d of docs) if (mapa.has(id(d))) {
        if (!igual(mapa.get(id(d)), d)) interromper('documento_existente_divergente_preservado', [col, id(d)]);
        iguais++;
      }
      presentes += iguais;
      resumo.contagens[col] = {preparados: docs.length, existentesIguais: iguais, novos: docs.length - iguais};
      const filtros = docs.flatMap(d => naturais(col, d));
      if (filtros.length) {
        const encontrados = destino.getCollection(col).find({$or: filtros}, {_id: 1}).collation({locale: 'pt', strength: 1}).toArray();
        const ids = new Set(docs.map(id));
        if (encontrados.some(d => !ids.has(id(d)))) interromper('possivel_equivalente_com_outro_id_resolver_mapa', [col]);
      }
    }
    // Mesmas verificações de índices únicos existentes/planejados da conferência Node.
    for (const [col, docs] of Object.entries(pacote.dados)) {
      const lista = [...existentes[col], ...criar.filter(i => i.colecao === col).map(i => ({name: i.nome, key: i.key, ...i.opcoes}))];
      for (const i of lista.filter(i => i.unique && i.name !== '_id_')) {
        if (i.sparse || i.collation || Object.values(i.key).some(v => ![1, -1].includes(Number(v)))) interromper('indice_unico_adicional_requer_analise', [col, i.name]);
        const vistos = new Set(), campos = Object.keys(i.key);
        for (const d of docs) if (dentro(d, i.partialFilterExpression)) {
          if (campos.some(k => Array.isArray(campo(d, k)))) interromper('indice_unico_multikey_requer_analise', [col, i.name]);
          const chave = assinatura(campos.map(k => campo(d, k) ?? null));
          if (vistos.has(chave)) interromper('duplicidade_local', [col, i.name]);
          vistos.add(chave);
          const filtro = {$and: [Object.fromEntries(campos.map(k => [k, campo(d, k) ?? null])), i.partialFilterExpression || {}, {_id: {$ne: d._id}}]};
          if (destino.getCollection(col).findOne(filtro, {_id: 1})) interromper('colisao_indice_unico_existente', [col, i.name, id(d)]);
        }
      }
    }
    return {...resumo, aprovado: true, configuracaoCompleta: !resumo.colecoesAusentes.length && !criar.length,
      documentosPreparados: 22, documentosPresentesIguais: presentes, documentosNovos: 22 - presentes,
      observacao: 'Plano somente de leitura. Ausências não foram criadas; aprovação do plano não comprova permissão de escrita, revisão técnica ou autorização da API.'};
  } catch (e) {
    // Não retornar message/stack do servidor, documentos ou chaves pessoais.
    return {...resumo, aprovado: false, codigo: e.codigoSeguro || 'erro_mongodb_ou_ambiente',
      codigoMongoDB: typeof e.code === 'number' ? e.code : undefined, detalhes: e.detalhesSeguros || [],
      orientacao: 'Interromper e analisar. Nenhuma alteração foi executada.'};
  }
})();
// Última expressão também entrega o objeto ao Playground Result.
relatorio;
