import { Router } from "express";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { companies } from "../../db/schema/index.js";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import { validateBody } from "../../middlewares/validate.js";
import type { AppConfig } from "../../config/env.js";
import { AppError } from "../../middlewares/error-handler.js";
import { auditLog } from "../../modules/audit/audit.service.js";

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  document: z.string().optional(),
});

export function createCompaniesRouter(cfg: AppConfig) {
  const r = Router();
  const auth = authenticate(cfg.JWT_ACCESS_SECRET);

  r.get("/", auth, requireRole("super_admin"), async (_req, res, next) => {
    try {
      const rows = await db.query.companies.findMany({ orderBy: [desc(companies.createdAt)] });
      res.json(rows);
    } catch (e) {
      next(e);
    }
  });

  r.post("/", auth, requireRole("super_admin"), validateBody(createSchema), async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof createSchema>;
      const [row] = await db.insert(companies).values(body).returning();
      await auditLog({ companyId: row.id, userId: req.auth?.sub, action: "company.create", resource: row.id, ip: req.ip });
      res.status(201).json(row);
    } catch (e) {
      next(e);
    }
  });

  return r;
}
