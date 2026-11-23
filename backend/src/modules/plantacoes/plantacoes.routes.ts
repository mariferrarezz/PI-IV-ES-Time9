import { Router } from 'express';
import { plantacoesService } from './plantacoes.service';
import { z } from 'zod';

export function criarPlantacoesRoutes() {
  const routes = Router({ mergeParams: true });
  routes.get('/', async (req, res) => { res.json(await plantacoesService.listar(req.user!.uid, String((req.params as { talhaoId: string }).talhaoId))); });
  routes.post('/', async (req, res) => { res.status(201).json(await plantacoesService.criar(req.user!.uid, String((req.params as { talhaoId: string }).talhaoId), req.body)); });
  routes.post('/:plantacaoId/encerrar', async (req, res) => {
    z.object({}).strict().parse(req.body ?? {});
    const params = req.params as { talhaoId?: string; plantacaoId: string };
    res.json(await plantacoesService.encerrar(req.user!.uid, String(params.talhaoId), String(params.plantacaoId)));
  });
  return routes;
}
