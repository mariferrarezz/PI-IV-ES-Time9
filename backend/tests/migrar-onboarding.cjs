// Obsoleto: a conclusão usa somente questionario.concluidoEm. Não executar migração.
throw new Error('Migração desativada: questionarioConcluido não integra o contrato.');
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('node:fs');
const path = require('node:path');
async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {dbName:'sentinela', serverSelectionTimeoutMS:5000});
  try {
    const db = mongoose.connection.db;
    const col = db.collection('usuarios');
    const usuarios = await col.find({}).toArray();
    const resumo = {total:usuarios.length, concluidos:0, pendentes:0, parciais:0, alteracoes:0};
    for (const usuario of usuarios) {
      const data = usuario.questionario?.concluidoEm;
      const concluido = data instanceof Date && !Number.isNaN(data.getTime());
      if (concluido) resumo.concluidos++; else { resumo.pendentes++; if (usuario.questionario) resumo.parciais++; }
      if (usuario.questionarioConcluido !== concluido) resumo.alteracoes++;
    }
    console.log(JSON.stringify({auditoria:resumo}));
    if (!process.argv.includes('--apply')) return;
    const info = await db.listCollections({name:'usuarios'}).next();
    if (info?.options?.validator?.$jsonSchema?.properties?.questionarioConcluido?.bsonType !== 'bool') throw Error('Validador MongoDB não permite questionarioConcluido; aplique o validador atualizado antes da migração.');
    const pasta = path.resolve(__dirname, '../../backups-sentinela');
    fs.mkdirSync(pasta, {recursive:true});
    const destino = path.join(pasta, `usuarios-onboarding-${new Date().toISOString().replace(/[:.]/g,'-')}.ejson`);
    const dados = mongoose.mongo.BSON.EJSON.stringify(usuarios, {relaxed:false});
    fs.writeFileSync(destino,dados,{flag:'wx',mode:0o600});
    if (fs.readFileSync(destino,'utf8') !== dados) throw Error('Falha ao verificar backup');
    for (const usuario of usuarios) {
      const data = usuario.questionario?.concluidoEm;
      const concluido = data instanceof Date && !Number.isNaN(data.getTime());
      if (usuario.questionarioConcluido === concluido) continue;
      const filtro = {_id:usuario._id, atualizadoEm:usuario.atualizadoEm, 'questionario.concluidoEm': data === undefined ? {$exists:false} : data};
      if (usuario.questionarioConcluido === undefined) filtro.questionarioConcluido = {$exists:false};
      else filtro.questionarioConcluido = usuario.questionarioConcluido;
      const result = await col.updateOne(filtro,{$set:{questionarioConcluido:concluido}});
      if (result.matchedCount !== 1) throw Error(`Perfil ${usuario._id} mudou durante a migração; execute novamente após auditar.`);
    }
    console.log(JSON.stringify({backup:destino, atualizado:resumo.alteracoes}));
  } finally { await mongoose.disconnect(); }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
