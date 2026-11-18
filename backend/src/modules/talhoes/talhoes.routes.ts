import { Router } from "express";
import { validateBody } from "../../middlewares/validate";
import { criarTalhoesController } from "./talhoes.controller";
import { criarTalhaoSchema } from "./talhoes.schema";
import { TalhoesService, talhoesService } from "./talhoes.service";

export function criarTalhoesRoutes(service: TalhoesService = talhoesService) {
  const routes = Router({ mergeParams: true });
  routes.post("/", validateBody(criarTalhaoSchema), criarTalhoesController(service).criar);
  return routes;
}
