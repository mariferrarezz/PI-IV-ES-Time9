'use strict';
// Gerador LOCAL. Não lê .env, não acessa extensão e não conecta ao MongoDB.
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const backend = createRequire(path.resolve(__dirname, '../../../backend/package.json'));
const {EJSON} = backend('mongoose').mongo.BSON;
const p = require('./lib.cjs').carregar();
const snapshot = EJSON.serialize({configs: p.configs, indices: p.indices, dados: p.dados, impressao: p.impressao}, {relaxed: false});
const cabecalho = "// SOMENTE LEITURA. Executar por Run All na conexão ativa da extensão MongoDB.\n" +
  "// Snapshot completo dos 15 validadores, 22 índices e 22 documentos sintéticos.\n" +
  "// Gerado localmente; sincronizar com gerar-conferencia-playground.cjs se as origens mudarem.\n" +
  "// Não carrega .env, credenciais da extensão, arquivos locais ou outro banco.\n" +
  "use('sentinela_testes_bd6');\n\nconst snapshotEjson = ";
fs.writeFileSync(path.join(__dirname, 'conferir-configuracao.mongodb.js'), cabecalho + JSON.stringify(snapshot, null, 2) +
  ';\nconst pacote = EJSON.deserialize(snapshotEjson);\n\n' + fs.readFileSync(path.join(__dirname, 'conferencia-playground.inc.js'), 'utf8'));
console.log(JSON.stringify({geradoLocalmente: true, arquivo: 'conferir-configuracao.mongodb.js', banco: 'sentinela_testes_bd6', impressao: p.impressao}));
