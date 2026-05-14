import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../infra/logger.js";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validação inválida", details: err.flatten() });
  }
  logger.error("Erro não tratado", { err });
  return res.status(500).json({ error: "Erro interno" });
}
