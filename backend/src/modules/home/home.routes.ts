import { Router } from "express";
import { HomeService } from "./home.service";

export function criarHomeRoutes(service: HomeService) {
  const routes = Router();
  // GET /home/resumo — tudo o que a tela inicial precisa, numa chamada só.
  routes.get("/resumo", async (req, res) => {
    res.json(await service.resumo(req.user!.uid));
  });
  return routes;
}
