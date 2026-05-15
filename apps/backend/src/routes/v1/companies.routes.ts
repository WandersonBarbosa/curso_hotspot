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

const portalSettingsSchema = z.object({
  portal: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    buttonText: z.string().optional(),
    footerText: z.string().optional(),
    splashColor: z.string().optional(),
    splashImageUrl: z.string().url().optional(),
    showSplash: z.boolean().optional(),
    splashDuration: z.number().int().min(1).optional(),
    loginMode: z.enum(["full", "cpf"]).optional(),
    cpfPlaceholder: z.string().optional(),
  }),
});

const companyUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  document: z.string().optional(),
  active: z.boolean().optional(),
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

  r.get("/slug/:slug/portal-settings", async (req, res, next) => {
    try {
      const row = await db.query.companies.findFirst({ where: eq(companies.slug, req.params.slug) });
      if (!row) throw new AppError(404, "Empresa não encontrada");
      const settings = (row.settings ?? {}) as Record<string, unknown>;
      res.json(settings.portal ?? {});
    } catch (e) {
      next(e);
    }
  });

  r.get("/:companyId/settings", auth, requireRole("super_admin", "admin", "subadmin"), async (req, res, next) => {
    try {
      const companyId = req.params.companyId;
      if (req.auth?.role !== "super_admin" && companyId !== req.auth?.companyId) {
        throw new AppError(403, "Empresa inválida");
      }
      const row = await db.query.companies.findFirst({ where: eq(companies.id, companyId) });
      if (!row) throw new AppError(404, "Empresa não encontrada");
      res.json({ name: row.name, slug: row.slug, settings: row.settings ?? {} });
    } catch (e) {
      next(e);
    }
  });

  r.patch("/:companyId/settings", auth, requireRole("super_admin", "admin", "subadmin"), validateBody(portalSettingsSchema), async (req, res, next) => {
    try {
      const companyId = req.params.companyId;
      if (req.auth?.role !== "super_admin" && companyId !== req.auth?.companyId) {
        throw new AppError(403, "Empresa inválida");
      }
      const { portal } = req.body as z.infer<typeof portalSettingsSchema>;
      const row = await db.query.companies.findFirst({ where: eq(companies.id, companyId) });
      if (!row) throw new AppError(404, "Empresa não encontrada");
      const newSettings = { ...(row.settings ?? {}), portal };
      const [updated] = await db
        .update(companies)
        .set({ settings: newSettings, updatedAt: new Date() })
        .where(eq(companies.id, companyId))
        .returning();
      await auditLog({ companyId, userId: req.auth?.sub, action: "company.settings.update", resource: companyId, ip: req.ip });
      res.json({ name: updated.name, slug: updated.slug, settings: updated.settings ?? {} });
    } catch (e) {
      next(e);
    }
  });

  r.get("/:companyId", auth, requireRole("super_admin", "admin", "subadmin"), async (req, res, next) => {
    try {
      const companyId = req.params.companyId;
      if (req.auth?.role !== "super_admin" && companyId !== req.auth?.companyId) {
        throw new AppError(403, "Empresa inválida");
      }
      const row = await db.query.companies.findFirst({ where: eq(companies.id, companyId) });
      if (!row) throw new AppError(404, "Empresa não encontrada");
      res.json({ id: row.id, name: row.name, slug: row.slug, document: row.document, active: row.active, settings: row.settings ?? {} });
    } catch (e) {
      next(e);
    }
  });

  r.patch("/:companyId", auth, requireRole("super_admin", "admin", "subadmin"), validateBody(companyUpdateSchema), async (req, res, next) => {
    try {
      const companyId = req.params.companyId;
      if (req.auth?.role !== "super_admin" && companyId !== req.auth?.companyId) {
        throw new AppError(403, "Empresa inválida");
      }
      const body = req.body as z.infer<typeof companyUpdateSchema>;
      const row = await db.query.companies.findFirst({ where: eq(companies.id, companyId) });
      if (!row) throw new AppError(404, "Empresa não encontrada");
      const [updated] = await db
        .update(companies)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(companies.id, companyId))
        .returning({ id: companies.id, name: companies.name, slug: companies.slug, document: companies.document, active: companies.active, settings: companies.settings });
      await auditLog({ companyId, userId: req.auth?.sub, action: "company.update", resource: companyId, ip: req.ip });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  });

  return r;
}
