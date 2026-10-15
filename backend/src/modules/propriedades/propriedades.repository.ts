import { PropriedadeModel } from "./propriedades.model";
import {
  AtualizarPropriedadeDto,
  CriarPropriedadeDto,
} from "./propriedades.schema";

// Único arquivo do módulo que conversa com o MongoDB.
export const propriedadesRepository = {
  criar(ownerUid: string, dados: CriarPropriedadeDto) {
    return PropriedadeModel.create({ ...dados, ownerUid });
  },

  listarPorUsuario(ownerUid: string) {
    return PropriedadeModel.find({ ownerUid }).sort({ createdAt: -1 });
  },

  buscarPorId(id: string, ownerUid: string) {
    return PropriedadeModel.findOne({ _id: id, ownerUid });
  },

  atualizar(id: string, ownerUid: string, dados: AtualizarPropriedadeDto) {
    return PropriedadeModel.findOneAndUpdate({ _id: id, ownerUid }, dados, {
      new: true,
    });
  },

  excluir(id: string, ownerUid: string) {
    return PropriedadeModel.findOneAndDelete({ _id: id, ownerUid });
  },
};
