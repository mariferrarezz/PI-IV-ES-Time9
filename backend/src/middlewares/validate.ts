import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

// Valida o body da requisição com um schema zod.
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.body = schema.parse(req.body);
    next();
  };
}
