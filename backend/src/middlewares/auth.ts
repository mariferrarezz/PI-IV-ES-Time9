import { NextFunction, Request, Response } from "express";
import { firebaseAuth } from "../config/firebase";
import { UnauthorizedError } from "../shared/errors";

// Disponibiliza o uid do usuário logado em req.user
declare global {
  namespace Express {
    interface Request {
      user?: { uid: string; email?: string };
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Token não enviado"));
  }

  const token = header.slice(7).trim();

  try {
    const decoded = await firebaseAuth.verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch (error) {
    const { code, message } = error as { code?: string; message?: string };
    console.error("Falha ao validar token no Firebase:", code, message);
    next(new UnauthorizedError("Token inválido ou expirado"));
  }
}
