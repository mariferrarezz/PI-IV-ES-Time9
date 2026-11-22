import { Router } from "express";
import { criarCulturasController } from "./culturas.controller";
import { CulturasService, culturasService } from "./culturas.service";

export function criarCulturasRoutes(service: CulturasService = culturasService) {
  const culturasRoutes = Router();
  const controller = criarCulturasController(service);

  culturasRoutes.get("/", controller.listar);
  return culturasRoutes;
}
