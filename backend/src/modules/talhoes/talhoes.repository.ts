import mongoose, { ClientSession, Types } from "mongoose";
import { PropriedadeModel, RegistroPropriedade } from "../propriedades/propriedades.model";
import { propriedadesRepository } from "../propriedades/propriedades.repository";
import { CriarTalhaoDto } from "./talhoes.schema";
import { RegistroTalhao, TalhaoModel } from "./talhoes.model";

export interface TalhoesRepository {
  reservarPropriedade(id: Types.ObjectId, usuarioId: Types.ObjectId, session: ClientSession): Promise<RegistroPropriedade | null>;
  areaDisponivel(id: Types.ObjectId, area: number, session: ClientSession): Promise<boolean>;
  criar(id: Types.ObjectId, dados: CriarTalhaoDto, session: ClientSession): Promise<RegistroTalhao>;
  comTransacao<T>(acao: (session: ClientSession) => Promise<T>): Promise<T>;
}

export const talhoesRepository: TalhoesRepository = {
  async reservarPropriedade(id, usuarioId, session) {
    const propriedade = await PropriedadeModel.findOne({ _id: id, usuarioId }, null, { session })
      .lean<RegistroPropriedade>().exec();
    if (!propriedade) return null;
    // Uma escrita no pai coordena cadastros, redução de área e exclusão.
    const atualizadoEm = new Date(Math.max(Date.now(), propriedade.atualizadoEm.getTime() + 1));
    return PropriedadeModel.findOneAndUpdate({ _id: id, usuarioId },
      { $set: { atualizadoEm } },
      { new: true, session, timestamps: false, runValidators: true, strict: "throw" },
    ).lean<RegistroPropriedade>().exec();
  },
  async areaDisponivel(id, area, session) {
    // Compare no MongoDB, preservando áreas Decimal128 já existentes.
    const resultado = await mongoose.connection.collection("propriedades").aggregate([
      { $match: { _id: id } },
      { $lookup: { from: "talhoes", let: { propriedade: "$_id" }, pipeline: [
        { $match: { $expr: { $and: [
          { $eq: ["$propriedadeId", "$$propriedade"] }, { $eq: ["$ativo", true] },
        ] } } },
        { $group: { _id: null, total: { $sum: "$areaHa" } } },
      ], as: "areas" } },
      { $match: { $expr: { $or: [
        { $eq: [{ $type: "$areaTotalHa" }, "missing"] },
        { $lte: [{ $add: [{ $ifNull: [{ $arrayElemAt: ["$areas.total", 0] }, 0] }, area] }, "$areaTotalHa"] },
      ] } } },
      { $project: { _id: 1 } },
    ], { session }).toArray();
    return resultado.length > 0;
  },
  async criar(propriedadeId, dados, session) {
    const [documento] = await TalhaoModel.create([{ ...dados, propriedadeId }], { session });
    return documento.toObject() as RegistroTalhao;
  },
  comTransacao: acao => propriedadesRepository.comTransacao(acao),
};
