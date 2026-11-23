// Backup local de todas as coleções (grava em backups-sentinela/, fora do Git); não remove dados.
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sentinela', serverSelectionTimeoutMS: 5000 });
  const db = mongoose.connection.db;
  const colecoes = {};
  for (const { name } of await db.listCollections({}, { nameOnly: true }).toArray()) {
    if (!name.startsWith('system.')) colecoes[name] = await db.collection(name).find({}).toArray();
  }
  const pasta = path.resolve(__dirname, '../../backups-sentinela');
  fs.mkdirSync(pasta, { recursive: true, mode: 0o700 });
  const nome = `backup-sentinela-${new Date().toISOString().replace(/[:.]/g, '-')}.ejson`;
  const destino = path.join(pasta, nome);
  const texto = mongoose.mongo.BSON.EJSON.stringify({ versao: 1, criadoEm: new Date(), database: 'sentinela', colecoes }, { relaxed: false });
  fs.writeFileSync(destino, texto, { flag: 'wx', mode: 0o600 });
  const lido = fs.readFileSync(destino, 'utf8');
  if (lido !== texto) throw new Error('Falha na verificação do backup.');
  const restaurado = mongoose.mongo.BSON.EJSON.parse(lido, { relaxed: false });
  for (const nomeColecao of Object.keys(colecoes)) if (restaurado.colecoes[nomeColecao].length !== colecoes[nomeColecao].length) throw new Error('Contagem divergente no backup.');
  console.log(JSON.stringify({ caminho: destino, sha256: crypto.createHash('sha256').update(lido).digest('hex'), colecoes: Object.fromEntries(Object.entries(colecoes).map(([k,v]) => [k,v.length])) }));
  await mongoose.disconnect();
}
main().catch(async e => { console.error(e.message); await mongoose.disconnect(); process.exitCode = 1; });
