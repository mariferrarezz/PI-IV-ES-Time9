// Somente leitura; identifica vínculos de todos os perfis com CPF/telefone repetidos.
require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sentinela', serverSelectionTimeoutMS: 5000 });
  const db = mongoose.connection.db;
  const usuarios = await db.collection('usuarios').find({}).toArray();
  const grupos = [];
  for (const campo of ['cpf', 'telefone']) {
    const mapa = new Map();
    for (const u of usuarios) {
      const digitos = typeof u[campo] === 'string' ? u[campo].replace(/\D/g, '') : '';
      const valor = campo === 'telefone' && digitos.length === 11 ? `55${digitos}` : digitos;
      const lista = mapa.get(valor) || [];
      lista.push(String(u._id));
      mapa.set(valor, lista);
    }
    for (const ids of mapa.values()) if (ids.length > 1) grupos.push({ campo, ids });
  }
  const ids = new Set(grupos.flatMap(g => g.ids));
  const envolvidos = usuarios.filter(u => ids.has(String(u._id)));
  const vinculos = Object.fromEntries(envolvidos.map(u => [String(u._id), {}]));
  const uids = new Map(envolvidos.map(u => [u.firebaseUid, String(u._id)]));
  function identificar(valor, encontrados) {
    if (valor == null) return;
    if (typeof valor === 'string') {
      if (ids.has(valor)) encontrados.add(valor);
      if (uids.has(valor)) encontrados.add(uids.get(valor));
    } else if (valor._bsontype === 'ObjectId') {
      if (ids.has(String(valor))) encontrados.add(String(valor));
    } else if (Array.isArray(valor)) {
      for (const item of valor) identificar(item, encontrados);
    } else if (typeof valor === 'object' && !(valor instanceof Date) && !Buffer.isBuffer(valor)) {
      for (const item of Object.values(valor)) identificar(item, encontrados);
    }
  }
  const colecoes = await db.listCollections({}, { nameOnly: true }).toArray();
  for (const { name } of colecoes) {
    if (name.startsWith('system.')) continue;
    for await (const documento of db.collection(name).find({})) {
      const encontrados = new Set();
      identificar(documento, encontrados);
      if (name === 'usuarios') encontrados.delete(String(documento._id));
      for (const usuario of encontrados) vinculos[usuario][name] = (vinculos[usuario][name] || 0) + 1;
    }
  }
  let identidades = new Map();
  let emulatorConferido = false;
  const host = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (host && /^(localhost|127\.0\.0\.1):\d+$/.test(host)) {
    try {
      const { initializeApp, deleteApp } = require('firebase-admin/app');
      const { getAuth } = require('firebase-admin/auth');
      const app = initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID }, 'inspecao-duplicados');
      const resposta = await getAuth(app).getUsers(envolvidos.map(u => ({ uid: u.firebaseUid })));
      identidades = new Map(resposta.users.map(u => [u.uid, u.email]));
      emulatorConferido = true;
      await deleteApp(app);
    } catch (_) { /* Não considerar testável sem evidência de identidade. */ }
  }
  console.log(JSON.stringify({ grupos, emulatorConferido, usuarios: envolvidos.map(u => ({
    id: String(u._id), nome: u.nomeCompleto, uid: u.firebaseUid,
    emailEmulador: identidades.get(u.firebaseUid) || null,
    criadoEm: u.criadoEm, questionario: !!u.questionario, fotoPerfil: !!u.fotoPerfil,
    vinculos: vinculos[String(u._id)],
  })) }, null, 2));
  await mongoose.disconnect();
}
main().catch(async e => { console.error(e.message); await mongoose.disconnect(); process.exitCode = 1; });
