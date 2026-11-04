'use strict';
// Compara textos UTF-8 preservando conteúdo e tolerando somente CRLF/LF.
// Não remove espaços, BOM, linhas finais ou diferenças de formatação JSON.
const crypto = require('node:crypto');
const hash = texto => crypto.createHash('sha256').update(texto).digest('hex');
const textoLF = texto => texto.toString('utf8').replace(/\r\n/g, '\n');
const textoCRLF = texto => textoLF(texto).replace(/\n/g, '\r\n');
function confereHashTexto(texto, esperado) {
  return [hash(textoLF(texto)), hash(textoCRLF(texto))].includes(esperado);
}
module.exports = {textoLF, textoCRLF, confereHashTexto};
