use('sentinela');
const bancoDestino = 'sentinela'; // Para reprodu??o isolada: 'sentinela_testes_bd5'.
const aplicar = false;
if (!['sentinela', 'sentinela_testes_bd5'].includes(bancoDestino)) throw new Error('Banco n?o permitido.');
const alvo = db.getSiblingDB(bancoDestino);
const colecoes = ['usuarios', 'propriedades', 'talhoes', 'culturas', 'plantacoes', 'problemas_agricolas', 'fontes_conhecimento', 'ocorrencias', 'monitoramentos', 'tratamentos', 'avaliacoes_tratamento', 'alertas', 'experiencias_comunidade', 'adocoes_tratamento', 'denuncias_comunidade'];

const conferencias = colecoes.map(nome => {
  const info = alvo.getCollectionInfos({name: nome})[0];
  return {colecao: nome, situacao: !info ? 'ausente' : info.type === 'collection' ? 'existente; preservar' : 'conflito de tipo'};
});
const conflitos = conferencias.filter(c => c.situacao === 'conflito de tipo');
const criadas = [];
if (aplicar && !conflitos.length) {
  // Nunca exclui, recria ou modifica uma cole??o existente.
  for (const item of conferencias.filter(c => c.situacao === 'ausente')) {
    const r = alvo.createCollection(item.colecao);
    if (!r || Number(r.ok) !== 1) throw new Error('Cria??o interrompida; conferir cole??es existentes antes de repetir.');
    criadas.push(item.colecao);
  }
}
({banco: bancoDestino, modo: aplicar ? 'aplica??o' : 'somente leitura',
  bloqueado: conflitos.length > 0, conferencias, criadas,
  colecoesApos: alvo.getCollectionInfos().map(c => ({nome: c.name, tipo: c.type})),
  observacao: 'Cole??es novas ficam sem validator at? a etapa seguinte. N?o inserir documentos entre as etapas.'});
