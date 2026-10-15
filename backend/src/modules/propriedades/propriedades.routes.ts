import { Router } from "express";
import { validateBody } from "../../middlewares/validate";
import { propriedadesController } from "./propriedades.controller";
import {
  atualizarPropriedadeSchema,
  criarPropriedadeSchema,
} from "./propriedades.schema";

export const propriedadesRoutes = Router();

propriedadesRoutes.post("/", validateBody(criarPropriedadeSchema), propriedadesController.criar);
propriedadesRoutes.get("/", propriedadesController.listar);
propriedadesRoutes.get("/:id", propriedadesController.buscar);
propriedadesRoutes.put("/:id", validateBody(atualizarPropriedadeSchema), propriedadesController.atualizar);
propriedadesRoutes.delete("/:id", propriedadesController.excluir);
