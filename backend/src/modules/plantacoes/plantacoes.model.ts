import { Schema, model } from 'mongoose';

const plantacaoSchema = new Schema({
  talhaoId: { type: Schema.Types.ObjectId, required: true, immutable: true },
  culturaId: { type: Schema.Types.ObjectId, required: true },
  variedade: String, safra: String, dataPlantio: Date, areaPlantadaHa: Number,
  status: { type: String, enum: ['ativa', 'encerrada'], required: true },
  dataEncerramento: Date, observacoes: String,
}, { collection: 'plantacoes', timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' },
  versionKey: false, strict: 'throw', autoIndex: false, autoCreate: false, bufferCommands: false });

export const PlantacaoModel = model('Plantacao', plantacaoSchema);
