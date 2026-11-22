'use strict';
// Extrai somente etapas, classes e códigos permitidos; nunca retorna message, stack ou URI.
// Compartilhado pelo CLI e pela demonstração, sem carregar ambiente ou conectar.
const CLASSES = new Set(['Error', 'TypeError', 'SyntaxError', 'AssertionError', 'MongoParseError', 'MongoAPIError',
  'MongoInvalidArgumentError', 'MongoServerSelectionError', 'MongoNetworkError', 'MongoNetworkTimeoutError',
  'MongoServerError', 'MongoTopologyClosedError', 'MongoOperationTimeoutError', 'MongoNotConnectedError']);
const CODIGOS = new Set(['ENOENT', 'EACCES', 'EPERM', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ECONNRESET',
  'ETIMEDOUT', 'ENETUNREACH', 'EHOSTUNREACH', 'ETIMEOUT', 'ENODATA', 'ESERVFAIL', 'EREFUSED', 'ECANCELLED',
  'ERR_INVALID_ARG_TYPE', 'ERR_INVALID_URL', 'ERR_ASSERTION', 'MODULE_NOT_FOUND', 'ERR_MODULE_NOT_FOUND',
  'CERT_HAS_EXPIRED', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'ERR_TLS_CERT_ALTNAME_INVALID']);
function codigosSeguros(erro) {
  const fila = [erro], visitados = new Set(), saida = [];
  while (fila.length && visitados.size < 24) {
    const e = fila.shift(); if (!e || typeof e !== 'object' || visitados.has(e)) continue;
    visitados.add(e);
    const classe = CLASSES.has(e.name) ? e.name : undefined;
    const codigo = typeof e.code === 'string' && CODIGOS.has(e.code) ? e.code : undefined;
    const codigoMongoDB = Number.isSafeInteger(e.code) ? e.code : undefined;
    const operacaoRede = ['querySrv', 'queryTxt', 'getaddrinfo', 'connect', 'read', 'write'].includes(e.syscall) ? e.syscall : undefined;
    if (classe || codigo || codigoMongoDB !== undefined) saida.push({classe, codigo, codigoMongoDB, operacaoRede});
    fila.push(e.cause, e.reason);
    if (e.servers instanceof Map) for (const s of e.servers.values()) fila.push(s?.error);
  }
  return saida;
}
function relatorio(erro, contexto) {
  const causas = codigosSeguros(erro);
  const codigos = causas.map(c => c.codigo).filter(Boolean), numeros = causas.map(c => c.codigoMongoDB);
  const classes = causas.map(c => c.classe);
  let categoria = 'nao_classificada';
  if (classes.includes('MongoParseError') || classes.includes('MongoInvalidArgumentError')) categoria = 'configuracao_do_cliente';
  else if (codigos.some(c => ['MODULE_NOT_FOUND', 'ERR_MODULE_NOT_FOUND', 'ENOENT'].includes(c))) categoria = 'arquivo_ou_dependencia_ausente';
  else if (causas.some(c => ['querySrv', 'queryTxt', 'getaddrinfo'].includes(c.operacaoRede)) || codigos.some(c => ['ENOTFOUND', 'EAI_AGAIN', 'ENODATA', 'ESERVFAIL', 'EREFUSED'].includes(c))) categoria = 'dns';
  else if (numeros.includes(18)) categoria = 'autenticacao';
  else if (numeros.includes(13)) categoria = 'permissao';
  else if (numeros.includes(8000)) categoria = 'atlas_codigo_8000_causa_nao_determinada';
  else if (codigos.some(c => ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ETIMEOUT', 'ENETUNREACH', 'EHOSTUNREACH'].includes(c)) || classes.some(c => ['MongoServerSelectionError', 'MongoNetworkError', 'MongoNetworkTimeoutError'].includes(c))) categoria = 'rede_ou_selecao_de_servidor';
  const codigoSeguro = typeof erro?.codigoSeguro === 'string' && /^[a-zA-Z0-9_]{1,100}$/.test(erro.codigoSeguro) ? erro.codigoSeguro : 'erro_mongodb_ou_ambiente';
  return {aprovado: false, ...contexto, codigo: codigoSeguro, categoria, causasSeguras: causas,
    orientacao: 'Interromper e analisar a etapa/codigos. Nao alterar credenciais ou permissoes automaticamente. Em commit incerto, validar antes de repetir.'};
}
module.exports = {codigosSeguros, relatorio};
