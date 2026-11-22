import { Schema, model } from "mongoose";

// Leitura do catálogo de culturas (database/validators/validar-culturas.mongodb.js).
// O back-end só consulta: quem cadastra culturas é o time do banco.
const culturaSchema = new Schema(
  {
    nome: { type: String, required: true },
    ativa: { type: Boolean, required: true },
  },
  { collection: "culturas", versionKey: false, strict: "throw", autoIndex: false, autoCreate: false, bufferCommands: false },
);

export const CulturaModel = model("Cultura", culturaSchema);
