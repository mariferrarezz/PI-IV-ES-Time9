'use strict';
// Erros sintéticos em memória; nenhum segredo real, .env ou acesso ao banco.
const assert = require('node:assert/strict');
const {relatorio} = require('../seed/diagnostico-bd6.cjs');
const {executarCLI} = require('../seed/bd6.cjs');
const segredoFicticio = 'SEGREDO_FICTICIO_NAO_EXIBIR';
const mensagem = 'mongodb://usuario:' + segredoFicticio + '@host.test/banco';
const contexto = {etapa: 'conectar_mongodb', ambiente: {origemUri: 'backend/.env'}};
const erro = (name, code) => Object.assign(new Error(mensagem), {name, code});
const casos = [
  [erro('MongoParseError'), 'configuracao_do_cliente'],
  [erro('Error', 'ENOENT'), 'arquivo_ou_dependencia_ausente'],
  [erro('Error', 'MODULE_NOT_FOUND'), 'arquivo_ou_dependencia_ausente'],
  [erro('Error', 'ENOTFOUND'), 'dns'],
  [erro('Error', 'ECONNREFUSED'), 'rede_ou_selecao_de_servidor'],
  [Object.assign(erro('Error', 'ECONNREFUSED'), {syscall: 'querySrv'}), 'dns'],
  [erro('MongoServerError', 18), 'autenticacao'],
  [erro('MongoServerError', 13), 'permissao'],
  [erro('MongoServerError', 8000), 'atlas_codigo_8000_causa_nao_determinada'],
];
for (const [e, esperado] of casos) {
  const r = relatorio(e, contexto); assert.equal(r.categoria, esperado);
  assert(!JSON.stringify(r).includes(segredoFicticio)); assert(!JSON.stringify(r).includes('mongodb://'));
}
const rede = erro('MongoServerSelectionError');
rede.reason = {servers: new Map([['host_nao_retornado', {error: Object.assign(erro('MongoNetworkError'), {cause: erro('Error', 'ENOTFOUND')})}]])};
assert.equal(relatorio(rede, contexto).categoria, 'dns');
assert(!JSON.stringify(relatorio(rede, contexto)).includes('host_nao_retornado'));
const malformado = erro(mensagem, mensagem); malformado.codigoSeguro = mensagem;
assert(!JSON.stringify(relatorio(malformado, contexto)).includes('mongodb://'));
// Ciclos na cadeia de causas não geram laço infinito nem revelam objetos.
rede.cause = rede; assert(relatorio(rede, contexto).causasSeguras.length < 25);
(async () => {
  const anterior = console.error, codigoAnterior = process.exitCode; let capturado = '';
  try {
    console.error = texto => {capturado += texto;};
    await executarCLI(['adocoes', 'conferir'], () => {throw erro('Error', 'MODULE_NOT_FOUND');});
    assert.equal(JSON.parse(capturado).etapa, 'carregar_modulo_cli');
    assert(!capturado.includes('Argumentos inválidos')); assert(!capturado.includes(segredoFicticio));
    capturado = '';
    await executarCLI(['adocoes', 'conferir'], () => ({executar: async () => {throw erro('MongoParseError');}}));
    assert.equal(JSON.parse(capturado).etapa, 'executar_comando');
    assert(!capturado.includes(segredoFicticio));
  } finally {console.error = anterior; process.exitCode = codigoAnterior;}
  console.log(JSON.stringify({somenteLocal: true, aprovado: true, classificacoes: casos.length,
    causasAninhadas: true, cliSeparaArgumentosDeFalhas: true, mascaramento: true, conexaoAtlas: false}));
})().catch(() => {console.error('Falha no teste local de diagnostico.'); process.exitCode = 1;});
