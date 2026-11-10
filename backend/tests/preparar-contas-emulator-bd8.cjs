'use strict';
// Cria somente contas sintéticas no Auth Emulator; não usa MongoDB nem lê .env.
// Senhas chegam por stdin, permanecem em memória e nunca entram no relatório.
const PROJETO = 'projeto-integrador-4-8c129';
const CONTAS = [
  {uid: 'sentinela_bd6_v1_20261103_a', email: 'produtor.a.bd8@example.invalid'},
  {uid: 'sentinela_bd6_v1_20261103_b', email: 'produtor.b.bd8@example.invalid'},
  {uid: 'bd8_sem_perfil', email: 'sem.perfil.bd8@example.invalid'},
];

function conferirDestino(ambiente) {
  if (ambiente.FIREBASE_PROJECT_ID !== PROJETO ||
      ambiente.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099') {
    throw new Error('DESTINO_NAO_AUTORIZADO');
  }
}

async function buscarOuAusente(consulta) {
  try { return await consulta(); }
  catch (erro) {
    if (erro.code === 'auth/user-not-found') return null;
    throw erro;
  }
}

async function prepararContas(auth, senhas) {
  if (!Array.isArray(senhas) || senhas.length !== CONTAS.length ||
      senhas.some(senha => typeof senha !== 'string' || senha.length < 6)) {
    throw new Error('SENHAS_INVALIDAS');
  }
  const existentes = [];
  // Conferir todos os conflitos antes da primeira criação. Nunca atualizar contas.
  for (const conta of CONTAS) {
    const porUid = await buscarOuAusente(() => auth.getUser(conta.uid));
    const porEmail = await buscarOuAusente(() => auth.getUserByEmail(conta.email));
    if ((porUid && porUid.email !== conta.email) ||
        (porEmail && porEmail.uid !== conta.uid)) throw new Error('CONTA_EXISTENTE_DIVERGENTE');
    existentes.push(Boolean(porUid));
  }
  const resultados = [];
  for (const [indice, conta] of CONTAS.entries()) {
    if (!existentes[indice]) await auth.createUser({...conta, password: senhas[indice]});
    resultados.push({uid: conta.uid, estado: existentes[indice] ? 'preservada' : 'criada'});
  }
  return resultados;
}

async function executar() {
  let app;
  let etapa = 'destino';
  try {
    conferirDestino(process.env);
    if (process.argv.length !== 3 || process.argv[2] !== '--criar-no-emulator') {
      throw new Error('AUTORIZACAO_AUSENTE');
    }
    etapa = 'entrada_secreta';
    let entrada = '';
    for await (const parte of process.stdin) {
      entrada += parte.toString('utf8');
      if (entrada.length > 16384) throw new Error('ENTRADA_EXCESSIVA');
    }
    const senhas = JSON.parse(entrada.replace(/^\uFEFF/, ''));
    entrada = '';
    // O SDK só é inicializado depois do bloqueio de destino; sem credencial administrativa.
    const {initializeApp, deleteApp} = require('firebase-admin/app');
    const {getAuth} = require('firebase-admin/auth');
    app = initializeApp({projectId: PROJETO}, 'bd8-contas-emulator');
    etapa = 'conferencia_e_criacao';
    try {
      const contas = await prepararContas(getAuth(app), senhas);
      console.log(JSON.stringify({projeto: PROJETO, somenteEmulator: true, contas}, null, 2));
    } finally {
      senhas.fill(null);
      await deleteApp(app);
    }
  } catch {
    // Não imprimir objetos ou mensagens do SDK: podem conter valores recebidos.
    console.error(JSON.stringify({aprovado: false, etapa, codigo: 'PREPARACAO_NAO_CONCLUIDA',
      orientacao: 'Confira o destino e as contas no Emulator antes de repetir; pode haver criação parcial.'}));
    process.exitCode = 1;
  }
}

module.exports = {conferirDestino, prepararContas};
if (require.main === module) executar();
