import { Request, Response } from "express";
import { AuthService, authService } from "./auth.service";

// Recebe a requisição, chama o service e devolve a resposta. Sem lógica de negócio.
export const criarAuthController = (service: AuthService = authService) => ({
  async atualizarDadosConta(req: Request, res: Response) {
    res.json(await service.atualizarDadosConta(req.user!.uid, req.body));
  },
  async cadastrar(req: Request, res: Response) {
    res.status(201).json(await service.cadastrar(req.user!.uid, req.body));
  },

  async meuPerfil(req: Request, res: Response) {
    res.json(await service.meuPerfil(req.user!.uid));
  },

  async responderQuestionario(req: Request, res: Response) {
    res.status(201).json(await service.responderQuestionario(req.user!.uid, req.body));
  },

  async atualizarPerfil(req: Request, res: Response) {
    res.json(await service.atualizarPerfil(req.user!.uid, req.body));
  },
});
