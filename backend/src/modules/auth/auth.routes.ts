import { Router } from "express";
import { validateBody } from "../../middlewares/validate";
import { criarAuthController } from "./auth.controller";
import { cadastroSchema, questionarioSchema } from "./auth.schema";
import { AuthService, authService } from "./auth.service";

export function criarAuthRoutes(service: AuthService = authService) {
  const authRoutes = Router();
  const controller = criarAuthController(service);

  authRoutes.post("/cadastro", validateBody(cadastroSchema), controller.cadastrar);
  authRoutes.get("/me", controller.meuPerfil);
  authRoutes.post("/questionario", validateBody(questionarioSchema), controller.responderQuestionario);
  return authRoutes;
}
