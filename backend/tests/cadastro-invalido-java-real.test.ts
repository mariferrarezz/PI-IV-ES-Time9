import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { Types } from 'mongoose';

process.env.MONGODB_URI = 'mongodb://127.0.0.1:1/sentinela';
process.env.FIREBASE_PROJECT_ID = 'demo-sentinela';
const { criarApp } = require('../src/app') as typeof import('../src/app');
const { criarAuthService } = require('../src/modules/auth/auth.service') as typeof import('../src/modules/auth/auth.service');

test('cadastro encaminha CPF e telefone inválidos ao Java real', async () => {
  let gravacoes = 0;
  const perfil = { _id: new Types.ObjectId(), firebaseUid: 'existente', nomeCompleto: 'Maria Silva', cpf: '52998224725', telefone: '+5511999990000', canalCodigoPreferido: 'email' };
  const repo = {
    async buscarPorFirebaseUid(uid: string) { return uid === 'existente' ? perfil : null; },
    async criar() { gravacoes++; throw new Error('não deve gravar'); },
  } as unknown as import('../src/modules/auth/auth.repository').AuthRepository;
  const service = criarAuthService(repo);
  const server = criarApp({ auth: service, bancoDisponivel: () => true, verificarToken: async token => ({ uid: token }) }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const port = (server.address() as import('node:net').AddressInfo).port;
    const dados = { nomeCompleto: 'Maria Silva', cpf: '111.111.111-1', telefone: '(20) 99999-9999' };
    for (const [metodo, rota, uid, corpo] of [
      ['POST', '/auth/cadastro', 'novo', { ...dados, canalCodigoPreferido: 'email', aceitouTermos: true }],
    ] as const) {
      const resposta = await fetch(`http://127.0.0.1:${port}${rota}`, { method: metodo, headers: { Authorization: `Bearer ${uid}`, 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
      assert.equal(resposta.status, 400);
      const body = await resposta.json() as { detalhes: { mensagem: string }[] };
      assert.deepEqual(body.detalhes.map(d => d.mensagem), [
        'O CPF deve conter exatamente 11 dígitos.',
        'O DDD do telefone deve ser um código brasileiro válido.',
      ]);
    }
    assert.equal(gravacoes, 0);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
