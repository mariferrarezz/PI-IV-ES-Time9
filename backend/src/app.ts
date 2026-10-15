import cors from "cors";
import express from "express";
import { authenticate } from "./middlewares/auth";
import { errorHandler } from "./middlewares/error-handler";
import { propriedadesRoutes } from "./modules/propriedades/propriedades.routes";

export const app = express();

app.use(cors());
app.use(express.json());

// Rota pública para checar se a API está no ar
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// A partir daqui, todas as rotas exigem token do Firebase Auth
app.use(authenticate);

app.use("/propriedades", propriedadesRoutes);
// Próximos módulos: talhoes, ocorrencias, catalogo, tratamentos, dashboard

app.use(errorHandler);
