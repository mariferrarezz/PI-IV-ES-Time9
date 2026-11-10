import { Request, Response } from "express";
import { propriedadesService, PropriedadesService } from "./propriedades.service";

// Recebe a requisição, chama o service e devolve a resposta. Sem lógica de negócio.
export const criarPropriedadesController = (service: PropriedadesService = propriedadesService) => ({
  async criar(req: Request, res: Response) {
    const propriedade = await service.criar(req.user!.uid, req.body);
    res.status(201).json(propriedade);
  },

  async listar(req: Request, res: Response) {
    res.json(await service.listar(req.user!.uid));
  },

  async buscar(req: Request, res: Response) {
    res.json(await service.buscar(String(req.params.id), req.user!.uid));
  },

  async atualizar(req: Request, res: Response) {
    res.json(
      await service.atualizar(String(req.params.id), req.user!.uid, req.body),
    );
  },

  async excluir(req: Request, res: Response) {
    await service.excluir(String(req.params.id), req.user!.uid);
    res.status(204).send();
  },
});
export const propriedadesController = criarPropriedadesController();
