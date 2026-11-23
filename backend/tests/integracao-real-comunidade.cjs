const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
async function main() {
  const { TEST_EMAIL, TEST_PASSWORD } = process.env;
  if (!TEST_EMAIL || !TEST_PASSWORD) throw new Error('Informe TEST_EMAIL e TEST_PASSWORD');
  const anonima = await fetch('http://127.0.0.1:3000/comunidade/experiencias');
  assert.equal(anonima.status, 401);
  const auth = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, returnSecureToken: true }) });
  assert.equal(auth.status, 200);
  const { idToken } = await auth.json();
  const req = (path, options = {}) => fetch(`http://127.0.0.1:3000${path}`, { ...options, headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json', ...options.headers } });
  const feed = await req('/comunidade/experiencias');
  assert.equal(feed.status, 200);
  const itens = await feed.json();
  assert.ok(Array.isArray(itens));
  for (const item of itens) for (const campo of ['autorId', 'ocorrenciaOrigemId', 'tratamentoOrigemId', 'avaliacaoOrigemId', 'moderacao', 'fotos']) assert.equal(item[campo], undefined);
  const filtrado = await req('/comunidade/experiencias?tipoProblema=praga');
  assert.equal(filtrado.status, 200);
  assert.ok((await filtrado.json()).every(e => e.tipoProblema === 'praga'));
  if (itens.length) {
    const detalhe = await req(`/comunidade/experiencias/${itens[0]._id}`);
    assert.equal(detalhe.status, 200);
    assert.equal((await detalhe.json())._id, itens[0]._id);
    if (process.env.ALLOW_TEST_WRITE === '1') {
      const denuncia = `/comunidade/experiencias/${itens[0]._id}/denuncias`;
      const invalida = await req(denuncia, { method: 'POST', body: JSON.stringify({ motivo: 'invalido' }) });
      assert.equal(invalida.status, 400);
      const chave = randomBytes(16).toString('hex');
      const options = { method: 'POST', headers: { 'Idempotency-Key': chave }, body: JSON.stringify({ motivo: 'outro', descricao: 'Denúncia sintética de teste; não requer ação.' }) };
      const salva = await req(denuncia, options);
      const registro = await salva.json();
      assert.equal(salva.status, 201, JSON.stringify(registro));
      assert.equal(registro.status, 'pendente');
      const repetida = await req(denuncia, options);
      assert.equal((await repetida.json())._id, registro._id);
      assert.equal((await req(`/comunidade/experiencias/${itens[0]._id}`)).status, 200);
      console.log('Denúncia sintética enviada sem ocultação:', registro._id);
    }
  }
  console.log(`Feed autenticado: ${itens.length} experiências aprovadas; projeção e filtro conferidos.`);
}
main().catch(e => { console.error(e); process.exitCode = 1; });
