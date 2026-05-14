import { Router } from "express";
import type { AppConfig } from "../../config/env.js";
import { authenticate } from "../../middlewares/auth.js";
import { db } from "../../db/index.js";
import { users } from "../../db/schema/index.js";
import { eq } from "drizzle-orm";
import { AppError } from "../../middlewares/error-handler.js";

export function createMeRouter(cfg: AppConfig) {
  const r = Router();
  const auth = authenticate(cfg.JWT_ACCESS_SECRET);
  r.get("/", auth, async (req, res, next) => {
    try {
      const row = await db.query.users.findFirst({ where: eq(users.id, req.auth!.sub) });
      if (!row) throw new AppError(404, "Usuário não encontrado");
      res.json({
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        companyId: row.companyId,
      });
    } catch (e) {
      next(e);
    }
  });
  return r;
}
