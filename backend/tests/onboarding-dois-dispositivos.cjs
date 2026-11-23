// Duas autenticações independentes consultam o mesmo perfil, sem gravar dados.
const assert = require('node:assert/strict');
async function main() {
  const email = process.env.TEST_EMAIL, password = process.env.TEST_PASSWORD;
  if (!email || !password) throw Error('Configure TEST_EMAIL e TEST_PASSWORD no ambiente.');
  async function perfil() {
    const login = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password,returnSecureToken:true}),
    });
    if (!login.ok) throw Error(`Firebase Emulator: HTTP ${login.status}`);
    const token = (await login.json()).idToken;
    const response = await fetch('http://127.0.0.1:3000/auth/me', {headers:{Authorization:`Bearer ${token}`}});
    if (!response.ok) throw Error(`Perfil: HTTP ${response.status}`);
    return response.json();
  }
  const [primeiro, segundo] = await Promise.all([perfil(), perfil()]);
  assert.equal(primeiro.id, segundo.id);
  const conclusao = perfil => {
    const valor = perfil.questionario?.concluidoEm;
    if (valor == null) return false;
    assert.ok(typeof valor === 'string' && !Number.isNaN(Date.parse(valor)));
    return true;
  };
  assert.equal(conclusao(primeiro), conclusao(segundo));
  console.log(JSON.stringify({mesmoPerfil:true,mesmaDecisao:true,concluido:conclusao(primeiro)}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
