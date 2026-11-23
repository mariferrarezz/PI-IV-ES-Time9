import test from 'node:test';
import assert from 'node:assert/strict';
import { Types } from 'mongoose';

process.env.MONGODB_URI = 'mongodb://127.0.0.1:1/sentinela';
process.env.FIREBASE_PROJECT_ID = 'demo-plantacoes';
const { plantacoesService } = require('../src/modules/plantacoes/plantacoes.service') as typeof import('../src/modules/plantacoes/plantacoes.service');
const { authRepository } = require('../src/modules/auth/auth.repository') as typeof import('../src/modules/auth/auth.repository');
const { TalhaoModel } = require('../src/modules/talhoes/talhoes.model') as typeof import('../src/modules/talhoes/talhoes.model');
const { PropriedadeModel } = require('../src/modules/propriedades/propriedades.model') as typeof import('../src/modules/propriedades/propriedades.model');
const { PlantacaoModel } = require('../src/modules/plantacoes/plantacoes.model') as typeof import('../src/modules/plantacoes/plantacoes.model');
const { CulturaModel } = require('../src/modules/catalogo/culturas.model') as typeof import('../src/modules/catalogo/culturas.model');

test('listagem autorizada resolve nomes de culturas inclusive inativas', async t => {
  const usuario = new Types.ObjectId(), propriedade = new Types.ObjectId(), talhao = new Types.ObjectId(), cultura = new Types.ObjectId();
  const query = (valor: unknown) => ({session: () => ({lean: async () => valor})});
  t.mock.method(authRepository, 'buscarPorFirebaseUid', async () => ({_id: usuario}) as never);
  t.mock.method(TalhaoModel, 'findById', (() => query({propriedadeId: propriedade})) as never);
  t.mock.method(PropriedadeModel, 'findOne', ((filtro: any) => query(filtro.usuarioId.equals(usuario) ? {_id: propriedade} : null)) as never);
  t.mock.method(PlantacaoModel, 'find', (() => ({sort: () => ({lean: async () => [{talhaoId:talhao,culturaId:cultura,status:'ativa'}]})})) as never);
  t.mock.method(CulturaModel, 'find', ((filtro: any) => {
    assert(filtro._id.$in[0].equals(cultura));
    assert.equal(filtro.ativa, undefined);
    return {lean: async () => [{_id:cultura,nome:'Brócolis',ativa:false}]};
  }) as never);
  const resultado = await plantacoesService.listar('uid', String(talhao));
  assert.equal(resultado[0].culturaNome, 'Brócolis');
  assert.equal(String(resultado[0].culturaId), String(cultura));
});
