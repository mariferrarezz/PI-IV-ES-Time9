import { Types } from "mongoose";
import { UsuarioModel } from "./auth.model";

export interface PerfilUsuario {
  _id: Types.ObjectId;
  firebaseUid: string;
  nomeCompleto: string;
  cpf: string;
  telefone: string;
  termos: { versao: string; aceitoEm: Date };
  questionario?: Questionario;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface Questionario {
  versao: string;
  portePropriedade: "pequena" | "media" | "grande";
  quantidadeCulturas: "1" | "2" | "3" | "4_ou_mais";
  culturasIds: Types.ObjectId[];
  outraCultura?: string;
  problemasFrequentes: ("pragas" | "doencas" | "nao_identificado")[];
  frequenciaProblemas: "raramente" | "as_vezes" | "frequentemente" | "sempre";
  identificaProblemasSozinho: "sim" | "nao" | "as_vezes";
  concluidoEm: Date;
}

export type NovoPerfil = Pick<PerfilUsuario, "firebaseUid" | "nomeCompleto" | "cpf" | "telefone" | "termos">;

export interface AuthRepository {
  buscarPorFirebaseUid(uid: string): Promise<PerfilUsuario | null>;
  criar(dados: NovoPerfil): Promise<PerfilUsuario>;
  // Grava só se o questionário ainda não existir. Devolve null se o perfil não existe ou já respondeu.
  salvarQuestionario(uid: string, questionario: Questionario): Promise<PerfilUsuario | null>;
}

const CAMPOS_PERFIL = "_id firebaseUid nomeCompleto cpf telefone termos questionario criadoEm atualizadoEm";

// Único arquivo do módulo que conversa com o MongoDB.
export const authRepository: AuthRepository = {
  async buscarPorFirebaseUid(uid) {
    return UsuarioModel.findOne({ firebaseUid: uid }, CAMPOS_PERFIL).lean<PerfilUsuario>();
  },

  async criar(dados) {
    const criado = await UsuarioModel.create(dados);
    return criado.toObject() as unknown as PerfilUsuario;
  },

  async salvarQuestionario(uid, questionario) {
    // O filtro "$exists: false" impede sobrescrever, mesmo com dois envios ao mesmo tempo.
    return UsuarioModel.findOneAndUpdate(
      { firebaseUid: uid, questionario: { $exists: false } },
      { $set: { questionario } },
      { new: true, runValidators: true, projection: CAMPOS_PERFIL },
    ).lean<PerfilUsuario>();
  },
};
