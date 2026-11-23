import mongoose, { ClientSession, Types } from 'mongoose';
import { authRepository } from '../auth/auth.repository';
import { CulturaModel } from '../catalogo/culturas.model';
import { PropriedadeModel } from '../propriedades/propriedades.model';
import { TalhaoModel } from '../talhoes/talhoes.model';
import { validarPlantacaoNoJava } from '../../services/validacao-java.service';
import { AppError, NotFoundError, ValidacaoJavaError } from '../../shared/errors';
import { PlantacaoModel } from './plantacoes.model';
import { plantacaoEntradaSchema } from './plantacoes.schema';

const objectId = (valor: string) => {
  if (!/^[a-f\d]{24}$/i.test(valor)) throw new AppError(400, 'Identificador inválido', 'IDENTIFICADOR_INVALIDO');
  return new Types.ObjectId(valor);
};

async function autorizado(talhaoId: Types.ObjectId, uid: string, session?: ClientSession) {
  const perfil = await authRepository.buscarPorFirebaseUid(uid);
  if (!perfil) throw new AppError(403, 'Perfil do usuário não cadastrado', 'PERFIL_AUSENTE');
  const talhao = await TalhaoModel.findById(talhaoId).session(session ?? null).lean();
  if (!talhao) throw new NotFoundError('Talhão não encontrado');
  const propriedade = await PropriedadeModel.findOne({ _id: talhao.propriedadeId, usuarioId: perfil._id }).session(session ?? null).lean();
  if (!propriedade) throw new NotFoundError('Talhão não encontrado');
  return { talhao, propriedade };
}

export function criarPlantacoesService(validar = validarPlantacaoNoJava) {
 return {
  async listar(uid: string, id: string) {
    const talhaoId = objectId(id);
    await autorizado(talhaoId, uid);
    const plantacoes = await PlantacaoModel.find({ talhaoId }).sort({ criadoEm: -1 }).lean();
    const culturas = await CulturaModel.find({ _id: { $in: plantacoes.map(p => p.culturaId) } }, { nome: 1 }).lean();
    const nomes = new Map(culturas.map(c => [String(c._id), c.nome]));
    return plantacoes.map(p => ({ ...p, culturaNome: nomes.get(String(p.culturaId)) ?? null }));
  },
  async criar(uid: string, id: string, entrada: unknown) {
    const talhaoId = objectId(id);
    const dados = plantacaoEntradaSchema.parse(entrada);
    const inicial = await autorizado(talhaoId, uid);
    if (!inicial.talhao.ativo || !inicial.propriedade.ativa) throw new AppError(409, 'Talhão ou propriedade inativa', 'REFERENCIA_INATIVA');
    const culturaId = objectId(dados.culturaId);
    if (!await CulturaModel.exists({ _id: culturaId, ativa: true })) throw new AppError(400, 'Cultura inexistente ou indisponível', 'CULTURA_INDISPONIVEL');
    const resultado = await validar(dados, new Date());
    if (!resultado.valido) throw new ValidacaoJavaError(resultado.erros);
    try {
      return await mongoose.connection.transaction(async session => {
        const atual = await autorizado(talhaoId, uid, session);
        if (!atual.talhao.ativo || !atual.propriedade.ativa) throw new AppError(409, 'Talhão ou propriedade inativa', 'REFERENCIA_INATIVA');
        if (!await CulturaModel.exists({ _id: culturaId, ativa: true }).session(session)) throw new AppError(400, 'Cultura inexistente ou indisponível', 'CULTURA_INDISPONIVEL');
        if (dados.areaPlantadaHa !== undefined && !await TalhaoModel.exists({ _id: talhaoId, $expr: { $gte: ['$areaHa', dados.areaPlantadaHa] } }).session(session)) {
          throw new AppError(409, 'A área plantada não pode superar a área do talhão', 'AREA_EXCEDIDA');
        }
        if (dados.status === 'ativa' && await PlantacaoModel.exists({ talhaoId, status: 'ativa' }).session(session)) throw new AppError(409, 'O talhão já possui plantação ativa', 'PLANTACAO_ATIVA');
        // Escrita no talhão coordena cadastros concorrentes com mudanças futuras no pai.
        const reservaPropriedade = await PropriedadeModel.updateOne({ _id: atual.propriedade._id, ativa: true }, { $set: { atualizadoEm: new Date(Math.max(Date.now(), atual.propriedade.atualizadoEm.getTime() + 1)) } }, { session, timestamps: false });
        const reservaTalhao = await TalhaoModel.updateOne({ _id: talhaoId, ativo: true }, { $set: { atualizadoEm: new Date(Math.max(Date.now(), atual.talhao.atualizadoEm.getTime() + 1)) } }, { session, timestamps: false });
        if (!reservaPropriedade.matchedCount || !reservaTalhao.matchedCount) throw new AppError(409, 'Talhão ou propriedade inativa', 'REFERENCIA_INATIVA');
        const [criada] = await PlantacaoModel.create([{ ...dados, talhaoId, culturaId }], { session });
        return criada.toObject();
      });
    } catch (erro) {
      if ((erro as { code?: number }).code === 11000) throw new AppError(409, 'O talhão já possui plantação ativa', 'PLANTACAO_ATIVA');
      throw erro;
    }
  },
  async encerrar(uid: string, id: string, plantacaoTexto: string) {
    const talhaoId = objectId(id), plantacaoId = objectId(plantacaoTexto);
    await autorizado(talhaoId, uid);
    const original = await PlantacaoModel.findOne({ _id: plantacaoId, talhaoId }).lean();
    if (!original) throw new NotFoundError('Plantação não encontrada');
    if (original.status !== 'ativa') throw new AppError(409, 'A plantação já está encerrada', 'PLANTACAO_ENCERRADA');
    const agora = new Date();
    const resultado = await validar({ status: 'encerrada', dataPlantio: original.dataPlantio ?? undefined, dataEncerramento: agora }, agora);
    if (!resultado.valido) throw new ValidacaoJavaError(resultado.erros);
    return mongoose.connection.transaction(async session => {
      await autorizado(talhaoId, uid, session);
      const atual = await PlantacaoModel.findOne({ _id: plantacaoId, talhaoId }).session(session).lean();
      if (!atual) throw new NotFoundError('Plantação não encontrada');
      if (atual.status !== 'ativa') throw new AppError(409, 'A plantação já está encerrada', 'PLANTACAO_ENCERRADA');
      if (atual.dataPlantio?.getTime() !== original.dataPlantio?.getTime()) {
        throw new AppError(409, 'A plantação foi alterada. Atualize os dados e tente novamente.', 'PLANTACAO_ALTERADA');
      }
      const encerrada = await PlantacaoModel.findOneAndUpdate(
        { _id: plantacaoId, talhaoId, status: 'ativa' },
        { $set: { status: 'encerrada', dataEncerramento: agora } },
        { new: true, session, runValidators: true },
      ).lean();
      if (!encerrada) throw new AppError(409, 'A plantação já está encerrada', 'PLANTACAO_ENCERRADA');
      return encerrada;
    });
  },
 };
}
export const plantacoesService = criarPlantacoesService();
