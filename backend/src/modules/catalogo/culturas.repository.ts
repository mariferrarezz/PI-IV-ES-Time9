import { Types } from "mongoose";
import { CulturaModel } from "./culturas.model";

export interface Cultura {
  _id: Types.ObjectId;
  nome: string;
}

export interface CulturasRepository {
  listarAtivas(): Promise<Cultura[]>;
  // Quantas das culturas informadas existem e estão ativas.
  contarAtivas(ids: Types.ObjectId[]): Promise<number>;
}

// Único arquivo do módulo que conversa com o MongoDB.
export const culturasRepository: CulturasRepository = {
  async listarAtivas() {
    return CulturaModel.find({ ativa: true }, "_id nome").sort({ nome: 1 }).lean<Cultura[]>();
  },

  async contarAtivas(ids) {
    if (ids.length === 0) return 0;
    return CulturaModel.countDocuments({ _id: { $in: ids }, ativa: true });
  },
};
