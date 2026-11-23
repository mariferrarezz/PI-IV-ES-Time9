// Leitura somente: não cria, altera ou remove registros.
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

async function main() {
  const texto = process.argv[2];
  if (!/^[a-f\d]{24}$/i.test(texto || '')) throw new Error('Informe o ID de uma ocorrência de teste.');
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI não configurada.');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sentinela', serverSelectionTimeoutMS: 5000 });
  const id = new mongoose.Types.ObjectId(texto);
  const ocorrencia = await mongoose.connection.collection('ocorrencias').findOne({ _id: id }, { projection: { intensidade: 1, registradoPor: 1 } });
  if (!ocorrencia || ocorrencia.intensidade !== 'alta') throw new Error('Ocorrência alta não encontrada.');
  const alertas = await mongoose.connection.collection('alertas').find({ 'contexto.tipo': 'ocorrencia', 'contexto.id': id, tipo: 'ocorrencia_intensidade_alta' }).toArray();
  if (alertas.length !== 1 || !alertas[0].usuarioId.equals(ocorrencia.registradoPor) || alertas[0].prioridade !== 'alta') throw new Error('Alerta ausente, duplicado ou com destinatário/prioridade incorretos.');
  process.stdout.write('Ocorrência alta tem um alerta com destinatário e prioridade esperados.\n');
}

main().catch(() => { process.stderr.write('Não foi possível confirmar o alerta.\n'); process.exitCode = 1; }).finally(() => mongoose.disconnect());
