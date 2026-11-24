import { Router } from 'express';
import mongoose from 'mongoose';
import { id } from './ocorrencias.service';
import { authRepository } from '../auth/auth.repository';
import { TalhaoModel } from '../talhoes/talhoes.model';
import { PropriedadeModel } from '../propriedades/propriedades.model';
import { PlantacaoModel } from '../plantacoes/plantacoes.model';
import { NotFoundError } from '../../shared/errors';

export function criarDetalheTalhaoRoutes() {
  const routes = Router({ mergeParams: true });
  routes.get('/', async (req, res) => {
    const talhaoId = id(String((req.params as { talhaoId: string }).talhaoId));
    const usuario = await authRepository.buscarPorFirebaseUid(req.user!.uid);
    if (!usuario) throw new NotFoundError('Talhão não encontrado');
    const talhao = await TalhaoModel.findById(talhaoId).lean();
    if (!talhao) throw new NotFoundError('Talhão não encontrado');
    const propriedade = await PropriedadeModel.findOne({ _id: talhao.propriedadeId, usuarioId: usuario._id }).lean();
    if (!propriedade) throw new NotFoundError('Talhão não encontrado');
    const plantacoes = await PlantacaoModel.find({ talhaoId }).sort({ criadoEm: -1, _id: -1 }).lean();
    const ocorrencias = await mongoose.connection.collection('ocorrencias').find({ plantacaoId: { $in: plantacoes.map(p => p._id) } }).sort({ dataObservacao: -1, _id: -1 }).toArray();
    const [culturas, problemas] = await Promise.all([
      mongoose.connection.collection('culturas').find({ _id: { $in: plantacoes.map(p => p.culturaId) } }, { projection: { nome: 1 } }).toArray(),
      mongoose.connection.collection('problemas_agricolas').find({ _id: { $in: ocorrencias.flatMap(o => o.problemaAgricolaId ? [o.problemaAgricolaId] : []) } }, { projection: { nomeComum: 1 } }).toArray(),
    ]);
    const culturasPorId = new Map(culturas.map(c => [String(c._id), c.nome]));
    const problemasPorId = new Map(problemas.map(p => [String(p._id), p.nomeComum]));
    res.json({ talhao, propriedade: { _id: propriedade._id, nome: propriedade.nome }, plantacoes: plantacoes.map(p => ({
      ...p, culturaNome: culturasPorId.get(String(p.culturaId)) ?? null,
      ocorrencias: ocorrencias.filter(o => String(o.plantacaoId) === String(p._id)).map(o => ({ ...o, problemaNome: problemasPorId.get(String(o.problemaAgricolaId)) ?? null })),
    })) });
  });
  return routes;
}
