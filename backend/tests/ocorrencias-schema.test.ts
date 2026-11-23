import test from 'node:test';
import assert from 'node:assert/strict';
import { ocorrenciaEntradaSchema } from '../src/modules/ocorrencias/ocorrencias.schema';

test('ocorrência preserva valores inválidos para as mensagens do Java', () => {
  const dados = ocorrenciaEntradaSchema.parse({ tipo: 'nao_identificado', dataObservacao: '2026-11-01T03:00:00Z', sintomas: '', intensidade: 'alta', areaAfetadaHa: 0 });
  assert.equal(dados.sintomas, '');
  assert.equal(dados.areaAfetadaHa, 0);
  assert.equal(dados.dataObservacao.toISOString(), '2026-11-01T03:00:00.000Z');
});

test('ocorrência rejeita autor e status definidos pelo cliente e datas sem fuso', () => {
  const base = { tipo: 'praga', dataObservacao: '2026-11-01T03:00:00Z', sintomas: 'Manchas', intensidade: 'baixa' };
  for (const dados of [ { ...base, registradoPor: '507f1f77bcf86cd799439011' }, { ...base, status: 'encerrada' }, { ...base, dataObservacao: '2026-11-01' } ]) {
    assert.equal(ocorrenciaEntradaSchema.safeParse(dados).success, false);
  }
});
