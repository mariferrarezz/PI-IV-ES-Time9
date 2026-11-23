import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { Types } from 'mongoose';

process.env.MONGODB_URI = 'mongodb://127.0.0.1:1/sentinela';
process.env.FIREBASE_PROJECT_ID = 'demo-sentinela';
const { criarApp } = require('../src/app') as typeof import('../src/app');
const { criarTalhoesService } = require('../src/modules/talhoes/talhoes.service') as typeof import('../src/modules/talhoes/talhoes.service');

test('HTTP encaminha nome vazio e área zero ao Java real sem gravar', async () => {
  const id = new Types.ObjectId(), dono = new Types.ObjectId();
  let gravou = false;
  const talhoes = {
    async listarPorPropriedade() { return []; },
    async comTransacao() { gravou = true; throw new Error('não deve gravar'); },
  } as unknown as import('../src/modules/talhoes/talhoes.repository').TalhoesRepository;
  const propriedades = { async buscarPorId() { return { _id: id, usuarioId: dono, ativa: true }; } } as unknown as import('../src/modules/propriedades/propriedades.repository').PropriedadesRepository;
  const service = criarTalhoesService(talhoes, propriedades, { async buscarPorFirebaseUid() { return { _id: dono }; } });
  const servidor = criarApp({ talhoesService: service, bancoDisponivel: () => true, verificarToken: async () => ({ uid: 'teste' }) }).listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  try {
    const port = (servidor.address() as import('node:net').AddressInfo).port;
    const resposta = await fetch(`http://127.0.0.1:${port}/propriedades/${id}/talhoes`, {
      method: 'POST', headers: { Authorization: 'Bearer teste', 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: '', areaHa: 0 }),
    });
    assert.equal(resposta.status, 400);
    const corpo = await resposta.json() as { detalhes: { mensagem: string }[] };
    assert.deepEqual(corpo.detalhes.map(d => d.mensagem), [
      'O nome do talhão é obrigatório.',
      'A área do talhão deve ser um número finito maior que zero.',
    ]);
    assert.equal(gravou, false);
  } finally {
    servidor.closeAllConnections();
    await new Promise<void>(resolve => servidor.close(() => resolve()));
  }
});
