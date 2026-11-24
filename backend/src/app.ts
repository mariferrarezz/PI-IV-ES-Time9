import cors from "cors";
import express from "express";
import { criarAutenticacao, VerificarToken } from "./middlewares/auth";
import { errorHandler } from "./middlewares/error-handler";
import { criarAuthRoutes } from "./modules/auth/auth.routes";
import { AuthService, authService } from "./modules/auth/auth.service";
import { criarCulturasRoutes } from "./modules/catalogo/culturas.routes";
import { CulturasService, culturasService } from "./modules/catalogo/culturas.service";
import { criarPropriedadesRoutes } from "./modules/propriedades/propriedades.routes";
import { PropriedadesService, propriedadesService } from "./modules/propriedades/propriedades.service";
import { databaseReady } from "./config/database";
import { DatabaseUnavailableError, NotFoundError } from "./shared/errors";
import { env } from "./config/env";
import { criarTalhoesRoutes } from "./modules/talhoes/talhoes.routes";
import { TalhoesService, talhoesService } from "./modules/talhoes/talhoes.service";
import { criarPlantacoesRoutes } from './modules/plantacoes/plantacoes.routes';
import { problemasService } from './modules/catalogo/problemas.service';
import { criarOcorrenciasRoutes } from './modules/ocorrencias/ocorrencias.routes';
import { criarDetalheTalhaoRoutes } from './modules/ocorrencias/detalhe-talhao.routes';
import { criarMonitoramentosRoutes } from './modules/ocorrencias/monitoramentos.routes';
import { criarTratamentosRoutes } from './modules/ocorrencias/tratamentos.routes';
import { criarComunidadeRoutes } from './modules/comunidade/comunidade.routes';
import { criarValidacaoCadastroRoutes } from './modules/auth/validacao-cadastro.routes';
import { AuthRepository } from './modules/auth/auth.repository';
import { criarHomeRoutes } from './modules/home/home.routes';
import { HomeService, homeService } from './modules/home/home.service';
import { ComunidadeService } from './modules/comunidade/comunidade.service';

// Dependências explícitas permitem testes isolados; não existe chave de ambiente para pular autenticação.
export function criarApp(dependencias: {
  service?: PropriedadesService; auth?: AuthService; culturas?: CulturasService; verificarToken?: VerificarToken; bancoDisponivel?: () => boolean;
  talhoesService?: TalhoesService;
  validacaoCadastroRepo?: AuthRepository;
  home?: HomeService;
  comunidade?: ComunidadeService;
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
  app.use('/validacao-cadastro', criarValidacaoCadastroRoutes(dependencias.validacaoCadastroRepo));
  app.use(criarAutenticacao(dependencias.verificarToken));
  app.use((_req, _res, next) => bancoDisponivel() ? next() : next(new DatabaseUnavailableError()));
  app.use("/auth", criarAuthRoutes(dependencias.auth || authService));
  app.use("/home", criarHomeRoutes(dependencias.home || homeService));
  app.use("/culturas", criarCulturasRoutes(dependencias.culturas || culturasService));
  app.get('/culturas/:culturaId/problemas', async (req, res) => { res.json(await problemasService.listar(String(req.params.culturaId))); });
  app.use("/propriedades", criarPropriedadesRoutes(dependencias.service || propriedadesService));
  app.use("/propriedades/:propriedadeId/talhoes", criarTalhoesRoutes(dependencias.talhoesService || talhoesService));
  app.use('/talhoes/:talhaoId/plantacoes', criarPlantacoesRoutes());
  app.use('/talhoes/:talhaoId/detalhe', criarDetalheTalhaoRoutes());
  app.use('/plantacoes/:plantacaoId/ocorrencias', criarOcorrenciasRoutes());
  app.use('/plantacoes/:plantacaoId/monitoramentos', criarMonitoramentosRoutes());
  app.use('/plantacoes/:plantacaoId/ocorrencias/:ocorrenciaId/tratamentos', criarTratamentosRoutes());
  app.use('/comunidade', criarComunidadeRoutes(dependencias.comunidade));
  app.use((_req, _res, next) => next(new NotFoundError()));
  app.use(errorHandler);
  return app;
}
export const app = criarApp();
