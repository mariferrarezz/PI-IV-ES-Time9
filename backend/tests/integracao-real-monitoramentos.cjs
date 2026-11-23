// Teste explícito e destrutivo apenas para dados sintéticos: grava um monitoramento.
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
async function main() {
  const { TEST_EMAIL, TEST_PASSWORD, TEST_TALHAO_ID } = process.env;
  if (!TEST_EMAIL || !TEST_PASSWORD || !TEST_TALHAO_ID) throw new Error('Informe TEST_EMAIL, TEST_PASSWORD e TEST_TALHAO_ID de teste');
  const auth = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, returnSecureToken: true }) });
  assert.equal(auth.status, 200, 'autenticação no emulador');
  const { idToken } = await auth.json();
  const req = (path, options = {}) => fetch(`http://127.0.0.1:3000${path}`, { ...options, headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json', ...options.headers } });
  const plantacoes = await (await req(`/talhoes/${TEST_TALHAO_ID}/plantacoes`)).json();
  const plantacao = plantacoes.find(p => p.status === 'ativa');
  assert.ok(plantacao, 'plantação ativa de teste');
  const path = `/plantacoes/${plantacao._id}/monitoramentos`;
  const payload = { dataObservacao: new Date().toISOString(), problemaObservado: true, observacoes: 'Observação sintética de teste', intensidade: 'baixa', areaAfetadaHa: 0 };
  const invalida = await req(path, { method: 'POST', body: JSON.stringify(payload) });
  const erro = await invalida.json();
  assert.equal(invalida.status, 400, JSON.stringify(erro));
  assert.ok(erro.detalhes?.some(d => d.mensagem.includes('área afetada')), JSON.stringify(erro));
  payload.areaAfetadaHa = 0.1;
  const chave = randomBytes(16).toString('hex');
  const salva = await req(path, { method: 'POST', headers: { 'Idempotency-Key': chave }, body: JSON.stringify(payload) });
  const registro = await salva.json();
  assert.equal(salva.status, 201, JSON.stringify(registro));
  const repetida = await req(path, { method: 'POST', headers: { 'Idempotency-Key': chave }, body: JSON.stringify(payload) });
  assert.equal(repetida.status, 201);
  assert.equal((await repetida.json())._id, registro._id);
  const consulta = await req(path);
  assert.equal(consulta.status, 200);
  assert.ok((await consulta.json()).some(m => m._id === registro._id));
  console.log('Java rejeitou área zero; monitoramento válido gravado e relido:', registro._id);
}
main().catch(e => { console.error(e); process.exitCode = 1; });
