// Grava credencial de emulador, perfil e questionário sintéticos; não remove dados.
const assert = require('node:assert/strict');
const { randomBytes, randomInt } = require('node:crypto');
async function main() {
  const sufixo = randomBytes(12).toString('hex');
  const email = `fluxo-questionario-${sufixo}@example.test`;
  const senha = `Sentinela${randomBytes(8).toString('hex')}7!`;
  const firebase = async acao => {
    const r = await fetch(`http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:${acao}?key=demo-key`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: senha, returnSecureToken: true }),
    });
    assert.equal(r.status, 200, `Firebase ${acao}`);
    return r.json();
  };
  const digitos = n => Array.from({length:n}, () => String(randomInt(10))).join('');
  async function disponivel(campo, gerar) {
    for (let tentativas = 0; tentativas < 20; tentativas++) {
      const valor = gerar();
      const r = await fetch(`http://127.0.0.1:3000/validacao-cadastro/${campo}`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({valor}),
      });
      if (r.status === 200) return valor;
      if (r.status !== 409) throw Error(`Validação ${campo}: HTTP ${r.status}`);
    }
    throw Error(`Não foi possível obter ${campo} disponível`);
  }
  const cpf = await disponivel('cpf', () => digitos(11));
  const telefone = await disponivel('telefone', () => `119${digitos(8)}`);
  const credencial = await firebase('signUp');
  let token = credencial.idToken;
  const api = (caminho, options = {}) => fetch(`http://127.0.0.1:3000${caminho}`, {
    ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  const cadastrar = await api('/auth/cadastro', { method: 'POST', body: JSON.stringify({ nomeCompleto: 'Fluxo Sintético', cpf, telefone, canalCodigoPreferido: 'email', aceitouTermos: true }) });
  const criado = await cadastrar.json();
  assert.equal(cadastrar.status, 201, JSON.stringify(criado));
  assert.equal(criado.questionario, null);
  const loginPendente = await firebase('signInWithPassword');
  assert.equal(loginPendente.localId, credencial.localId);
  token = loginPendente.idToken;
  const perfilPendente = await api('/auth/me');
  assert.equal(perfilPendente.status, 200);
  assert.equal((await perfilPendente.json()).questionario, null);
  const respostas = { portePropriedade: 'pequena', quantidadeCulturas: '1', culturasIds: [], outraCultura: 'Cultura sintética', problemasFrequentes: ['pragas'], frequenciaProblemas: 'raramente', identificaProblemasSozinho: 'sim' };
  const salvar = await api('/auth/questionario', { method: 'POST', body: JSON.stringify(respostas) });
  const salvo = await salvar.json();
  assert.equal(salvar.status, 201, JSON.stringify(salvo));
  assert.ok(salvo.questionario?.concluidoEm);
  const repetido = await api('/auth/questionario', { method: 'POST', body: JSON.stringify(respostas) });
  assert.equal(repetido.status, 409);
  const loginConcluido = await firebase('signInWithPassword');
  assert.equal(loginConcluido.localId, credencial.localId);
  token = loginConcluido.idToken;
  const perfilConcluido = await api('/auth/me');
  assert.equal(perfilConcluido.status, 200);
  const lido = await perfilConcluido.json();
  assert.equal(lido.questionario?.concluidoEm, salvo.questionario.concluidoEm);
  assert.equal(lido.questionario?.outraCultura, respostas.outraCultura);
  console.log('Perfil e questionário sintéticos gravados e relidos; conta de teste:', email);
}
main().catch(e => { console.error(e); process.exitCode = 1; });
