use('sentinela');
const banco = db.getSiblingDB('sentinela');
const limite = 20;
const resultados = [];
if (banco.getName() !== 'sentinela') throw new Error('Banco inesperado.');

// IDs já confirmados nesta conversa; cada documento é consultado novamente.
const usuario = banco.usuarios.findOne({_id: ObjectId('6ae8f301045abb5a0084cc0f')}, {_id: 1, firebaseUid: 1});
const propriedade = usuario && banco.propriedades.findOne({
  _id: ObjectId('6ae8f38ebe9361f095b99a16'), usuarioId: usuario._id
}, {_id: 1});
const talhao = propriedade && banco.talhoes.findOne({
  _id: ObjectId('6ae8f3e4561de7fc6a80052d'), propriedadeId: propriedade._id
}, {_id: 1});
const plantacao = talhao && banco.plantacoes.findOne({
  _id: ObjectId('6ae8f563439a48722c4c64c7'), talhaoId: talhao._id
}, {_id: 1, culturaId: 1});
const cultura = plantacao && banco.culturas.findOne({_id: plantacao.culturaId}, {_id: 1});
const ocorrencia = plantacao && banco.ocorrencias.findOne({
  _id: ObjectId('6ae9146eb8011c50895558e0'), plantacaoId: plantacao._id
}, {_id: 1});
const tratamento = ocorrencia && banco.tratamentos.findOne({
  _id: ObjectId('6ae91edec3ec188cbf9a2987'), ocorrenciaId: ocorrencia._id
}, {_id: 1});
const experiencia = usuario && cultura && banco.experiencias_comunidade.findOne({
  _id: ObjectId('6ae92ad30a65ca1792f6222b'), autorId: usuario._id, culturaId: cultura._id
}, {_id: 1, problemaAgricolaId: 1});
const problema = experiencia && experiencia.problemaAgricolaId && banco.problemas_agricolas.findOne({
  _id: experiencia.problemaAgricolaId, culturasAfetadasIds: cultura._id
}, {_id: 1, fontesIds: 1});
const adocao = experiencia && usuario && banco.adocoes_tratamento.findOne({
  _id: ObjectId('6ae92afd1e95b13e555267a1'), usuarioId: usuario._id, experienciaId: experiencia._id
}, {_id: 1, ocorrenciaId: 1});
const destino = adocao && banco.ocorrencias.findOne({_id: adocao.ocorrenciaId}, {_id: 1, plantacaoId: 1});
const destinoConferido = destino && plantacao && destino.plantacaoId.equals(plantacao._id);

// Sanitiza somente a apresentação; os filtros efetivamente consultados não mudam.
function sanitizarIdentificadores(valor) {
  if (!valor || typeof valor !== 'object') return valor;
  if (['Int32', 'Long', 'Double', 'Decimal128'].includes(valor._bsontype)) return valor;
  if (valor._bsontype) return '[valor BSON omitido]';
  if (valor instanceof Date) return valor;
  if (Array.isArray(valor)) return valor.map(sanitizarIdentificadores);
  return Object.fromEntries(Object.entries(valor).map(([chave, item]) => [chave,
    chave === '$oid' || (chave === 'firebaseUid' && typeof item === 'string')
      ? '[identificador omitido]' : sanitizarIdentificadores(item)]));
}
function sanitizarPlano(valor, campo = '') {
  // Esses trechos podem conter valores, IDs codificados e nomes de servidores.
  if (['filter', 'parsedQuery', 'indexBounds', 'startKey', 'endKey',
    'slotBasedPlan', 'namespace', 'serverInfo', 'shards'].includes(campo)) return '[conteúdo omitido]';
  if (valor === null || valor === undefined) return valor;
  if (typeof valor === 'string') {
    return ['stage', 'indexName', 'direction'].includes(campo) ? valor : '[valor omitido]';
  }
  if (typeof valor !== 'object') return valor;
  if (['Int32', 'Long', 'Double', 'Decimal128'].includes(valor._bsontype)) return valor;
  if (valor._bsontype || valor instanceof Date) return '[valor BSON omitido]';
  if (Array.isArray(valor)) return valor.map(item => sanitizarPlano(item, campo));
  return Object.fromEntries(Object.entries(valor).map(([chave, item]) => [chave, sanitizarPlano(item, chave)]));
}

// Examina apenas planos vencedores/estágios executados: exclui planos rejeitados.
function resumir(explain) {
  const indices = new Set(), estagios = new Set(), planos = [];
  function visitar(valor) {
    if (!valor || typeof valor !== 'object') return;
    if (valor.indexName) indices.add(valor.indexName);
    if (typeof valor.stage === 'string') estagios.add(valor.stage);
    if (Array.isArray(valor)) valor.forEach(visitar);
    else Object.keys(valor).forEach(chave => {
      if (!['rejectedPlans', 'allPlansExecution'].includes(chave)) visitar(valor[chave]);
    });
  }
  function localizar(valor) {
    if (!valor || typeof valor !== 'object') return;
    if (valor.queryPlanner && valor.queryPlanner.winningPlan) planos.push(valor.queryPlanner.winningPlan);
    if (Array.isArray(valor)) valor.forEach(localizar);
    else Object.keys(valor).forEach(chave => {
      if (!['rejectedPlans', 'allPlansExecution', 'winningPlan'].includes(chave)) localizar(valor[chave]);
    });
  }
  localizar(explain);
  planos.forEach(visitar);
  const cursor = (explain.stages || []).find(s => s.$cursor);
  const stats = explain.executionStats || (cursor && cursor.$cursor.executionStats);
  if (stats) visitar(stats.executionStages);
  const etapas = explain.stages || [];
  const ultima = etapas.length ? etapas[etapas.length - 1] : null;
  const retornados = ultima && ultima.nReturned !== undefined ? ultima.nReturned : stats && stats.nReturned;
  // SORT_MERGE mescla entradas já ordenadas; não é SORT bloqueante.
  const sort = estagios.has('SORT') || etapas.some(s => s.$sort !== undefined);
  return {
    indicesEscolhidos: [...indices], estagios: [...estagios],
    documentosRetornados: retornados === undefined ? null : retornados,
    chavesExaminadas: stats ? stats.totalKeysExamined : null,
    documentosExaminados: stats ? stats.totalDocsExamined : null,
    tempoMs: stats ? stats.executionTimeMillis : null,
    ordenacaoEmMemoria: sort,
    observacao: retornados !== undefined && Number(retornados) === 0
      ? 'Sem resultados: não demonstra eficiência para casos com correspondências.'
      : 'Massa pequena e fictícia; não comprova desempenho em produção.',
    planoVencedor: planos.map(plano => sanitizarPlano(plano))
  };
}
function avaliar(nome, colecao, filtro, ordem, apoio, pipeline) {
  if (!apoio) {
    resultados.push({consulta: nome, situacao: 'não executada', motivo: 'Registro de apoio ou vínculo não confirmado.'});
    return;
  }
  try {
    const projecao = {_id: 1};
    let explicacao;
    if (pipeline) explicacao = banco.getCollection(colecao).explain('executionStats').aggregate(pipeline);
    else {
      let cursor = banco.getCollection(colecao).find(filtro, projecao);
      if (ordem) cursor = cursor.sort(ordem);
      explicacao = cursor.limit(limite).explain('executionStats');
    }
    // Mascara identificadores no filtro externo e nos planos retornados.
    resultados.push({consulta: nome, colecao, situacao: 'executada',
      filtro: colecao === 'usuarios' ? {firebaseUid: '[valor do usuário fictício conferido]'} : filtro,
      ordenacao: ordem || null, projecao: pipeline ? 'definida no pipeline' : projecao,
      limite: pipeline ? null : limite, pipeline: pipeline || undefined,
      ...resumir(explicacao)});
  } catch (erro) {
    resultados.push({consulta: nome, colecao, situacao: 'erro', codigo: erro.code || null,
      motivo: 'Explain falhou; não considerar avaliação concluída. Conferir conexão, permissão ou sintaxe no Playground.'});
  }
}
const dataObs = {dataObservacao: -1, _id: -1};
const recente = {criadoEm: -1, _id: -1};
const fila = {criadoEm: 1, _id: 1};
const feed = {publicadoEm: -1, _id: -1};
avaliar('Perfil por Firebase UID', 'usuarios', {firebaseUid: usuario && usuario.firebaseUid}, null, usuario);
avaliar('Propriedades do usuário', 'propriedades', {usuarioId: usuario && usuario._id}, null, usuario);
avaliar('Talhões da propriedade', 'talhoes', {propriedadeId: propriedade && propriedade._id}, null, propriedade);
avaliar('Histórico de plantações do talhão', 'plantacoes', {talhaoId: talhao && talhao._id}, null, talhao);
avaliar('Plantação ativa do talhão', 'plantacoes', {talhaoId: talhao && talhao._id, status: 'ativa'}, null, talhao);
avaliar('Catálogo por cultura', 'problemas_agricolas', {culturasAfetadasIds: cultura && cultura._id,
  ativo: true, 'revisaoEditorial.status': 'aprovada'}, null, cultura);
avaliar('Catálogo por cultura e tipo', 'problemas_agricolas', {culturasAfetadasIds: cultura && cultura._id,
  tipo: 'praga', ativo: true, 'revisaoEditorial.status': 'aprovada'}, null, cultura);
avaliar('Ocorrências por plantação', 'ocorrencias', {plantacaoId: plantacao && plantacao._id}, dataObs, plantacao);
avaliar('Monitoramentos por ocorrência', 'monitoramentos', {ocorrenciaId: ocorrencia && ocorrencia._id}, dataObs, ocorrencia);
avaliar('Todas as inspeções da plantação', 'monitoramentos', {plantacaoId: plantacao && plantacao._id}, dataObs, plantacao);
avaliar('Inspeções sem ocorrência', 'monitoramentos', {plantacaoId: plantacao && plantacao._id,
  ocorrenciaId: {$exists: false}}, dataObs, plantacao);
avaliar('Tratamentos por ocorrência', 'tratamentos', {ocorrenciaId: ocorrencia && ocorrencia._id}, {dataAplicacao: -1, _id: -1}, ocorrencia);
avaliar('Avaliações por tratamento', 'avaliacoes_tratamento', {tratamentoId: tratamento && tratamento._id}, {dataAvaliacao: -1, _id: -1}, tratamento);
avaliar('Alertas não lidos', 'alertas', {usuarioId: usuario && usuario._id, lidoEm: {$exists: false}}, recente, usuario);
avaliar('Feed geral aprovado', 'experiencias_comunidade', {'moderacao.status': 'aprovada'}, feed, true);
avaliar('Feed aprovado por cultura', 'experiencias_comunidade', {'moderacao.status': 'aprovada', culturaId: cultura && cultura._id}, feed, cultura);
avaliar('Feed aprovado por problema', 'experiencias_comunidade', {'moderacao.status': 'aprovada', problemaAgricolaId: problema && problema._id}, feed, problema);
avaliar('Feed aprovado com tipo residual', 'experiencias_comunidade', {'moderacao.status': 'aprovada', tipoProblema: 'praga'}, feed, true);
avaliar('Publicações próprias', 'experiencias_comunidade', {autorId: usuario && usuario._id}, recente, usuario);
avaliar('Fila de moderação', 'experiencias_comunidade', {'moderacao.status': 'pendente'}, fila, true);
avaliar('Adoções próprias', 'adocoes_tratamento', {usuarioId: usuario && usuario._id}, recente, usuario);
avaliar('Adoção planejada por par', 'adocoes_tratamento', {experienciaId: experiencia && experiencia._id,
  ocorrenciaId: destino && destino._id, status: 'planejada'}, null, destinoConferido);
avaliar('Fila de denúncias', 'denuncias_comunidade', {status: 'pendente'}, fila, true);
avaliar('Denúncias por experiência', 'denuncias_comunidade', {experienciaId: experiencia && experiencia._id}, recente, experiencia);

// Dashboard geral: segue os vínculos existentes, sem filtrar atividade dos pais.
const propriedadesIds = usuario ? banco.propriedades.find({usuarioId: usuario._id}, {_id: 1}).toArray().map(d => d._id) : [];
const talhoesIds = propriedadesIds.length ? banco.talhoes.find({propriedadeId: {$in: propriedadesIds}}, {_id: 1}).toArray().map(d => d._id) : [];
const plantacoesIds = talhoesIds.length ? banco.plantacoes.find({talhaoId: {$in: talhoesIds}}, {_id: 1}).toArray().map(d => d._id) : [];
function contar(nome, colecao, filtro, apoio) {
  avaliar(nome, colecao, filtro, null, apoio, [{$match: filtro}, {$count: 'total'}]);
}
contar('Dashboard: propriedades ativas', 'propriedades', {usuarioId: usuario && usuario._id, ativa: true}, usuario);
contar('Dashboard: talhões ativos', 'talhoes', {propriedadeId: {$in: propriedadesIds}, ativo: true}, usuario);
contar('Dashboard: plantações ativas', 'plantacoes', {talhaoId: {$in: talhoesIds}, status: 'ativa'}, usuario);
contar('Dashboard: alertas não lidos', 'alertas', {usuarioId: usuario && usuario._id, lidoEm: {$exists: false}}, usuario);
const filtroOcorrencias = {plantacaoId: {$in: plantacoesIds}};
avaliar('Dashboard: ocorrências por status', 'ocorrencias', filtroOcorrencias, null, usuario,
  [{$match: filtroOcorrencias}, {$group: {_id: '$status', total: {$sum: 1}}}]);

const relatorio = {
  banco: banco.getName(), somenteLeitura: true, semHint: true,
  totais: {executadas: resultados.filter(r => r.situacao === 'executada').length,
    erros: resultados.filter(r => r.situacao === 'erro').length,
    naoExecutadas: resultados.filter(r => r.situacao === 'não executada').length},
  resultados,
  limites: [
    'Nenhum documento, índice ou configuração alterado. Nenhum documento pessoal impresso.',
    'Projeção mínima de _id: a tela completa pode ter custo de FETCH diferente.',
    'Listagens limitadas a 20; dashboard sem limite. nReturned de agregação conta linhas/grupos, não o total do indicador.',
    'SORT indica ordenação bloqueante em memória, com possível uso de disco conforme ambiente; SORT_MERGE não equivale a SORT.',
    'COLLSCAN e índice não escolhido não são falhas automáticas com massa pequena.',
    'Métricas ausentes ficam null e precisam de inspeção do explain completo; não equivalem a zero.',
    'Planos vencedores sanitizados: estágios, índices e métricas preservados; filtros, limites e texto SBE omitidos.',
    'Consultas de moderação são avaliação técnica; não comprovam autorização de moderador ou da API.',
    'Sem benchmark antes/depois, garantia de desempenho, snapshot único ou validação pela equipe.'
  ]
};
// Retorna o objeto ao Playground Result, sem abreviar arrays no painel de saída.
sanitizarIdentificadores(relatorio);
