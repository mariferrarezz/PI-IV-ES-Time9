// Operação pontual: apenas a conta sintética documentada do Firebase Emulator.
require('dotenv').config();
const fs = require('node:fs');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const idTexto = '6b0369c5a0a2737cc85f0760';
const uid = '7NYO6WVppiWUMujmnI1tlCTJZxDG';
const email = 'cadastro-teste-487f4fd26a3943b9ae28204ca4661347@example.test';
function contem(valor) {
  if (valor == null) return false;
  if (typeof valor === 'string') return valor === uid || valor === idTexto;
  if (valor._bsontype === 'ObjectId') return String(valor) === idTexto;
  if (Array.isArray(valor)) return valor.some(contem);
  if (typeof valor === 'object' && !(valor instanceof Date) && !Buffer.isBuffer(valor)) return Object.values(valor).some(contem);
  return false;
}
async function main() {
  if (!/^(localhost|127\.0\.0\.1):\d+$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST || '')) throw new Error('Emulador local obrigatório.');
  const [backupMongo, backupFirebase] = process.argv.slice(2);
  if (!backupMongo || !backupFirebase) throw new Error('Informe os dois backups verificados.');
  const textoMongo = fs.readFileSync(backupMongo, 'utf8');
  const textoFirebase = fs.readFileSync(backupFirebase, 'utf8');
  const sha = s => crypto.createHash('sha256').update(s).digest('hex');
  if (sha(textoMongo) !== '1a7053d0e60a2b85017383a5df1c28289f7011ad51df91048e6f01d0fa8f5492' || sha(textoFirebase) !== 'bf035ac52694037ab5b5a51145219f4ada692f67dbc7b8d9a4a283776b63cc28') throw new Error('Backup não corresponde ao verificado.');
  const b = mongoose.mongo.BSON.EJSON.parse(textoMongo, { relaxed: false });
  const anterior = b.colecoes.usuarios.find(u => String(u._id) === idTexto);
  const credencial = JSON.parse(textoFirebase).usuario;
  if (!anterior || anterior.firebaseUid !== uid || credencial.uid !== uid || credencial.email !== email || !credencial.passwordHash || !credencial.passwordSalt) throw new Error('Backup incompleto ou identidade divergente.');
  const firebase = initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID }, 'remover-teste');
  try {
    const auth = getAuth(firebase);
    const identidade = await auth.getUser(uid);
    if (identidade.email !== email) throw new Error('Identidade do emulador divergiu.');
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sentinela', serverSelectionTimeoutMS: 5000 });
    const db = mongoose.connection.db;
    const colecoes = await db.listCollections({}, { nameOnly: true }).toArray();
    await mongoose.connection.transaction(async session => {
      const usuarios = db.collection('usuarios');
      const atual = await usuarios.findOne({ _id: new mongoose.Types.ObjectId(idTexto), firebaseUid: uid }, { session });
      if (!atual || atual.questionario || atual.fotoPerfil || atual.nomeCompleto !== 'Cadastro Teste' ||
          atual.cpf !== anterior.cpf || atual.telefone !== anterior.telefone || atual.atualizadoEm.getTime() !== anterior.atualizadoEm.getTime()) throw new Error('Perfil mudou ou tem dados incorporados; nenhuma exclusão.');
      if (!(await usuarios.findOne({ _id: { $ne: atual._id }, cpf: atual.cpf }, { session })) ||
          !(await usuarios.findOne({ _id: { $ne: atual._id }, telefone: atual.telefone }, { session }))) throw new Error('O perfil não é mais duplicado em ambos os campos.');
      for (const { name } of colecoes) {
        if (name.startsWith('system.')) continue;
        for await (const doc of db.collection(name).find({}, { session })) {
          if (name === 'usuarios' && String(doc._id) === idTexto) continue;
          if (contem(doc)) throw new Error(`Vínculo encontrado em ${name}; nenhuma exclusão.`);
        }
      }
      const removido = await usuarios.deleteOne({ _id: atual._id, firebaseUid: uid, atualizadoEm: atual.atualizadoEm }, { session });
      if (removido.deletedCount !== 1) throw new Error('Perfil alterado durante a verificação.');
    });
    console.log('Perfil sintético removido do MongoDB:', idTexto);
    try {
      await auth.deleteUser(uid);
      console.log('Credencial sintética removida somente do Firebase Emulator:', uid);
    } catch (_) {
      console.error('Perfil removido, mas a credencial do emulador não pôde ser removida.');
      process.exitCode = 2;
    }
  } finally { await mongoose.disconnect(); await deleteApp(firebase); }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
