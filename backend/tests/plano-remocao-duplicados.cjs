// Inspeção de referências no backup, sem alterar o banco.
const fs = require('fs');
const mongoose = require('mongoose');
const data = mongoose.mongo.BSON.EJSON.parse(fs.readFileSync(process.argv[2], 'utf8'), { relaxed: false });
const usuarios = data.colecoes.usuarios;
const removidos = new Set(['6af8f9b6d3efbe6c9205b498','6afc42dd5ac9092d875aee00','6afc60127946454609853a4b','6afd8b3f9811ebbbe2bbfacb','6b038b39dde010951f25e4df','6b038d3fdde010951f25e4e7','6b038e36dde010951f25e4ee']);
const alvos = new Map(usuarios.filter(u => removidos.has(String(u._id))).flatMap(u => [[String(u._id), `usuarios/${u._id}`], [u.firebaseUid, `usuarios/${u._id}`]]));
const itens = [];
function refs(value, path = '', result = []) {
  if (value == null) return result;
  if (value._bsontype === 'ObjectId') result.push([path, String(value)]);
  else if (typeof value === 'string') result.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => refs(v, `${path}.${i}`, result));
  else if (typeof value === 'object' && !(value instanceof Date) && !Buffer.isBuffer(value) && !value._bsontype) for (const [k,v] of Object.entries(value)) if (!(path === '' && k === '_id')) refs(v, path ? `${path}.${k}` : k, result);
  return result;
}
for (const [colecao, docs] of Object.entries(data.colecoes)) for (const doc of docs) if (!(colecao === 'usuarios' && removidos.has(String(doc._id)))) itens.push({colecao, id:String(doc._id), refs:refs(doc)});
let changed = true;
while (changed) {
  changed = false;
  for (const item of itens) if (!item.alvo && item.refs.some(([,v]) => alvos.has(v))) {
    item.alvo = true; alvos.set(item.id, `${item.colecao}/${item.id}`); changed = true;
  }
}
console.log(JSON.stringify({usuarios:usuarios.filter(u => removidos.has(String(u._id))).map(u => ({id:String(u._id),nome:u.nomeCompleto,uid:u.firebaseUid,questionario:!!u.questionario})), referencias:itens.filter(i => i.alvo).map(i => ({colecao:i.colecao,id:i.id,refs:i.refs.filter(([,v])=>alvos.has(v)).map(([campo,v])=>({campo, alvo:alvos.get(v)}))}))}, null, 2));
