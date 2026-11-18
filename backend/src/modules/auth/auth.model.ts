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

// Questionário inicial: ausente até ser respondido, gravado inteiro de uma vez (BD3, seção 4.2).
const questionarioSchema = new Schema(
  {
    versao: { type: String, required: true },
    portePropriedade: { type: String, required: true, enum: ["pequena", "media", "grande"] },
    quantidadeCulturas: { type: String, required: true, enum: ["1", "2", "3", "4_ou_mais"] },
    culturasIds: { type: [Schema.Types.ObjectId], required: true },
    outraCultura: { type: String },
    problemasFrequentes: { type: [String], required: true },
    frequenciaProblemas: { type: String, required: true, enum: ["raramente", "as_vezes", "frequentemente", "sempre"] },
    identificaProblemasSozinho: { type: String, required: true, enum: ["sim", "nao", "as_vezes"] },
    concluidoEm: { type: Date, required: true },
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
    canalCodigoPreferido: { type: String, required: true, enum: ["email", "sms"] },
    // Sem default: o campo não pode existir no banco antes de o questionário ser concluído.
    questionario: { type: questionarioSchema, default: undefined },
  },
  {
    collection: "usuarios",
    timestamps: { createdAt: "criadoEm", updatedAt: "atualizadoEm" },
    versionKey: false, strict: "throw", autoIndex: false, autoCreate: false, bufferCommands: false,
  },
);

export const UsuarioModel = model("Usuario", usuarioSchema);
