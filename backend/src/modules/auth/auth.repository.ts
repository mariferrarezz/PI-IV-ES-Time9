import { Types } from "mongoose";
import { UsuarioModel } from "./auth.model";

export interface PerfilUsuario {
  _id: Types.ObjectId;
  firebaseUid: string;
  nomeCompleto: string;
  cpf: string;
  telefone: string;
  termos: { versao: string; aceitoEm: Date };
  criadoEm: Date;
  atualizadoEm: Date;
}

export type NovoPerfil = Pick<PerfilUsuario, "firebaseUid" | "nomeCompleto" | "cpf" | "telefone" | "termos">;

export interface AuthRepository {
  buscarPorFirebaseUid(uid: string): Promise<PerfilUsuario | null>;
  criar(dados: NovoPerfil): Promise<PerfilUsuario>;
}

const CAMPOS_PERFIL = "_id firebaseUid nomeCompleto cpf telefone termos criadoEm atualizadoEm";

// Único arquivo do módulo que conversa com o MongoDB.
export const authRepository: AuthRepository = {
  async buscarPorFirebaseUid(uid) {
    return UsuarioModel.findOne({ firebaseUid: uid }, CAMPOS_PERFIL).lean<PerfilUsuario>();
  },

  async criar(dados) {
    const criado = await UsuarioModel.create(dados);
    return criado.toObject() as unknown as PerfilUsuario;
  },
};
