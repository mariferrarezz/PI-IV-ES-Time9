'use strict';
// Reconhece os estados exatos anterior e simulado da ficha de Lagarta-do-cartucho.
// Permite conferir a exceção acadêmica sem reescrever os snapshots históricos.
const fs = require('node:fs');
const path = require('node:path');
module.exports = async function visaoEditorial(db, p, session, api) {
  const arquivo = path.join(__dirname, 'adocoes-demonstracao-bd6/alteracao-ficha.json');
  if (!fs.existsSync(arquivo)) return p;
  const estado = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  const alvo = p.dados.problemas_agricolas?.find(d => d._id.$oid === estado.antes._id.$oid);
  if (!alvo) return p;
  const {igual, bson, errosSchema} = api;
  function falhar() { const e = new Error('excecao_editorial_incompativel'); e.codigoSeguro = 'excecao_editorial_incompativel'; throw e; }
  if (estado.banco !== 'sentinela' || ![estado.antes, estado.depois].some(d => igual(bson(d), bson(alvo))) ||
      estado.depois._id.$oid !== estado.antes._id.$oid || estado.depois.ativo !== true ||
      estado.depois.revisaoEditorial.status !== 'aprovada' ||
      !estado.depois.revisaoEditorial.observacoes.includes('SEM revisao agronomica real') ||
      errosSchema(estado.depois, p.configs.problemas_agricolas.validator.$jsonSchema).length) falhar();
  const mutaveis = new Set(['ativo', 'revisaoEditorial', 'revisadoEm', 'atualizadoEm']);
  for (const k of new Set([...Object.keys(estado.antes), ...Object.keys(estado.depois)])) {
    if (!mutaveis.has(k) && !igual(estado.antes[k], estado.depois[k])) falhar();
  }
  const revisaoEsperada = {...estado.antes.revisaoEditorial, status: 'aprovada', observacoes: estado.depois.revisaoEditorial.observacoes};
  if (!igual(estado.depois.revisaoEditorial, revisaoEsperada) ||
      !igual(estado.depois.revisadoEm, {$date: estado.momentoSimulado}) ||
      !igual(estado.depois.atualizadoEm, estado.depois.revisadoEm)) falhar();
  const atual = await db.collection('problemas_agricolas').findOne({_id: bson(estado.antes._id)}, {session});
  const aplicada = atual && igual(atual, bson(estado.depois));
  const esperado = aplicada ? estado.depois : estado.antes;
  // Qualquer terceiro estado permanece divergente: nunca aceitar só status/data.
  const dados = {...p.dados, problemas_agricolas: p.dados.problemas_agricolas.map(d => d === alvo ? esperado : d)};
  const porId = new Map(p.porId || []);
  porId.set(esperado._id.$oid, {col: 'problemas_agricolas', doc: esperado});
  return {...p, dados, porId, demonstracaoEditorial: aplicada ? 'aprovacao_simulada_exata' : 'snapshot_original_pendente'};
};
