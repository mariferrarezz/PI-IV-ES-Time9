import { Router } from 'express';
import { plantacoesService } from './plantacoes.service';

export function criarPlantacoesRoutes() {
  const routes = Router({ mergeParams: true });
  routes.get('/', async (req, res) => { res.json(await plantacoesService.listar(req.user!.uid, String((req.params as { talhaoId: string }).talhaoId))); });
  routes.post('/', async (req, res) => { res.status(201).json(await plantacoesService.criar(req.user!.uid, String((req.params as { talhaoId: string }).talhaoId), req.body)); });
  return routes;
}
