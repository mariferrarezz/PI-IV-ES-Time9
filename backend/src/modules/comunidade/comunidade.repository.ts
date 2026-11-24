import mongoose, { Types } from 'mongoose';
import { authRepository } from '../auth/auth.repository';
import { PlantacaoModel } from '../plantacoes/plantacoes.model';
import { TalhaoModel } from '../talhoes/talhoes.model';
import { PropriedadeModel } from '../propriedades/propriedades.model';
import { AppError, NotFoundError } from '../../shared/errors';
import { executarIdempotente, respostaIdempotente } from '../../shared/idempotencia';

export interface UsuarioComunidade { _id: Types.ObjectId; nomePublico?: string }

// Dados privados de origem, já conferidos como do próprio usuário.
export interface OrigemExperiencia {
  ocorrencia: { _id: Types.ObjectId; tipo: string; status: string; problemaAgricolaId?: Types.ObjectId };
  culturaId: Types.ObjectId; culturaNome: string; problemaNome?: string;
  regiao: { municipio: string; estado: string };
  tratamento?: { _id: Types.ObjectId; tipoMedida: string; descricao: string };
  avaliacao?: { _id: Types.ObjectId; resultado: string; dataAvaliacao: Date };
}

export interface Idempotencia { uid: string; caminho: string; chave?: string; entrada: unknown }

export interface ComunidadeRepository {
  buscarUsuario(uid: string): Promise<UsuarioComunidade | null>;
  carregarOrigem(usuarioId: Types.ObjectId, ocorrenciaId: Types.ObjectId, tratamentoId?: Types.ObjectId, avaliacaoId?: Types.ObjectId): Promise<OrigemExperiencia>;
  respostaAnterior(i: Idempotencia): Promise<object | undefined>;
  /** Grava a experiência, recusando se a ocorrência já tiver uma publicação não retirada. */
  inserirExperiencia(documento: Record<string, unknown> & { _id: Types.ObjectId; ocorrenciaOrigemId: Types.ObjectId; autorId: Types.ObjectId }, i: Idempotencia): Promise<object>;
  listarDoAutor(autorId: Types.ObjectId): Promise<Record<string, any>[]>;
  buscarDoAutor(autorId: Types.ObjectId, experienciaId: Types.ObjectId): Promise<Record<string, any> | null>;
  /** Troca para retirada só se o documento não mudou desde a leitura. */
  marcarRetirada(experienciaId: Types.ObjectId, autorId: Types.ObjectId, atualizadoEmAnterior: Date, agora: Date): Promise<boolean>;
}

const colecao = (nome: string) => mongoose.connection.collection(nome);
const naoEncontrada = () => new NotFoundError('Ocorrência não encontrada');

export const comunidadeRepository: ComunidadeRepository = {
  async buscarUsuario(uid) {
    const u = await authRepository.buscarPorFirebaseUid(uid);
    return u ? { _id: u._id as Types.ObjectId, nomePublico: u.nomePublico ?? undefined } : null;
  },

  async carregarOrigem(usuarioId, ocorrenciaId, tratamentoId, avaliacaoId) {
    const ocorrencia = await colecao('ocorrencias').findOne({ _id: ocorrenciaId });
    if (!ocorrencia) throw naoEncontrada();
    const plantacao = await PlantacaoModel.findById(ocorrencia.plantacaoId).lean();
    const talhao = plantacao && await TalhaoModel.findById(plantacao.talhaoId).lean();
    const propriedade = talhao && await PropriedadeModel.findOne({ _id: talhao.propriedadeId, usuarioId }).lean();
    // Ocorrência de outra pessoa responde igual a inexistente.
    if (!plantacao || !propriedade) throw naoEncontrada();
    const cultura = await colecao('culturas').findOne({ _id: plantacao.culturaId }, { projection: { nome: 1 } });
    if (!cultura) throw new AppError(409, 'Cultura da plantação indisponível', 'CULTURA_INDISPONIVEL');
    let problemaNome: string | undefined;
    if (ocorrencia.problemaAgricolaId) {
      const problema = await colecao('problemas_agricolas').findOne({ _id: ocorrencia.problemaAgricolaId }, { projection: { nomeComum: 1 } });
      problemaNome = problema?.nomeComum;
    }
    let tratamento: OrigemExperiencia['tratamento'];
    if (tratamentoId) {
      const t = await colecao('tratamentos').findOne({ _id: tratamentoId, ocorrenciaId });
      if (!t) throw new NotFoundError('Tratamento não encontrado');
      tratamento = { _id: t._id, tipoMedida: t.tipoMedida, descricao: t.descricao };
    }
    let avaliacao: OrigemExperiencia['avaliacao'];
    if (avaliacaoId) {
      const a = await colecao('avaliacoes_tratamento').findOne({ _id: avaliacaoId, tratamentoId });
      if (!a) throw new NotFoundError('Avaliação não encontrada');
      avaliacao = { _id: a._id, resultado: a.resultado, dataAvaliacao: a.dataAvaliacao };
    }
    return {
      ocorrencia: { _id: ocorrencia._id, tipo: ocorrencia.tipo, status: ocorrencia.status, problemaAgricolaId: ocorrencia.problemaAgricolaId },
      culturaId: plantacao.culturaId as Types.ObjectId, culturaNome: cultura.nome, problemaNome,
      regiao: { municipio: propriedade.municipio, estado: propriedade.estado }, tratamento, avaliacao,
    };
  },

  respostaAnterior: i => respostaIdempotente<object>(i.uid, i.caminho, i.chave, i.entrada),

  async inserirExperiencia(documento, i) {
    const executar = () => mongoose.connection.transaction(session => executarIdempotente(session, i.uid, i.caminho, i.chave, i.entrada, async () => {
      // Escrever na ocorrência serializa duas publicações simultâneas da mesma ocorrência.
      const ocorrencia = await colecao('ocorrencias').findOne({ _id: documento.ocorrenciaOrigemId }, { session });
      if (!ocorrencia) throw naoEncontrada();
      await colecao('ocorrencias').updateOne({ _id: ocorrencia._id },
        { $set: { atualizadoEm: new Date(Math.max(Date.now(), ocorrencia.atualizadoEm.getTime() + 1)) } }, { session });
      const existente = await colecao('experiencias_comunidade').findOne(
        { ocorrenciaOrigemId: documento.ocorrenciaOrigemId, autorId: documento.autorId, 'moderacao.status': { $ne: 'retirada' } }, { session });
      if (existente) throw new AppError(409, 'Esta ocorrência já foi compartilhada na Comunidade', 'EXPERIENCIA_JA_PUBLICADA');
      await colecao('experiencias_comunidade').insertOne(documento, { session });
      return { _id: documento._id, status: 'aprovada' };
    }));
    try { return await executar(); } catch (erro) {
      if ((erro as { code?: number }).code === 11000 && i.chave) {
        const repeticao = await respostaIdempotente<object>(i.uid, i.caminho, i.chave, i.entrada);
        if (repeticao) return repeticao;
      }
      throw erro;
    }
  },

  listarDoAutor: autorId => colecao('experiencias_comunidade')
    .find({ autorId, 'moderacao.status': { $ne: 'retirada' } }).sort({ criadoEm: -1, _id: -1 }).toArray(),

  buscarDoAutor: (autorId, experienciaId) => colecao('experiencias_comunidade').findOne({ _id: experienciaId, autorId }),

  async marcarRetirada(experienciaId, autorId, atualizadoEmAnterior, agora) {
    const r = await colecao('experiencias_comunidade').updateOne(
      { _id: experienciaId, autorId, atualizadoEm: atualizadoEmAnterior, 'moderacao.status': { $in: ['aprovada', 'pendente'] } },
      { $set: { 'moderacao.status': 'retirada', atualizadoEm: agora } });
    return r.matchedCount === 1;
  },
};
