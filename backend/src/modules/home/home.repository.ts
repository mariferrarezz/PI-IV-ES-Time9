import mongoose, { Types } from "mongoose";
import { PropriedadeModel } from "../propriedades/propriedades.model";
import { TalhaoModel } from "../talhoes/talhoes.model";

export interface PropriedadeResumo {
  _id: Types.ObjectId;
  nome: string;
  municipio: string;
  estado: string;
}

// Consultas só de leitura usadas pela home.
export interface HomeRepository {
  // Propriedade ativa cadastrada mais recentemente pelo usuário (null se não houver).
  propriedadeMaisRecente(usuarioId: Types.ObjectId): Promise<PropriedadeResumo | null>;
  contarTalhoesAtivos(propriedadeId: Types.ObjectId): Promise<number>;
  // Alertas do usuário ainda não lidos e não expirados.
  contarAlertasAtivos(usuarioId: Types.ObjectId, agora: Date): Promise<number>;
}

export const homeRepository: HomeRepository = {
  async propriedadeMaisRecente(usuarioId) {
    return PropriedadeModel.findOne({ usuarioId, ativa: true }, { nome: 1, municipio: 1, estado: 1 })
      .sort({ criadoEm: -1, _id: -1 }).lean<PropriedadeResumo>();
  },
  async contarTalhoesAtivos(propriedadeId) {
    return TalhaoModel.countDocuments({ propriedadeId, ativo: true });
  },
  async contarAlertasAtivos(usuarioId, agora) {
    return mongoose.connection.collection("alertas").countDocuments({
      usuarioId,
      lidoEm: { $exists: false },
      $or: [{ expiraEm: { $exists: false } }, { expiraEm: { $gt: agora } }],
    });
  },
};
