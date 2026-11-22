import { Router } from "express";
import { validateBody } from "../../middlewares/validate";
import { criarPropriedadesController } from "./propriedades.controller";
import { PropriedadesService, propriedadesService } from "./propriedades.service";
import {
  atualizarPropriedadeSchema,
  criarPropriedadeSchema,
} from "./propriedades.schema";

export function criarPropriedadesRoutes(service: PropriedadesService = propriedadesService) {
  const propriedadesRoutes = Router();
  const propriedadesController = criarPropriedadesController(service);

  propriedadesRoutes.post("/", validateBody(criarPropriedadeSchema), propriedadesController.criar);
  propriedadesRoutes.get("/", propriedadesController.listar);
  propriedadesRoutes.get("/:id", propriedadesController.buscar);
  propriedadesRoutes.put("/:id", validateBody(atualizarPropriedadeSchema), propriedadesController.atualizar);
  propriedadesRoutes.delete("/:id", propriedadesController.excluir);
  return propriedadesRoutes;
}
export const propriedadesRoutes = criarPropriedadesRoutes();
