import { InferSchemaType, Schema, model } from "mongoose";
import { Types } from "mongoose";
import { UFS } from "./propriedades.schema";

const texto = (limite: number) => ({ type: String, trim: true,
  validate: (valor: string) => /\S/u.test(valor) && [...valor].length <= limite });

const propriedadeSchema = new Schema(
  {
    usuarioId: { type: Schema.Types.ObjectId, required: true, immutable: true },
    nome: { ...texto(150), required: true },
    municipio: { ...texto(150), required: true },
    estado: { type: String, required: true, enum: UFS },
    observacoes: texto(5000),
    areaTotalHa: { type: Number, validate: (valor: number) => Number.isFinite(valor) && valor > 0 },
    ativa: { type: Boolean, required: true, default: true },
  },
  { collection: "propriedades", timestamps: { createdAt: "criadoEm", updatedAt: "atualizadoEm" },
    versionKey: false, strict: "throw", autoIndex: false, autoCreate: false, bufferCommands: false },
);

export type Propriedade = InferSchemaType<typeof propriedadeSchema>;
export type RegistroPropriedade = Propriedade & { _id: Types.ObjectId };
export const PropriedadeModel = model("Propriedade", propriedadeSchema);
