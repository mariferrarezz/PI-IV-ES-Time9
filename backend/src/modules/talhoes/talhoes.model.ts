import { InferSchemaType, Schema, model, Types } from "mongoose";

const talhaoSchema = new Schema({
  propriedadeId: { type: Schema.Types.ObjectId, required: true, immutable: true },
  nome: { type: String, required: true,
    validate: (valor: string) => /\S/u.test(valor) && [...valor].length <= 150 },
  areaHa: { type: Number, required: true,
    validate: (valor: number) => Number.isFinite(valor) && valor > 0 },
  observacoes: { type: String, trim: true,
    validate: (valor: string) => /\S/u.test(valor) && [...valor].length <= 5000 },
  ativo: { type: Boolean, required: true, default: true },
}, {
  collection: "talhoes", timestamps: { createdAt: "criadoEm", updatedAt: "atualizadoEm" },
  versionKey: false, strict: "throw", autoIndex: false, autoCreate: false, bufferCommands: false,
});

export type RegistroTalhao = InferSchemaType<typeof talhaoSchema> & { _id: Types.ObjectId };
export const TalhaoModel = model("Talhao", talhaoSchema);
