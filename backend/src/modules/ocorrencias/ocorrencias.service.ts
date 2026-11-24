import mongoose, { ClientSession, Types } from 'mongoose';
import { authRepository } from '../auth/auth.repository';
import { PlantacaoModel } from '../plantacoes/plantacoes.model';
import { TalhaoModel } from '../talhoes/talhoes.model';
import { PropriedadeModel } from '../propriedades/propriedades.model';
import { validarOcorrenciaNoJava } from '../../services/validacao-java.service';
import { AppError, NotFoundError, ValidacaoJavaError } from '../../shared/errors';
import { ocorrenciaEntradaSchema } from './ocorrencias.schema';
import { executarIdempotente, respostaIdempotente } from '../../shared/idempotencia';

export function id(val: string) {
  if (!/^[a-f\d]{24}$/i.test(val)) throw new AppError(400, 'Identificador inválido', 'IDENTIFICADOR_INVALIDO');
  return new Types.ObjectId(val);
}

export async function resolver(uid: string, plantacaoId: Types.ObjectId, session?: ClientSession) {
  const usuario = await authRepository.buscarPorFirebaseUid(uid);
  if (!usuario) throw new AppError(403, 'Perfil do usuário não cadastrado', 'PERFIL_AUSENTE');
  const plantacao = await PlantacaoModel.findById(plantacaoId).session(session ?? null).lean();
  if (!plantacao) throw new NotFoundError('Plantação não encontrada');
  const talhao = await TalhaoModel.findById(plantacao.talhaoId).session(session ?? null).lean();
  if (!talhao) throw new NotFoundError('Plantação não encontrada');
  const propriedade = await PropriedadeModel.findOne({ _id: talhao.propriedadeId, usuarioId: usuario._id }).session(session ?? null).lean();
  if (!propriedade) throw new NotFoundError('Plantação não encontrada');
  return { usuario, plantacao, talhao, propriedade };
}

export const ocorrenciasService = {
  async listar(uid: string, plantacaoTexto: string) {
    const plantacaoId = id(plantacaoTexto);
    await resolver(uid, plantacaoId);
    const ocorrencias = await mongoose.connection.collection('ocorrencias').find({ plantacaoId }).sort({ dataObservacao: -1, _id: -1 }).toArray();
    const ids = ocorrencias.flatMap(o => o.problemaAgricolaId ? [o.problemaAgricolaId] : []);
    const problemas = await mongoose.connection.collection('problemas_agricolas').find({ _id: { $in: ids } }, { projection: { nomeComum: 1 } }).toArray();
    const nomes = new Map(problemas.map(p => [String(p._id), p.nomeComum]));
    return ocorrencias.map(o => ({ ...o, problemaNome: o.problemaAgricolaId ? nomes.get(String(o.problemaAgricolaId)) ?? null : null }));
  },
  async criar(uid: string, plantacaoTexto: string, entrada: unknown, chave?: string) {
    const plantacaoId = id(plantacaoTexto);
    const caminho = `/plantacoes/${plantacaoId}/ocorrencias`;
    const dados = ocorrenciaEntradaSchema.parse(entrada);
    const origem = await resolver(uid, plantacaoId);
    const anterior = await respostaIdempotente<object>(uid, caminho, chave, entrada);
    if (anterior) return anterior;
    if (origem.plantacao.status !== 'ativa') throw new AppError(409, 'A plantação deve estar ativa', 'PLANTACAO_ENCERRADA');
    const problemaId = dados.problemaAgricolaId ? id(dados.problemaAgricolaId) : undefined;
    const validarProblema = async (culturaId: Types.ObjectId, session?: ClientSession) => {
      if (!problemaId) return;
      const problema = await mongoose.connection.collection('problemas_agricolas').findOne({
        _id: problemaId, tipo: dados.tipo, culturasAfetadasIds: culturaId,
        ativo: true, 'revisaoEditorial.status': 'aprovada',
      }, { session });
      if (!problema) throw new AppError(400, 'Problema indisponível ou incompatível com a cultura', 'PROBLEMA_INDISPONIVEL');
    };
    await validarProblema(origem.plantacao.culturaId);
    const validacao = await validarOcorrenciaNoJava({ ...dados, problemaAgricolaPresente: Boolean(problemaId), status: 'aberta' }, new Date());
    if (!validacao.valido) throw new ValidacaoJavaError(validacao.erros);
    try { return await mongoose.connection.transaction(async session => executarIdempotente(session, uid, caminho, chave, entrada, async () => {
      const atual = await resolver(uid, plantacaoId, session);
      if (atual.plantacao.status !== 'ativa') throw new AppError(409, 'A plantação deve estar ativa', 'PLANTACAO_ENCERRADA');
      await validarProblema(atual.plantacao.culturaId, session);
      if (dados.areaAfetadaHa !== undefined && atual.plantacao.areaPlantadaHa !== undefined) {
        const compativel = await PlantacaoModel.exists({ _id: plantacaoId, $expr: { $gte: ['$areaPlantadaHa', dados.areaAfetadaHa] } }).session(session);
        if (!compativel) throw new AppError(409, 'A área afetada não pode superar a área plantada', 'AREA_EXCEDIDA');
      }
      const reserva = await PlantacaoModel.updateOne({ _id: plantacaoId, status: 'ativa' }, { $set: { atualizadoEm: new Date(Math.max(Date.now(), atual.plantacao.atualizadoEm.getTime() + 1)) } }, { session, timestamps: false });
      if (!reserva.matchedCount) throw new AppError(409, 'A plantação deve estar ativa', 'PLANTACAO_ENCERRADA');
      const agora = new Date();
      const ocorrenciaId = new Types.ObjectId();
      const documento = { _id: ocorrenciaId, plantacaoId, registradoPor: atual.usuario._id,
        tipo: dados.tipo, ...(problemaId ? { problemaAgricolaId: problemaId } : {}),
        dataObservacao: dados.dataObservacao, sintomas: dados.sintomas, intensidade: dados.intensidade,
        ...(dados.areaAfetadaHa === undefined ? {} : { areaAfetadaHa: dados.areaAfetadaHa }),
        status: 'aberta', criadoEm: agora, atualizadoEm: agora };
      await mongoose.connection.collection('ocorrencias').insertOne(documento, { session });
      if (dados.intensidade === 'alta') {
        await mongoose.connection.collection('alertas').updateOne(
          { tipo: 'ocorrencia_intensidade_alta', 'contexto.tipo': 'ocorrencia', 'contexto.id': ocorrenciaId },
          { $setOnInsert: { usuarioId: atual.usuario._id, tipo: 'ocorrencia_intensidade_alta', titulo: 'Ocorrência de alta intensidade', mensagem: 'Uma ocorrência de alta intensidade foi registrada.', prioridade: 'alta', contexto: { tipo: 'ocorrencia', id: ocorrenciaId }, criadoEm: agora } },
          { upsert: true, session },
        );
      }
      return documento;
    })); } catch (erro) {
      if ((erro as { code?: number }).code === 11000 && chave) {
        const repeticao = await respostaIdempotente<object>(uid, caminho, chave, entrada);
        if (repeticao) return repeticao;
      }
      throw erro;
    }
  },
};
