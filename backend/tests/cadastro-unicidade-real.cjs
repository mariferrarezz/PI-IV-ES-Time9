// Exercita serviços reais; cria duas contas sintéticas completas no emulador.
require('dotenv').config();
process.env.JAVA_PORT = '17001';
const assert = require('assert/strict');
const crypto = require('crypto');
const mongoose = require('mongoose');
async function main() {
  assert.match(process.env.FIREBASE_AUTH_EMULATOR_HOST || '', /^(localhost|127\.0\.0\.1):\d+$/);
  await mongoose.connect(process.env.MONGODB_URI, {dbName:'sentinela'});
  const collection = mongoose.connection.db.collection('usuarios');
  const { criarApp } = require('../src/app');
  const server = criarApp({bancoDisponivel:()=>true}).listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const digits = n => Array.from(crypto.randomBytes(n),x=>String(x%10)).join('');
  async function values() {
    let cpf, telefone;
    do {cpf=digits(11);} while(await collection.findOne({cpf}));
    do {telefone=`119${digits(8)}`;} while(await collection.findOne({telefone:`+55${telefone}`}));
    return {cpf,telefone};
  }
  async function signUp() {
    const email=`unicidade-${crypto.randomBytes(12).toString('hex')}@example.test`;
    const password=`Sentinela${crypto.randomBytes(12).toString('hex')}7!`;
    const response=await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});
    const body=await response.json(); assert.equal(response.status,200,JSON.stringify(body)); return body;
  }
  async function post(token, data) {
    const r=await fetch(`${url}/auth/cadastro`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({nomeCompleto:'Teste Unicidade',canalCodigoPreferido:'email',aceitouTermos:true,...data})});
    return {status:r.status,body:await r.json()};
  }
  try {
    const a=await values(), credA=await signUp();
    const created=await post(credA.idToken,a); assert.equal(created.status,201,JSON.stringify(created));
    assert.ok(await collection.findOne({firebaseUid:credA.localId,cpf:a.cpf,telefone:`+55${a.telefone}`}));
    const b=await values(), credB=await signUp();
    const duplicateCpf=await post(credB.idToken,{cpf:a.cpf,telefone:b.telefone});
    assert.equal(duplicateCpf.status,409,JSON.stringify(duplicateCpf)); assert.equal(duplicateCpf.body.codigo,'CPF_JA_CADASTRADO');
    const duplicatePhone=await post(credB.idToken,{cpf:b.cpf,telefone:a.telefone});
    assert.equal(duplicatePhone.status,409,JSON.stringify(duplicatePhone)); assert.equal(duplicatePhone.body.codigo,'TELEFONE_JA_CADASTRADO');
    const createdB=await post(credB.idToken,b); assert.equal(createdB.status,201,JSON.stringify(createdB));
    assert.ok(await collection.findOne({firebaseUid:credB.localId,cpf:b.cpf,telefone:`+55${b.telefone}`}));
    console.log(JSON.stringify({resultado:'ok',contasCriadas:[{id:String(created.body._id || created.body.id),uid:credA.localId},{id:String(createdB.body._id || createdB.body.id),uid:credB.localId}],cpfDuplicado:duplicateCpf.status,telefoneDuplicado:duplicatePhone.status}));
  } finally {server.closeAllConnections(); await new Promise(resolve=>server.close(resolve)); await mongoose.disconnect();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
