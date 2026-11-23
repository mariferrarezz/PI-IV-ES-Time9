import { Router } from 'express';
import { ocorrenciasService } from './ocorrencias.service';

export function criarOcorrenciasRoutes() {
  const routes = Router({ mergeParams: true });
  routes.get('/', async (req, res) => res.json(await ocorrenciasService.listar(req.user!.uid, String((req.params as { plantacaoId: string }).plantacaoId))));
  routes.post('/', async (req, res) => res.status(201).json(await ocorrenciasService.criar(req.user!.uid, String((req.params as { plantacaoId: string }).plantacaoId), req.body)));
  return routes;
}
