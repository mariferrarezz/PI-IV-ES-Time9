import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:1/sentinela';
process.env.FIREBASE_PROJECT_ID = 'demo-sentinela';
process.env.JAVA_PORT ||= '17000';
const { criarApp } = require('../src/app') as typeof import('../src/app');

test('pré-cadastro valida no Java real e verifica disponibilidade no repositório simulado', async () => {
  let verificacoes = 0;
  const repo = { existeOutroComCampo: async (campo: string, valor: string) => (campo === 'cpf' && valor === '22222222222') || (campo === 'telefone' && valor === '+5511987654321') } as unknown as import('../src/modules/auth/auth.repository').AuthRepository;
  const server = criarApp({ bancoDisponivel: () => false, validacaoCadastroRepo: repo, verificarToken: async () => { verificacoes++; throw new Error('inesperado'); } }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const port = (server.address() as import('node:net').AddressInfo).port;
    for (const [campo, valor, status, mensagem] of [
      ['cpf', '1111111111', 400, 'O CPF deve conter exatamente 11 dígitos.'],
      ['cpf', '111111111111', 400, 'O CPF deve conter exatamente 11 dígitos.'],
      ['cpf', '11111111111', 200, ''],
      ['cpf', '22222222222', 409, ''],
      ['cpf', '52998224725', 200, ''],
      ['telefone', '00999999999', 400, 'O DDD do telefone deve ser um código brasileiro válido.'],
      ['telefone', '11333333333', 400, 'O telefone deve estar no formato +55DD9XXXXXXXX, sem separadores.'],
      ['telefone', '11987654321', 409, ''],
      ['telefone', '11987654322', 200, ''],
    ] as const) {
      const r = await fetch(`http://127.0.0.1:${port}/validacao-cadastro/${campo}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ valor }) });
      assert.equal(r.status, status);
      const resposta = await r.json() as { detalhes?: { mensagem: string }[], valido?: boolean };
      if (status === 400) assert.deepEqual(resposta.detalhes?.map(d => d.mensagem), [mensagem]);
      else if (status === 200) assert.equal(resposta.valido, true);
    }
    assert.equal(verificacoes, 0);
    assert.equal((await fetch(`http://127.0.0.1:${port}/auth/me`)).status, 401);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
