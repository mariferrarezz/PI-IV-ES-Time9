import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { AppError } from "../shared/errors";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ erro: err.message, codigo: err.code });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      erro: "Dados inválidos",
      codigo: "ENTRADA_INVALIDA",
      detalhes: err.issues.map((i) => ({
        campo: i.path.join("."),
        // Mensagens padrão do Zod podem incluir o valor recebido; não devolvê-las.
        mensagem: "Campo ou valor inválido",
      })),
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ erro: "Identificador inválido", codigo: "IDENTIFICADOR_INVALIDO" });
    return;
  }
  if (err instanceof mongoose.Error.ValidationError || err instanceof mongoose.Error.StrictModeError) {
    res.status(400).json({ erro: "Dados inválidos", codigo: "ENTRADA_INVALIDA" }); return;
  }
  const falha = err as { code?: number; name?: string; type?: string; status?: number };
  if (falha?.type === "entity.parse.failed" || falha?.type === "entity.too.large") {
    res.status(falha.type === "entity.too.large" ? 413 : 400).json({ erro: "Corpo da requisição inválido", codigo: "ENTRADA_INVALIDA" }); return;
  }
  if (falha?.code === 11000) {
    res.status(409).json({ erro: "Conflito de unicidade", codigo: "CONFLITO_UNICIDADE" }); return;
  }
  if (falha?.code === 121) {
    res.status(422).json({ erro: "Documento incompatível com a validação do banco", codigo: "VALIDACAO_BANCO" }); return;
  }
  if (["MongoServerSelectionError", "MongooseServerSelectionError", "MongoNetworkError", "MongoNetworkTimeoutError", "MongoTopologyClosedError", "MongoNotConnectedError"].includes(falha?.name || "") ||
    [6, 7, 89, 91, 11600, 11602].includes(falha?.code || 0)) {
    res.status(503).json({ erro: "Banco de dados temporariamente indisponível", codigo: "BANCO_INDISPONIVEL" }); return;
  }
  // Nunca registrar o objeto, message ou stack do driver/entrada.
  console.error(JSON.stringify({ codigo: "ERRO_INTERNO" }));
  res.status(500).json({ erro: "Erro interno do servidor", codigo: "ERRO_INTERNO" });
}
