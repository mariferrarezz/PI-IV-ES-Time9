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
    throw new UnauthorizedError("Token não enviado");
  }

  try {
    const decoded = await firebaseAuth.verifyIdToken(header.slice(7));
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch {
    throw new UnauthorizedError("Token inválido ou expirado");
  }
}
