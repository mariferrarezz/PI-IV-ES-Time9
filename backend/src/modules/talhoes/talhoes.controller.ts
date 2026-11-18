import { Request, Response } from "express";
import { TalhoesService, talhoesService } from "./talhoes.service";

export const criarTalhoesController = (service: TalhoesService = talhoesService) => ({
  async criar(req: Request, res: Response) {
    const talhao = await service.criar(String(req.params.propriedadeId), req.user!.uid, req.body);
    res.status(201).json(talhao);
  },
});
