'use strict';
// Apenas parser/ajuda; não carregar bibliotecas de banco, .env ou rede.
const assert = require('node:assert/strict');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {analisar} = require('../seed/bd6.cjs');
for (const lote of ['principal', 'comunidade', 'adocoes']) {
  assert.equal(analisar([lote, 'conferir']).modo, 'pre-conferir');
  assert.equal(analisar([lote, 'validar']).modo, 'validar');
  assert.equal(analisar([lote, 'inserir', '--aplicar']).modo, lote === 'adocoes' ? 'aplicar' : 'inserir');
}
for (const args of [[], ['isolado', 'inserir'], ['principal', 'apagar'], ['principal', 'validar', '--aplicar'],
  ['principal', 'inserir', '--banco=outro'], ['adocoes', 'conferir', '--aplicar']]) assert.throws(() => analisar(args));
const cli = path.join(__dirname, '../seed/bd6.cjs');
const ajuda = spawnSync(process.execPath, [cli, '--ajuda'], {encoding: 'utf8'});
assert.equal(ajuda.status, 0); assert(ajuda.stdout.includes('Uso:')); assert(!ajuda.stderr);
const errado = spawnSync(process.execPath, [cli, 'principal', 'validar', '--aplicar'], {encoding: 'utf8'});
assert.equal(errado.status, 1); assert(errado.stderr.includes('Uso:'));
console.log(JSON.stringify({somenteLocal: true, aprovado: true, lotes: 3, parserEGuardaDeEscrita: true, rede: false}));
