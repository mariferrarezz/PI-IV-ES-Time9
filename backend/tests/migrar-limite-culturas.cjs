// Remove somente maxItems do questionário; sem --apply, apenas inspeciona.
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('node:fs');
const path = require('node:path');
async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sentinela', serverSelectionTimeoutMS: 5000 });
  try {
    const db = mongoose.connection.db;
    const info = await db.listCollections({ name: 'usuarios' }).next();
    const validator = info?.options?.validator;
    const culturas = validator?.$jsonSchema?.properties?.questionario?.properties?.culturasIds;
    if (!culturas || (culturas.maxItems !== undefined && Number(culturas.maxItems) !== 50)) throw Error('Validador diferente do esperado; nenhuma alteração feita.');
    if (culturas.maxItems === undefined) { console.log('Validador já está sem limite de culturas.'); return; }
    if (!process.argv.includes('--apply')) { console.log('Limite atual: 50; execute com --apply para remover somente maxItems.'); return; }
    const pasta = path.resolve(__dirname, '../../backups-sentinela');
    fs.mkdirSync(pasta, { recursive: true });
    const destino = path.join(pasta, `validator-usuarios-${new Date().toISOString().replace(/[:.]/g, '-')}.ejson`);
    fs.writeFileSync(destino, mongoose.mongo.BSON.EJSON.stringify(info.options, { relaxed: false }), { flag: 'wx', mode: 0o600 });
    delete culturas.maxItems;
    await db.command({ collMod: 'usuarios', validator, validationLevel: info.options.validationLevel, validationAction: info.options.validationAction });
    const atual = await db.listCollections({ name: 'usuarios' }).next();
    if (atual.options.validator.$jsonSchema.properties.questionario.properties.culturasIds.maxItems !== undefined) throw Error('Falha ao confirmar alteração do validador.');
    console.log(`Limite removido. Backup das opções: ${destino}`);
  } finally { await mongoose.disconnect(); }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
