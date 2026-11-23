// Obsoleto: não alterar o validador para incluir questionarioConcluido.
throw new Error('Migração desativada: questionarioConcluido não integra o contrato.');
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('node:fs');
const path = require('node:path');
async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {dbName:'sentinela', serverSelectionTimeoutMS:5000});
  try {
    const db = mongoose.connection.db;
    const info = await db.listCollections({name:'usuarios'}).next();
    const options = info?.options;
    const properties = options?.validator?.$jsonSchema?.properties;
    if (!properties) throw Error('Validador inesperado; nenhuma alteração feita.');
    if (properties.questionarioConcluido?.bsonType === 'bool') { console.log('Validador já permite o campo.'); return; }
    if (properties.questionarioConcluido) throw Error('O campo possui validador diferente; nenhuma alteração feita.');
    if (!process.argv.includes('--apply')) { console.log('Validador ainda não permite questionarioConcluido.'); return; }
    const pasta = path.resolve(__dirname, '../../backups-sentinela');
    fs.mkdirSync(pasta,{recursive:true});
    const destino = path.join(pasta,`validator-onboarding-${new Date().toISOString().replace(/[:.]/g,'-')}.ejson`);
    const original = mongoose.mongo.BSON.EJSON.stringify(options,{relaxed:false});
    fs.writeFileSync(destino,original,{flag:'wx',mode:0o600});
    if (fs.readFileSync(destino,'utf8') !== original) throw Error('Backup do validador não confere.');
    properties.questionarioConcluido = {bsonType:'bool'};
    const comando = {collMod:'usuarios',validator:options.validator};
    if (options.validationLevel) comando.validationLevel = options.validationLevel;
    if (options.validationAction) comando.validationAction = options.validationAction;
    await db.command(comando);
    console.log(`Validador atualizado; backup: ${destino}`);
  } finally { await mongoose.disconnect(); }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
