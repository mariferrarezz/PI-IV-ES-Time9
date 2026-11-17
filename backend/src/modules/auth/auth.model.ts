import { Schema, model } from "mongoose";

// Segue o validador da coleção "usuarios" (database/validators/validar-usuarios.mongodb.js).
// O banco é estrito: nenhum campo além dos previstos pode ser gravado (por isso versionKey: false).
const termosSchema = new Schema(
  {
    versao: { type: String, required: true },
    aceitoEm: { type: Date, required: true },
  },
  { _id: false },
);

const usuarioSchema = new Schema(
  {
    firebaseUid: { type: String, required: true, immutable: true },
    nomeCompleto: { type: String, required: true },
    cpf: { type: String, required: true },
    telefone: { type: String, required: true },
    termos: { type: termosSchema, required: true },
  },
  {
    collection: "usuarios",
    timestamps: { createdAt: "criadoEm", updatedAt: "atualizadoEm" },
    versionKey: false, strict: "throw", autoIndex: false, autoCreate: false, bufferCommands: false,
  },
);

export const UsuarioModel = model("Usuario", usuarioSchema);
