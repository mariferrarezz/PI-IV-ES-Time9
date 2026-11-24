import { Router } from 'express';
import { ocorrenciasService, id, resolver } from './ocorrencias.service';
import mongoose from 'mongoose';
import { NotFoundError } from '../../shared/errors';

export function criarOcorrenciasRoutes() {
  const routes = Router({ mergeParams: true });
  routes.get('/', async (req, res) => res.json(await ocorrenciasService.listar(req.user!.uid, String((req.params as { plantacaoId: string }).plantacaoId))));
  routes.get('/:ocorrenciaId/historico', async (req, res) => {
    const plantacaoId = id(String((req.params as { plantacaoId?: string; ocorrenciaId: string }).plantacaoId)), ocorrenciaId = id(String(req.params.ocorrenciaId));
    await resolver(req.user!.uid, plantacaoId);
    const ocorrencia = await mongoose.connection.collection('ocorrencias').findOne({ _id: ocorrenciaId, plantacaoId });
    if (!ocorrencia) throw new NotFoundError('Ocorrência não encontrada');
    const [monitoramentos, tratamentos] = await Promise.all([
      mongoose.connection.collection('monitoramentos').find({ plantacaoId, ocorrenciaId }).sort({ dataObservacao: -1, _id: -1 }).toArray(),
      mongoose.connection.collection('tratamentos').find({ ocorrenciaId }).sort({ dataAplicacao: -1, _id: -1 }).toArray(),
    ]);
    const avaliacoes = await mongoose.connection.collection('avaliacoes_tratamento').find({ tratamentoId: { $in: tratamentos.map(t => t._id) } }).sort({ dataAvaliacao: -1, _id: -1 }).toArray();
    res.json({ ocorrencia, monitoramentos, tratamentos: tratamentos.map(t => ({ ...t, avaliacoes: avaliacoes.filter(a => String(a.tratamentoId) === String(t._id)) })) });
  });
  routes.post('/', async (req, res) => res.status(201).json(await ocorrenciasService.criar(req.user!.uid, String((req.params as { plantacaoId: string }).plantacaoId), req.body, req.get('Idempotency-Key'))));
  return routes;
}
