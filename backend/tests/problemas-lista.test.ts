import test from 'node:test';
import assert from 'node:assert/strict';
import { Types } from 'mongoose';
import { criarProblemasService } from '../src/modules/catalogo/problemas.service';

test('lista somente os dados públicos fornecidos pela consulta da cultura ativa', async () => {
  const cultura = new Types.ObjectId(), problema = new Types.ObjectId();
  const service = criarProblemasService({
    async culturaAtiva(id) { return id.equals(cultura); },
    async listarPorCultura(id) {
      assert(id.equals(cultura));
      return [{ _id: problema, nomeComum: 'Exemplo', tipo: 'praga' }];
    },
  });
  assert.deepEqual(await service.listar(String(cultura)), [{ id: String(problema), nome: 'Exemplo', tipo: 'praga' }]);
  await assert.rejects(service.listar(String(new Types.ObjectId())), (erro: any) => erro.statusCode === 404);
  await assert.rejects(service.listar('inválido'), (erro: any) => erro.statusCode === 400);
});
