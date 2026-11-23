// Consulta apenas; não imprime valores pessoais nem altera registros.
require('dotenv').config();
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const crypto = require('node:crypto');
process.env.JAVA_PORT = '17001';
async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sentinela' });
  const { criarApp } = require('../src/app');
  const perfil = await mongoose.connection.collection('usuarios').findOne({ telefone: /^\+55(?:11|19)9\d{8}$/ }, { projection: { cpf: 1, telefone: 1 } });
  assert.ok(perfil, 'Não há usuário de teste com DDD esperado');
  const uidTeste = `auditoria-${crypto.randomBytes(12).toString('hex')}`;
  const server = criarApp({ bancoDisponivel: () => true, verificarToken: async () => ({ uid: uidTeste }) }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    for (const [campo, valor, codigo] of [['cpf', perfil.cpf, 'CPF_JA_CADASTRADO'], ['telefone', perfil.telefone, 'TELEFONE_JA_CADASTRADO']]) {
      const r = await fetch(`http://127.0.0.1:${server.address().port}/validacao-cadastro/${campo}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ valor }) });
      const resposta = await r.json();
      assert.equal(r.status, 409);
      assert.equal(resposta.codigo, codigo);
    }
    console.log('CPF e telefone existentes recusados por HTTP com Java e MongoDB reais.');
    const numero = n => Array.from(crypto.randomBytes(n), b => String(b % 10)).join('');
    let cpf, telefone;
    do { cpf = numero(11); } while (await mongoose.connection.collection('usuarios').findOne({ cpf }));
    do { telefone = `119${numero(8)}`; } while (await mongoose.connection.collection('usuarios').findOne({ telefone: `+55${telefone}` }));
    for (const [campo, valor] of [['cpf', cpf], ['telefone', telefone]]) {
      const r = await fetch(`http://127.0.0.1:${server.address().port}/validacao-cadastro/${campo}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ valor }) });
      assert.equal(r.status, 200);
    }
    const tentativa = await fetch(`http://127.0.0.1:${server.address().port}/auth/cadastro`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-simulado' }, body: JSON.stringify({ nomeCompleto: 'Teste Sintético', cpf, telefone, canalCodigoPreferido: 'email', aceitouTermos: true }) });
    const erro = await tentativa.json();
    assert.equal(tentativa.status, 503);
    assert.equal(erro.codigo, 'INDICES_USUARIO_INDISPONIVEIS');
    assert.equal(await mongoose.connection.collection('usuarios').findOne({ firebaseUid: uidTeste }), null);
    console.log('Valores disponíveis passam pela pré-validação; cadastro permanece bloqueado por ausência dos índices. Autenticação simulada.');
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
  }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
