// Verifica HTTP, Java e MongoDB reais sem criar ou alterar documentos.
require('dotenv').config();
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sentinela', serverSelectionTimeoutMS: 5000 });
  try {
    const usuarios = mongoose.connection.collection('usuarios');
    const usuario = await usuarios.findOne({}, { projection: { cpf: 1 } });
    assert.ok(usuario);
    let repetido;
    for (const d of '0123456789') {
      const valor = d.repeat(11);
      if (!await usuarios.findOne({ cpf: valor })) { repetido = valor; break; }
    }
    assert.ok(repetido, 'Nenhuma sequência repetida disponível para o teste');
    const verificar = async valor => {
      const r = await fetch('http://127.0.0.1:3000/validacao-cadastro/cpf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ valor }) });
      return { status: r.status, body: await r.json() };
    };
    assert.equal((await verificar('1234567890')).status, 400);
    assert.equal((await verificar('123456789012')).status, 400);
    assert.equal((await verificar(repetido)).status, 200);
    const duplicado = await verificar(usuario.cpf);
    assert.equal(duplicado.status, 409);
    assert.equal(duplicado.body.codigo, 'CPF_JA_CADASTRADO');
    assert.equal(duplicado.body.erro, 'CPF já cadastrado');
    console.log('CPF: 10 e 12 dígitos recusados; sequência repetida disponível aceita; CPF cadastrado recusado.');
  } finally { await mongoose.disconnect(); }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
