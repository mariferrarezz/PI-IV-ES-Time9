'use strict';
// Comando único para conferir, inserir ou validar os lotes principal, Comunidade e adoções.
// Ajuda e argumentos inválidos não carregam credenciais nem conectam ao banco.
const LOTES = {
  principal: {modulo: './lib-bd6.cjs', inserir: 'inserir'},
  comunidade: {modulo: './lib-complemento-bd6.cjs', inserir: 'inserir'},
  adocoes: {modulo: './adocoes-demonstracao-bd6/lib.cjs', inserir: 'aplicar'},
};
const AJUDA = 'Uso: node database/seed/bd6.cjs <principal|comunidade|adocoes> <conferir|inserir|validar> [--aplicar]\n' +
  'Destino: sentinela de desenvolvimento. Conferir/validar são somente leitura.\n' +
  'Inserir só escreve com --aplicar; sem a opção, somente confere.\n' +
  'adocoes altera explicitamente uma ficha existente e insere oito documentos, em transação.\n' +
  'Ajuda: node database/seed/bd6.cjs --ajuda';
function analisar(args) {
  if (args.length === 1 && ['--ajuda', '--help', '-h'].includes(args[0])) return {ajuda: true};
  const [lote, acao, ...opcoes] = args;
  if (!Object.hasOwn(LOTES, lote) || !['conferir', 'inserir', 'validar'].includes(acao) ||
      opcoes.length > 1 || opcoes.some(o => o !== '--aplicar') || opcoes.length && acao !== 'inserir') throw new Error('argumentos_invalidos');
  return {lote, modo: acao === 'conferir' ? 'pre-conferir' : acao === 'inserir' ? LOTES[lote].inserir : 'validar'};
}
async function executarCLI(args, carregar = nome => require(nome)) {
  let comando;
  try {
    comando = analisar(args);
  } catch {
    console.error('Argumentos inválidos.\n' + AJUDA); process.exitCode = 1; return;
  }
  if (comando.ajuda) { console.log(AJUDA); return; }
  let etapa = 'carregar_modulo_cli';
  try {
    const modulo = carregar(LOTES[comando.lote].modulo);
    etapa = 'executar_comando';
    await modulo.executar(comando.modo);
  } catch (e) {
    console.error(JSON.stringify(require('./diagnostico-bd6.cjs').relatorio(e, {etapa, lote: comando.lote, modo: comando.modo}), null, 2));
    process.exitCode = 1;
  }
}
if (require.main === module) executarCLI(process.argv.slice(2));
module.exports = {analisar, executarCLI};
