import cors from "cors";
import express from "express";
import { criarAutenticacao, VerificarToken } from "./middlewares/auth";
import { errorHandler } from "./middlewares/error-handler";
import { criarPropriedadesRoutes } from "./modules/propriedades/propriedades.routes";
import { PropriedadesService, propriedadesService } from "./modules/propriedades/propriedades.service";
import { databaseReady } from "./config/database";
import { DatabaseUnavailableError, NotFoundError } from "./shared/errors";
import { env } from "./config/env";
import { criarTalhoesRoutes } from "./modules/talhoes/talhoes.routes";
import { TalhoesService, talhoesService } from "./modules/talhoes/talhoes.service";

// Dependências explícitas permitem testes isolados; não existe chave de ambiente para pular autenticação.
export function criarApp(dependencias: {
  service?: PropriedadesService; verificarToken?: VerificarToken; bancoDisponivel?: () => boolean;
  talhoesService?: TalhoesService;
} = {}) {
  const app = express();
  const bancoDisponivel = dependencias.bancoDisponivel || databaseReady;
  app.use(cors());
  app.use(express.json());

  // Liveness não comprova acesso ao banco; readiness verifica o pool atual.
  app.get("/health", (_req, res) => { res.json({ status: "ok" }); });
  app.get("/ready", (_req, res) => {
    const disponivel = bancoDisponivel();
    res.status(disponivel ? 200 : 503).json({ status: disponivel ? "pronto" : "indisponivel",
      banco: env.databaseName, autenticacao: env.authEmulator ? "emulator" : "firebase" });
  });
  app.use(criarAutenticacao(dependencias.verificarToken));
  app.use((_req, _res, next) => bancoDisponivel() ? next() : next(new DatabaseUnavailableError()));
  app.use("/propriedades", criarPropriedadesRoutes(dependencias.service || propriedadesService));
  app.use("/propriedades/:propriedadeId/talhoes", criarTalhoesRoutes(dependencias.talhoesService || talhoesService));
  app.use((_req, _res, next) => next(new NotFoundError()));
  app.use(errorHandler);
  return app;
}
export const app = criarApp();
