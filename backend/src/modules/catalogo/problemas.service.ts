import mongoose, { Types } from 'mongoose';
import { AppError, NotFoundError } from '../../shared/errors';

export interface ConsultaProblemas {
  culturaAtiva(id: Types.ObjectId): Promise<boolean>;
  listarPorCultura(id: Types.ObjectId): Promise<{ _id: Types.ObjectId; nomeComum: string; tipo: string }[]>;
}

export const consultaProblemas: ConsultaProblemas = {
  async culturaAtiva(id) {
    return Boolean(await mongoose.connection.collection('culturas').findOne({ _id: id, ativa: true }, { projection: { _id: 1 } }));
  },
  async listarPorCultura(id) {
    return mongoose.connection.collection<{ _id: Types.ObjectId; nomeComum: string; tipo: string }>('problemas_agricolas')
      .find({ culturasAfetadasIds: id, ativo: true, 'revisaoEditorial.status': 'aprovada' }, { projection: { _id: 1, nomeComum: 1, tipo: 1 } })
      .sort({ nomeComum: 1, _id: 1 }).toArray();
  },
};

export function criarProblemasService(consulta: ConsultaProblemas = consultaProblemas) {
  return {
    async listar(culturaId: string) {
      if (!/^[a-f\d]{24}$/i.test(culturaId)) throw new AppError(400, 'Identificador inválido', 'IDENTIFICADOR_INVALIDO');
      const id = new Types.ObjectId(culturaId);
      if (!await consulta.culturaAtiva(id)) throw new NotFoundError('Cultura não encontrada');
      return (await consulta.listarPorCultura(id)).map(item => ({ id: String(item._id), nome: item.nomeComum, tipo: item.tipo }));
    },
  };
}
export const problemasService = criarProblemasService();
