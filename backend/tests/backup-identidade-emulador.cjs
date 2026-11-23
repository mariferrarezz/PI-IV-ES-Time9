// Apenas identidade sintética comprovada; nunca contata Firebase de produção.
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
async function main() {
  if (!/^(localhost|127\.0\.0\.1):\d+$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST || '')) throw new Error('Emulador local não configurado.');
  const app = initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID }, 'backup-identidade');
  try {
    const usuario = await getAuth(app).getUser('7NYO6WVppiWUMujmnI1tlCTJZxDG');
    if (usuario.email !== 'cadastro-teste-487f4fd26a3943b9ae28204ca4661347@example.test') throw new Error('Identidade não corresponde ao teste documentado.');
    const dados = usuario.toJSON();
    if (!dados.passwordHash || !dados.passwordSalt) throw new Error('Backup da credencial não está completo.');
    const pasta = path.resolve(__dirname, '../../backups-sentinela');
    fs.mkdirSync(pasta, { recursive: true, mode: 0o700 });
    const destino = path.join(pasta, `identidade-emulador-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    const texto = JSON.stringify({ projeto: process.env.FIREBASE_PROJECT_ID, usuario: dados });
    fs.writeFileSync(destino, texto, { flag: 'wx', mode: 0o600 });
    const lido = fs.readFileSync(destino, 'utf8');
    if (lido !== texto || !JSON.parse(lido).usuario.passwordHash) throw new Error('Falha na verificação do backup.');
    console.log(JSON.stringify({ caminho: destino, sha256: crypto.createHash('sha256').update(lido).digest('hex') }));
  } finally { await deleteApp(app); }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
