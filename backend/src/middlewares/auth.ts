import { NextFunction, Request, Response } from "express";
import { firebaseAuth } from "../config/firebase";
import { AppError, UnauthorizedError } from "../shared/errors";

export type VerificarToken = (token: string) => Promise<{ uid: string; email?: string }>;

// Disponibiliza o uid do usuário logado em req.user
declare global {
  namespace Express {
    interface Request {
      user?: { uid: string; email?: string };
    }
  }
}

export function criarAutenticacao(verificar: VerificarToken = token => firebaseAuth.verifyIdToken(token)) {
  return async function authenticate(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new UnauthorizedError("Token não enviado");
    const token = header.slice(7).trim();
    if (!token) throw new UnauthorizedError("Token não enviado");

    try {
      const decoded = await verificar(token);
      req.user = { uid: decoded.uid, email: decoded.email };
      next();
    } catch (erro) {
      const codigo = (erro as { code?: string })?.code;
      if (codigo === "app/network-error" || codigo === "auth/internal-error") {
        throw new AppError(503, "Autenticação temporariamente indisponível", "AUTENTICACAO_INDISPONIVEL");
      }
      throw new UnauthorizedError("Token inválido ou expirado");
    }
  };
}
export const authenticate = criarAutenticacao();
