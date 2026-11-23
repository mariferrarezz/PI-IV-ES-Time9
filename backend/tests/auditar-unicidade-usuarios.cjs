// Auditoria sem exibir CPF ou telefone. --apply cria índices somente após auditoria limpa.
require('dotenv').config();
const { MongoClient } = require('mongoose').mongo;
const normalizar = (campo, valor) => {
  const digitos = typeof valor === 'string' ? valor.replace(/\D/g, '') : '';
  return campo === 'telefone' && digitos.length === 11 ? `+55${digitos}` : campo === 'telefone' && digitos.length === 13 && digitos.startsWith('55') ? `+${digitos}` : digitos;
};
async function main() {
  const cliente = new MongoClient(process.env.MONGODB_URI);
  await cliente.connect();
  try {
    const col = cliente.db('sentinela').collection('usuarios');
    const indices = await col.indexes();
    const perfis = await col.find({}, { projection: { cpf: 1, telefone: 1 } }).toArray();
    const resumo = {};
    for (const campo of ['cpf', 'telefone']) {
      const contagens = new Map();
      let naoCanonicos = 0;
      for (const perfil of perfis) {
        const valor = normalizar(campo, perfil[campo]);
        if (valor !== perfil[campo] || !(campo === 'cpf' ? /^\d{11}$/ : /^\+55\d{2}9\d{8}$/).test(valor)) naoCanonicos++;
        const ids = contagens.get(valor) ?? [];
        ids.push(String(perfil._id));
        contagens.set(valor, ids);
      }
      const repetidos = [...contagens.values()].filter(ids => ids.length > 1);
      resumo[campo] = { gruposDuplicados: repetidos.length, registrosEmDuplicidade: repetidos.reduce((a, b) => a + b.length, 0), naoCanonicos, usuariosPorGrupo: repetidos };
    }
    console.log(JSON.stringify({ totalUsuarios: perfis.length, indices: indices.map(({ name, key, unique }) => ({ name, key, unique: !!unique })), resumo }, null, 2));
    if (process.argv.includes('--apply')) {
      if (Object.values(resumo).some(r => r.gruposDuplicados || r.naoCanonicos)) throw new Error('Índices não criados: existem duplicidades ou valores não canônicos.');
      await col.createIndex({ cpf: 1 }, { unique: true, name: 'uq_usuarios_cpf' });
      await col.createIndex({ telefone: 1 }, { unique: true, name: 'uq_usuarios_telefone' });
      console.log('Índices únicos criados.');
    }
  } finally { await cliente.close(); }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
