import { InferSchemaType, Schema, model } from "mongoose";

const propriedadeSchema = new Schema(
  {
    ownerUid: { type: String, required: true, index: true }, // uid do Firebase
    nome: { type: String, required: true, trim: true },
    municipio: { type: String, trim: true },
    estado: { type: String, trim: true, maxlength: 2 },
    descricao: { type: String, trim: true },
  },
  { timestamps: true },
);

export type Propriedade = InferSchemaType<typeof propriedadeSchema>;
export const PropriedadeModel = model("Propriedade", propriedadeSchema);
