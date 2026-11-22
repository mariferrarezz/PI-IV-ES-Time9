import mongoose, { ClientSession, Types } from "mongoose";
import { PropriedadeModel, RegistroPropriedade } from "./propriedades.model";
import { AtualizarPropriedadeDto, CriarPropriedadeDto } from "./propriedades.schema";

export interface PropriedadesRepository {
  criar(usuarioId: Types.ObjectId, dados: CriarPropriedadeDto): Promise<RegistroPropriedade>;
  listarPorUsuario(usuarioId: Types.ObjectId): Promise<RegistroPropriedade[]>;
  buscarPorId(id: Types.ObjectId, usuarioId: Types.ObjectId, session?: ClientSession): Promise<RegistroPropriedade | null>;
  atualizar(id: Types.ObjectId, usuarioId: Types.ObjectId, dados: AtualizarPropriedadeDto, session: ClientSession): Promise<RegistroPropriedade | null>;
  excluir(id: Types.ObjectId, usuarioId: Types.ObjectId, session: ClientSession): Promise<boolean>;
  temTalhoes(id: Types.ObjectId, session: ClientSession): Promise<boolean>;
  areaAtivaExcede(id: Types.ObjectId, area: number, session: ClientSession): Promise<boolean>;
  comTransacao<T>(acao: (session: ClientSession) => Promise<T>): Promise<T>;
}

export const propriedadesRepository: PropriedadesRepository = {
  async criar(usuarioId, dados) {
    const documento = await PropriedadeModel.create({ ...dados, usuarioId });
    return documento.toObject() as RegistroPropriedade;
  },
  listarPorUsuario(usuarioId) {
    return PropriedadeModel.find({ usuarioId }).lean<RegistroPropriedade[]>().exec();
  },
  buscarPorId(id, usuarioId, session) {
    return PropriedadeModel.findOne({ _id: id, usuarioId }, null, { session }).lean<RegistroPropriedade>().exec();
  },
  atualizar(id, usuarioId, dados, session) {
    return PropriedadeModel.findOneAndUpdate({ _id: id, usuarioId }, { $set: dados }, {
      new: true, runValidators: true, strict: "throw", session,
    }).lean<RegistroPropriedade>().exec();
  },
  async excluir(id, usuarioId, session) {
    return (await PropriedadeModel.deleteOne({ _id: id, usuarioId }, { session })).deletedCount === 1;
  },
  async temTalhoes(id, session) {
    return Boolean(await mongoose.connection.collection("talhoes").findOne(
      { propriedadeId: id }, { session, projection: { _id: 1 } },
    ));
  },
  async areaAtivaExcede(id, area, session) {
    // Comparação no servidor preserva a precisão de áreas Decimal128 existentes.
    const excedentes = await mongoose.connection.collection("talhoes").aggregate([
      { $match: { propriedadeId: id, ativo: true } },
      { $group: { _id: null, total: { $sum: "$areaHa" } } },
      { $match: { total: { $gt: area } } }, { $limit: 1 },
    ], { session }).toArray();
    return excedentes.length > 0;
  },
  comTransacao(acao) {
    return mongoose.connection.transaction(acao, {
      readConcern: { level: "snapshot" }, writeConcern: { w: "majority" }, readPreference: "primary",
    });
  },
};
