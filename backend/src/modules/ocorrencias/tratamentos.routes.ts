import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { id, resolver } from './ocorrencias.service';
import { PlantacaoModel } from '../plantacoes/plantacoes.model';
import { validarTratamentoNoJava, validarAvaliacaoTratamentoNoJava } from '../../services/validacao-java.service';
import { AppError, NotFoundError, ValidacaoJavaError } from '../../shared/errors';
import { executarIdempotente, respostaIdempotente } from '../../shared/idempotencia';

const data = z.string().datetime({ offset: true }).transform(v => new Date(v));
const tratamento = z.object({ tipoMedida: z.string(), descricao: z.string().trim(), dataAplicacao: data,
  areaTratadaHa: z.number().finite().optional(), produtoUtilizado: z.string().trim().optional(),
  quantidadeUtilizada: z.number().finite().optional(), unidadeQuantidade: z.string().trim().optional(),
  responsavelAplicacao: z.string().trim().optional(), observacoes: z.string().trim().optional() }).strict();
const avaliacao = z.object({ dataAvaliacao: data, resultado: z.string(), observacoes: z.string().trim(),
  monitoramentoId: z.string().regex(/^[a-f\d]{24}$/i).optional() }).strict();

export function criarTratamentosRoutes() {
  const routes = Router({ mergeParams: true });
  const contexto = async (req: any, session?: mongoose.ClientSession) => {
    const plantacaoId = id(String(req.params.plantacaoId));
    const ocorrenciaId = id(String(req.params.ocorrenciaId));
    const origem = await resolver(req.user.uid, plantacaoId, session);
    const ocorrencia = await mongoose.connection.collection('ocorrencias').findOne({ _id: ocorrenciaId, plantacaoId }, { session });
    if (!ocorrencia) throw new NotFoundError('Ocorrência não encontrada');
    return { ...origem, plantacaoId, ocorrenciaId, ocorrencia };
  };
  const reservar = async (c: Awaited<ReturnType<typeof contexto>>, session: mongoose.ClientSession) => {
    if (c.plantacao.status !== 'ativa') throw new AppError(409, 'A plantação deve estar ativa', 'PLANTACAO_ENCERRADA');
    const resultado = await PlantacaoModel.updateOne({ _id: c.plantacaoId, status: 'ativa' }, { $set: { atualizadoEm: new Date(Math.max(Date.now(), c.plantacao.atualizadoEm.getTime() + 1)) } }, { session, timestamps: false });
    if (!resultado.matchedCount) throw new AppError(409, 'A plantação deve estar ativa', 'PLANTACAO_ENCERRADA');
  };
  routes.get('/', async (req, res) => {
    const c = await contexto(req);
    res.json(await mongoose.connection.collection('tratamentos').find({ ocorrenciaId: c.ocorrenciaId }).sort({ dataAplicacao: -1, _id: -1 }).toArray());
  });
  routes.post('/', async (req, res) => {
    const dados = tratamento.parse(req.body);
    const inicial = await contexto(req);
    const anterior = await respostaIdempotente(req.user!.uid, req.baseUrl, req.get('Idempotency-Key'), req.body);
    if (anterior !== undefined) { res.status(201).json(anterior); return; }
    if (inicial.plantacao.status !== 'ativa' || !['aberta', 'em_acompanhamento'].includes(inicial.ocorrencia.status)) throw new AppError(409, 'Plantação ou ocorrência encerrada', 'REGISTRO_ENCERRADO');
    const resultado = await validarTratamentoNoJava(dados, new Date());
    if (!resultado.valido) throw new ValidacaoJavaError(resultado.erros);
    const doc = await mongoose.connection.transaction(async session => executarIdempotente(session, req.user!.uid, req.baseUrl, req.get('Idempotency-Key'), req.body, async () => {
      const c = await contexto(req, session);
      await reservar(c, session);
      if (!['aberta', 'em_acompanhamento'].includes(c.ocorrencia.status)) throw new AppError(409, 'A ocorrência está encerrada', 'OCORRENCIA_ENCERRADA');
      // O write também conflita com encerramento concorrente da mesma ocorrência.
      const reservaOcorrencia = await mongoose.connection.collection('ocorrencias').updateOne(
        { _id: c.ocorrenciaId, plantacaoId: c.plantacaoId, status: { $in: ['aberta', 'em_acompanhamento'] } },
        { $set: { atualizadoEm: new Date(Math.max(Date.now(), c.ocorrencia.atualizadoEm.getTime() + 1)) } }, { session });
      if (!reservaOcorrencia.matchedCount) throw new AppError(409, 'A ocorrência está encerrada', 'OCORRENCIA_ENCERRADA');
      if (dados.dataAplicacao < c.ocorrencia.dataObservacao) throw new AppError(400, 'A aplicação não pode anteceder a ocorrência', 'DATA_ANTERIOR');
      if (dados.areaTratadaHa !== undefined && c.plantacao.areaPlantadaHa !== undefined && !(await PlantacaoModel.exists({ _id: c.plantacaoId, $expr: { $gte: ['$areaPlantadaHa', dados.areaTratadaHa] } }).session(session))) throw new AppError(400, 'A área tratada supera a área plantada', 'AREA_EXCEDIDA');
      const agora = new Date();
      const documento = { ocorrenciaId: c.ocorrenciaId, registradoPor: c.usuario._id, ...dados, criadoEm: agora, atualizadoEm: agora };
      const inserido = await mongoose.connection.collection('tratamentos').insertOne(documento, { session });
      return { _id: inserido.insertedId, ...documento };
    }));
    res.status(201).json(doc);
  });
  routes.get('/:tratamentoId/avaliacoes', async (req, res) => {
    const c = await contexto(req);
    const tratamentoId = id(String(req.params.tratamentoId));
    if (!(await mongoose.connection.collection('tratamentos').findOne({ _id: tratamentoId, ocorrenciaId: c.ocorrenciaId }))) throw new NotFoundError('Tratamento não encontrado');
    res.json(await mongoose.connection.collection('avaliacoes_tratamento').find({ tratamentoId }).sort({ dataAvaliacao: -1, _id: -1 }).toArray());
  });
  routes.post('/:tratamentoId/avaliacoes', async (req, res) => {
    const dados = avaliacao.parse(req.body);
    await contexto(req);
    const anterior = await respostaIdempotente(req.user!.uid, `${req.baseUrl}/${req.params.tratamentoId}/avaliacoes`, req.get('Idempotency-Key'), req.body);
    if (anterior !== undefined) { res.status(201).json(anterior); return; }
    const resultado = await validarAvaliacaoTratamentoNoJava(dados, new Date());
    if (!resultado.valido) throw new ValidacaoJavaError(resultado.erros);
    const doc = await mongoose.connection.transaction(async session => executarIdempotente(session, req.user!.uid, `${req.baseUrl}/${req.params.tratamentoId}/avaliacoes`, req.get('Idempotency-Key'), req.body, async () => {
      const c = await contexto(req, session);
      await reservar(c, session);
      const tratamentoId = id(String(req.params.tratamentoId));
      const existente = await mongoose.connection.collection('tratamentos').findOne({ _id: tratamentoId, ocorrenciaId: c.ocorrenciaId }, { session });
      if (!existente) throw new NotFoundError('Tratamento não encontrado');
      if (dados.dataAvaliacao < existente.dataAplicacao) throw new AppError(400, 'A avaliação não pode anteceder a aplicação', 'DATA_ANTERIOR');
      const monitoramentoId = dados.monitoramentoId ? id(dados.monitoramentoId) : undefined;
      if (monitoramentoId) {
        const m = await mongoose.connection.collection('monitoramentos').findOne({ _id: monitoramentoId, plantacaoId: c.plantacaoId }, { session });
        if (!m || (m.ocorrenciaId && !m.ocorrenciaId.equals(c.ocorrenciaId)) || m.dataObservacao < existente.dataAplicacao || m.dataObservacao > dados.dataAvaliacao) throw new AppError(400, 'Monitoramento incompatível com a avaliação', 'MONITORAMENTO_INVALIDO');
      }
      const { monitoramentoId: _, ...campos } = dados;
      const agora = new Date();
      const documento = { tratamentoId, registradoPor: c.usuario._id, ...campos, ...(monitoramentoId ? { monitoramentoId } : {}), criadoEm: agora, atualizadoEm: agora };
      const inserido = await mongoose.connection.collection('avaliacoes_tratamento').insertOne(documento, { session });
      return { _id: inserido.insertedId, ...documento };
    }));
    res.status(201).json(doc);
  });
  return routes;
}
