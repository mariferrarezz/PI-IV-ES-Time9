import test from "node:test";
import assert from "node:assert/strict";
import { bancoPutIsolado } from "./banco-put-isolado";
const rodada="12345678-1234-1234-1234-123456789abc";
test("PUT real exige banco isolado e conexão local explícita",()=>{
  for (const uri of [undefined,"mongodb+srv://exemplo.mongodb.net/","mongodb://127.0.0.1:27017/sentinela?replicaSet=rs0",
    "mongodb://127.0.0.1:27017/sentinela_testes?replicaSet=rs0","mongodb://usuario:senha@localhost:27017/?replicaSet=rs0",
    "mongodb://outro:27017/?replicaSet=rs0","mongodb://localhost:27017/","mongodb://localhost:27017/?replicaSet=",
    "mongodb://localhost:27017/?replicaSet=rs0&proxyHost=outro"])
    assert.throws(()=>bancoPutIsolado(uri,rodada));
  for(const host of ["localhost","127.0.0.1","[::1]"]){
    const r=bancoPutIsolado(`mongodb://${host}:27017/?replicaSet=rs0`,rodada);
    assert.equal(r.nome,"sentinela_testes_put_12345678123412341234123456789abc");
  }
  assert.throws(()=>bancoPutIsolado("mongodb://localhost:27017/?replicaSet=rs0","sentinela"));
});
