import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { mikrotiks } from "../../db/schema/index.js";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import { validateBody } from "../../middlewares/validate.js";
import type { AppConfig } from "../../config/env.js";
import { testConnection } from "../../integrations/mikrotik/index.js";
import { auditLog } from "../../modules/audit/audit.service.js";
import { AppError } from "../../middlewares/error-handler.js";

const bodySchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(1),
  host: z.string().min(1),
  port: z.coerce.number().default(8728),
  apiUser: z.string().min(1),
  apiPassword: z.string().min(1),
  useTls: z.boolean().optional(),
});

export function createMikrotiksRouter(cfg: AppConfig) {
  const r = Router();
  const auth = authenticate(cfg.JWT_ACCESS_SECRET);

  r.use(auth, requireRole("super_admin", "admin", "subadmin"));

  r.get("/:companyId", async (req, res, next) => {
    try {
      if (req.auth?.role !== "super_admin" && req.params.companyId !== req.auth?.companyId) {
        throw new AppError(403, "Empresa inválida");
      }
      const rows = await db.query.mikrotiks.findMany({
        where: eq(mikrotiks.companyId, req.params.companyId),
      });
      res.json(rows.map((m) => ({ ...m, apiPassword: undefined })));
    } catch (e) {
      next(e);
    }
  });

  r.post("/", validateBody(bodySchema), async (req, res, next) => {
    try {
      const b = req.body as z.infer<typeof bodySchema>;
      if (req.auth?.role !== "super_admin" && b.companyId !== req.auth?.companyId) {
        throw new AppError(403, "Empresa inválida");
      }
      const [row] = await db.insert(mikrotiks).values(b).returning();
      await auditLog({
        companyId: b.companyId,
        userId: req.auth?.sub,
        action: "mikrotik.create",
        resource: row.id,
        ip: req.ip,
      });
      res.status(201).json({ ...row, apiPassword: undefined });
    } catch (e) {
      next(e);
    }
  });

  r.post("/:id/test", async (req, res, next) => {
    try {
      const row = await db.query.mikrotiks.findFirst({ where: eq(mikrotiks.id, req.params.id) });
      if (!row) throw new AppError(404, "MikroTik não encontrado");
      if (req.auth?.role !== "super_admin" && row.companyId !== req.auth?.companyId) {
        throw new AppError(403, "Acesso negado");
      }
      const result = await testConnection({
        host: row.host,
        port: row.port,
        user: row.apiUser,
        password: row.apiPassword,
      });
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  return r;
}
