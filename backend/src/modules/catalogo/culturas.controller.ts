import { Request, Response } from "express";
import { CulturasService, culturasService } from "./culturas.service";

export const criarCulturasController = (service: CulturasService = culturasService) => ({
  async listar(_req: Request, res: Response) {
    res.json(await service.listar());
  },
});
