import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "@hotspot/shared";
import { AppError } from "./error-handler.js";

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload;
    }
  }
}

export function authenticate(accessSecret: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return next(new AppError(401, "Token ausente"));
    }
    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, accessSecret) as JwtPayload;
      req.auth = payload;
      next();
    } catch {
      next(new AppError(401, "Token inválido ou expirado"));
    }
  };
}

/** Garante papel mínimo na hierarquia. */
export function requireRole(...allowed: JwtPayload["role"][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(new AppError(401, "Não autenticado"));
    if (!allowed.includes(req.auth.role)) {
      return next(new AppError(403, "Permissão negada"));
    }
    next();
  };
}

/** Escopo empresa: super_admin ignora; demais só a própria empresa. */
export function requireCompanyScope(paramName = "companyId") {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(new AppError(401, "Não autenticado"));
    if (req.auth.role === "super_admin") return next();
    const requested = (req.params[paramName] ?? req.body?.companyId) as string | undefined;
    if (requested && req.auth.companyId && requested !== req.auth.companyId) {
      return next(new AppError(403, "Empresa inválida para este usuário"));
    }
    next();
  };
}
