import { Request, Response } from "express";
import { propriedadesService } from "./propriedades.service";

// Recebe a requisição, chama o service e devolve a resposta. Sem lógica de negócio.
export const propriedadesController = {
  async criar(req: Request, res: Response) {
    const propriedade = await propriedadesService.criar(req.user!.uid, req.body);
    res.status(201).json(propriedade);
  },

  async listar(req: Request, res: Response) {
    res.json(await propriedadesService.listar(req.user!.uid));
  },

  async buscar(req: Request, res: Response) {
    res.json(await propriedadesService.buscar(String(req.params.id), req.user!.uid));
  },

  async atualizar(req: Request, res: Response) {
    res.json(
      await propriedadesService.atualizar(String(req.params.id), req.user!.uid, req.body),
    );
  },

  async excluir(req: Request, res: Response) {
    await propriedadesService.excluir(String(req.params.id), req.user!.uid);
    res.status(204).send();
  },
};
