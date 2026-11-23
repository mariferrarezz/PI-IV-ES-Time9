import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { id, resolver } from './ocorrencias.service';
import { validarMonitoramentoNoJava } from '../../services/validacao-java.service';
import { AppError, ValidacaoJavaError } from '../../shared/errors';
import { PlantacaoModel } from '../plantacoes/plantacoes.model';
import { executarIdempotente, respostaIdempotente } from '../../shared/idempotencia';

const data = z.string().datetime({ offset: true }).transform(v => new Date(v));
const entrada = z.object({
  ocorrenciaId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  dataObservacao: data, problemaObservado: z.boolean(), observacoes: z.string().trim().max(5000),
  intensidade: z.string().max(100).optional(), evolucao: z.string().max(100).optional(),
  areaAfetadaHa: z.number().finite().optional(), proximaInspecaoEm: data.optional(),
}).strict();

export function criarMonitoramentosRoutes() {
  const routes = Router({ mergeParams: true });
  routes.get('/', async (req, res) => {
    const plantacaoId = id(String((req.params as { plantacaoId: string }).plantacaoId));
    await resolver(req.user!.uid, plantacaoId);
    res.json(await mongoose.connection.collection('monitoramentos').find({ plantacaoId }).sort({ dataObservacao: -1, _id: -1 }).toArray());
  });
  routes.post('/', async (req, res) => {
    const plantacaoId = id(String((req.params as { plantacaoId: string }).plantacaoId));
    const dados = entrada.parse(req.body);
    const origem = await resolver(req.user!.uid, plantacaoId);
    const anterior = await respostaIdempotente(req.user!.uid, req.baseUrl, req.get('Idempotency-Key'), req.body);
    if (anterior !== undefined) { res.status(201).json(anterior); return; }
    if (origem.plantacao.status !== 'ativa') throw new AppError(409, 'A plantação deve estar ativa', 'PLANTACAO_ENCERRADA');
    const ocorrenciaId = dados.ocorrenciaId ? id(dados.ocorrenciaId) : undefined;
    const validacao = await validarMonitoramentoNoJava({ ...dados, ocorrenciaPresente: !!ocorrenciaId }, new Date());
    if (!validacao.valido) throw new ValidacaoJavaError(validacao.erros);
    const documento = await mongoose.connection.transaction(async session => executarIdempotente(session, req.user!.uid, req.baseUrl, req.get('Idempotency-Key'), req.body, async () => {
      const atual = await resolver(req.user!.uid, plantacaoId, session);
      if (atual.plantacao.status !== 'ativa') throw new AppError(409, 'A plantação deve estar ativa', 'PLANTACAO_ENCERRADA');
      if (ocorrenciaId) {
        const ocorrencia = await mongoose.connection.collection('ocorrencias').findOne({ _id: ocorrenciaId, plantacaoId }, { session });
        if (!ocorrencia) throw new AppError(404, 'Ocorrência não encontrada', 'OCORRENCIA_NAO_ENCONTRADA');
        if (dados.dataObservacao < ocorrencia.dataObservacao) throw new AppError(400, 'A observação não pode anteceder a ocorrência', 'DATA_ANTERIOR');
      }
      if (dados.areaAfetadaHa !== undefined && atual.plantacao.areaPlantadaHa !== undefined) {
        const compativel = await PlantacaoModel.exists({ _id: plantacaoId, $expr: { $gte: ['$areaPlantadaHa', dados.areaAfetadaHa] } }).session(session);
        if (!compativel) throw new AppError(409, 'A área afetada não pode superar a área plantada', 'AREA_EXCEDIDA');
      }
      const reserva = await PlantacaoModel.updateOne({ _id: plantacaoId, status: 'ativa' }, { $set: { atualizadoEm: new Date(Math.max(Date.now(), atual.plantacao.atualizadoEm.getTime() + 1)) } }, { session, timestamps: false });
      if (!reserva.matchedCount) throw new AppError(409, 'A plantação deve estar ativa', 'PLANTACAO_ENCERRADA');
      const { ocorrenciaId: _, ...campos } = dados;
      const agora = new Date();
      const registro = { plantacaoId, registradoPor: atual.usuario._id, ...campos, ...(ocorrenciaId ? { ocorrenciaId } : {}), criadoEm: agora, atualizadoEm: agora };
      const resultado = await mongoose.connection.collection('monitoramentos').insertOne(registro, { session });
      return { _id: resultado.insertedId, ...registro };
    }));
    res.status(201).json(documento);
  });
  return routes;
}
