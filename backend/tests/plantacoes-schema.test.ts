import test from 'node:test';
import assert from 'node:assert/strict';
import { plantacaoEntradaSchema } from '../src/modules/plantacoes/plantacoes.schema';

test('plantação aceita área zero para que o Java produza o erro e preserva data UTC', () => {
  const dados = plantacaoEntradaSchema.parse({ culturaId: '507f1f77bcf86cd799439011', status: 'ativa', areaPlantadaHa: 0, dataPlantio: '2018-01-15T02:00:00.000Z' });
  assert.equal(dados.areaPlantadaHa, 0);
  assert.equal(dados.dataPlantio?.toISOString(), '2018-01-15T02:00:00.000Z');
});

test('plantação recusa referências malformadas, datas sem fuso e campos protegidos', () => {
  const base = { culturaId: '507f1f77bcf86cd799439011', status: 'ativa' };
  for (const dados of [
    { ...base, culturaId: 'inválido' },
    { ...base, dataPlantio: '2026-11-22' },
    { ...base, talhaoId: '507f1f77bcf86cd799439011' },
    { ...base, areaPlantadaHa: '0' },
  ]) assert.equal(plantacaoEntradaSchema.safeParse(dados).success, false);
});
