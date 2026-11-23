import { Types } from "mongoose";
import { UsuarioModel } from "./auth.model";

export interface PerfilUsuario {
  _id: Types.ObjectId;
  firebaseUid: string;
  nomeCompleto: string;
  nomePublico?: string;
  cpf: string;
  telefone: string;
  termos: { versao: string; aceitoEm: Date };
  // Opcional na leitura: perfis de teste antigos foram criados antes deste campo.
  canalCodigoPreferido?: "email" | "sms";
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

export type NovoPerfil = Pick<PerfilUsuario, "firebaseUid" | "nomeCompleto" | "cpf" | "telefone" | "termos"> &
  { canalCodigoPreferido: "email" | "sms" };

// O que propriedades e talhões precisam: achar o _id do usuário logado.
export interface BuscaPerfilPorUid {
  buscarPorFirebaseUid(uid: string): Promise<{ _id: Types.ObjectId } | null>;
}

export interface AuthRepository {
  existeOutroComCampo(campo: 'cpf' | 'telefone', valor: string, excetoUid?: string): Promise<boolean>;
  indicesUnicosProntos(): Promise<boolean>;
  buscarPorFirebaseUid(uid: string): Promise<PerfilUsuario | null>;
  criar(dados: NovoPerfil): Promise<PerfilUsuario>;
  // Grava só se o questionário ainda não existir. Devolve null se o perfil não existe ou já respondeu.
  salvarQuestionario(uid: string, questionario: Questionario): Promise<PerfilUsuario | null>;
  // null apaga o nome público. Devolve null se o perfil não existe.
  atualizarNomePublico(uid: string, nomePublico: string | null): Promise<PerfilUsuario | null>;
}

const CAMPOS_PERFIL = "_id firebaseUid nomeCompleto nomePublico cpf telefone termos canalCodigoPreferido questionario criadoEm atualizadoEm";

// Único arquivo do módulo que conversa com o MongoDB.
export const authRepository: AuthRepository = {
  async indicesUnicosProntos() {
    const indices = await UsuarioModel.collection.indexes();
    return ['cpf', 'telefone'].every(campo => indices.some(indice =>
      indice.unique === true && Object.keys(indice.key).length === 1 && indice.key[campo] === 1 &&
      !indice.sparse && !indice.partialFilterExpression));
  },
  async existeOutroComCampo(campo, valor, excetoUid) {
    return Boolean(await UsuarioModel.exists({ [campo]: valor, ...(excetoUid ? { firebaseUid: { $ne: excetoUid } } : {}) }));
  },
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
      { firebaseUid: uid, 'questionario.concluidoEm': null },
      { $set: { questionario } },
      { new: true, runValidators: true, projection: CAMPOS_PERFIL },
    ).lean<PerfilUsuario>();
  },

  async atualizarNomePublico(uid, nomePublico) {
    return UsuarioModel.findOneAndUpdate(
      { firebaseUid: uid },
      nomePublico === null ? { $unset: { nomePublico: "" } } : { $set: { nomePublico } },
      { new: true, runValidators: true, projection: CAMPOS_PERFIL },
    ).lean<PerfilUsuario>();
  },
};
