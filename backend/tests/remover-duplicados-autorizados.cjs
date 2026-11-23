// Execução pontual: verifica o backup, referências e emulador antes de remover.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const ids = ['6af8f9b6d3efbe6c9205b498','6afc42dd5ac9092d875aee00','6afc60127946454609853a4b','6afd8b3f9811ebbbe2bbfacb','6b038b39dde010951f25e4df','6b038d3fdde010951f25e4e7','6b038e36dde010951f25e4ee'];
const propertyId = '6af9013c1f440eab1b7ce152';
const expectedHash = '1f64058c7c9b670b2562de9ac36b223d07227c3947deeea43f2c91ee6df2ae24';
const backupPath = path.resolve(__dirname, '../../backups-sentinela/backup-sentinela-2026-11-23T12-59-00-633Z.ejson');
const bson = mongoose.mongo.BSON.EJSON;
function serialized(x) { return bson.stringify(x, { relaxed:false }); }
function refs(v, set, root = false) {
  if (v == null) return false;
  if (v._bsontype === 'ObjectId') return set.has(String(v));
  if (typeof v === 'string') return set.has(v);
  if (Array.isArray(v)) return v.some(x => refs(x,set));
  if (typeof v === 'object' && !(v instanceof Date) && !v._bsontype) return Object.entries(v).some(([k,x]) => !(root && k === '_id') && refs(x,set));
  return false;
}
async function main() {
  if (!/^(127\.0\.0\.1|localhost):\d+$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST || '')) throw Error('Firebase Emulator local não configurado; operação interrompida.');
  const raw = fs.readFileSync(backupPath, 'utf8');
  if (crypto.createHash('sha256').update(raw).digest('hex') !== expectedHash) throw Error('Hash do backup divergente.');
  const backup = bson.parse(raw, { relaxed:false });
  const usuarios = backup.colecoes.usuarios.filter(u => ids.includes(String(u._id)));
  if (usuarios.length !== ids.length) throw Error('Backup não contém todos os perfis selecionados.');
  const app = initializeApp({projectId:process.env.FIREBASE_PROJECT_ID}, 'remocao-duplicados');
  const auth = getAuth(app);
  const identities = await auth.getUsers(usuarios.map(u => ({uid:u.firebaseUid})));
  const identityPath = path.resolve(__dirname, `../../backups-sentinela/identidades-duplicadas-${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
  fs.writeFileSync(identityPath, JSON.stringify({host:process.env.FIREBASE_AUTH_EMULATOR_HOST, projectId:process.env.FIREBASE_PROJECT_ID, usuarios:identities.users.map(u => u.toJSON()), naoEncontrados:identities.notFound}, null, 2), {flag:'wx',mode:0o600});
  const idRaw = fs.readFileSync(identityPath);
  JSON.parse(idRaw.toString());
  console.log(JSON.stringify({backupIdentidades:identityPath,sha256:crypto.createHash('sha256').update(idRaw).digest('hex'),identidadesEncontradas:identities.users.map(u=>u.uid),naoEncontradas:identities.notFound.map(u=>u.uid)}));
  await mongoose.connect(process.env.MONGODB_URI, {dbName:'sentinela',serverSelectionTimeoutMS:5000});
  const db = mongoose.connection.db;
  const session = await mongoose.startSession();
  const blocked = new Set([...ids,propertyId,...usuarios.map(u=>u.firebaseUid)]);
  try {
    await session.withTransaction(async () => {
      const names = (await db.listCollections({}, {nameOnly:true}).toArray()).map(c=>c.name).filter(n=>!n.startsWith('system.'));
      for (const name of names) {
        const docs = await db.collection(name).find({}, {session}).toArray();
        const old = backup.colecoes[name];
        if (!old || docs.length !== old.length) throw Error(`Coleção ${name} mudou após o backup.`);
        const oldMap = new Map(old.map(d=>[String(d._id),serialized(d)]));
        for (const d of docs) {
          if (oldMap.get(String(d._id)) !== serialized(d)) throw Error(`Documento ${name}/${d._id} mudou após o backup.`);
          if ((name === 'usuarios' && ids.includes(String(d._id))) || (name === 'propriedades' && String(d._id) === propertyId)) continue;
          if (refs(d,blocked,true)) throw Error(`Referência encontrada em ${name}/${d._id}; remoção interrompida.`);
        }
      }
      const p = await db.collection('propriedades').deleteOne({_id:new mongoose.Types.ObjectId(propertyId),usuarioId:new mongoose.Types.ObjectId(ids[0])},{session});
      const u = await db.collection('usuarios').deleteMany({_id:{$in:ids.map(id=>new mongoose.Types.ObjectId(id))}},{session});
      if (p.deletedCount !== 1 || u.deletedCount !== ids.length) throw Error('Contagem inesperada; transação cancelada.');
    });
    console.log(JSON.stringify({mongoRemovidos:ids,propriedadesRemovidas:[propertyId]}));
  } finally { await session.endSession(); await mongoose.disconnect(); }
  for (const user of identities.users) {
    await auth.deleteUser(user.uid);
    console.log(JSON.stringify({credencialEmuladorRemovida:user.uid}));
  }
  await deleteApp(app);
}
main().catch(e => {console.error(e.message);process.exitCode=1;});
