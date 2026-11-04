'use strict';
// Testa hashes e carregamento dos três lotes apenas em memória, sem .env ou rede.
// As variantes de leitura não escrevem nem convertem os arquivos originais.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {textoLF, textoCRLF, confereHashTexto} = require('../seed/integridade-texto-bd6.cjs');
const principal = require('../seed/lib-bd6.cjs');
const complemento = require('../seed/lib-complemento-bd6.cjs');
const demo = require('../seed/adocoes-demonstracao-bd6/lib.cjs');
const hash = texto => crypto.createHash('sha256').update(texto).digest('hex');
const original = '{\n  "titulo": "Conteúdo preservado",\n  "id": "123"\n}\n';
for (const esperado of [hash(original), hash(textoCRLF(original))]) {
  for (const variante of [original, textoCRLF(original), original.replace('\n', '\r\n')]) {
    assert(confereHashTexto(Buffer.from(variante), esperado));
  }
  for (const alterado of [original.replace('preservado', 'alterado'), original.replace('123', '124'),
    original.replace('  ', ' '), original.trimEnd(), '\uFEFF' + original,
    original.replace('\n', '\r')]) assert(!confereHashTexto(alterado, esperado));
}
const ler = fs.readFileSync;
const raiz = path.resolve(__dirname, '../seed') + path.sep;
function comLeitura(transformar, executar) {
  fs.readFileSync = function(arquivo, opcoes) {
    const resultado = ler.apply(this, arguments);
    if (typeof arquivo !== 'string' || !path.resolve(arquivo).startsWith(raiz) || !arquivo.endsWith('.json')) return resultado;
    const texto = transformar(resultado.toString('utf8'), arquivo);
    return Buffer.isBuffer(resultado) ? Buffer.from(texto, 'utf8') : texto;
  };
  try { return executar(); } finally { fs.readFileSync = ler; }
}
const carregar = () => [principal.carregar().impressao, complemento.carregar().impressao, demo.carregar().impressao];
const esperado = carregar();
for (const converter of [textoLF, textoCRLF, texto => textoLF(texto).replace('\n', '\r\n')]) {
  assert.deepEqual(comLeitura(converter, carregar), esperado);
}
for (const arquivo of ['catalogo-completo-sentinela.json', 'documentos-sinteticos-bd6.json']) {
  // Espaço extra é alteração real de formatação: não deve passar pelo hash.
  assert.throws(() => comLeitura((texto, nome) => path.basename(nome) === arquivo ? texto + ' ' : texto, carregar));
}
assert.equal(fs.readFileSync, ler);
console.log(JSON.stringify({somenteLocal: true, aprovado: true,
  verificacoes: ['LF/CRLF/mistos aceitos nos três lotes com impressões estáveis',
    'conteúdo, IDs, espaços, BOM, linha final e CR isolado alterados rejeitados',
    'alterações reais nos arquivos protegidos interrompem o carregamento'],
  conexaoAtlas: false}, null, 2));
