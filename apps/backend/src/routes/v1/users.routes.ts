import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users } from "../../db/schema/index.js";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import { validateBody } from "../../middlewares/validate.js";
import type { AppConfig } from "../../config/env.js";
import { AppError } from "../../middlewares/error-handler.js";
import { auditLog } from "../../modules/audit/audit.service.js";
import { hashPassword } from "../../modules/auth/auth.service.js";

const createUserSchema = z.object({
  companyId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(["super_admin", "admin", "subadmin", "operator"]),
  password: z.string().min(6),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["super_admin", "admin", "subadmin", "operator"]).optional(),
  active: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export function createUsersRouter(cfg: AppConfig) {
  const r = Router();
  const auth = authenticate(cfg.JWT_ACCESS_SECRET);

  r.get("/:companyId", auth, requireRole("super_admin", "admin", "subadmin"), async (req, res, next) => {
    try {
      const companyId = req.params.companyId;
      if (req.auth?.role !== "super_admin" && companyId !== req.auth?.companyId) {
        throw new AppError(403, "Empresa inválida");
      }
      const rows = await db.query.users.findMany({
        where: eq(users.companyId, companyId),
        columns: { id: true, email: true, name: true, role: true, active: true, createdAt: true, updatedAt: true },
      });
      res.json(rows);
    } catch (e) {
      next(e);
    }
  });

  r.post("/", auth, requireRole("super_admin", "admin", "subadmin"), validateBody(createUserSchema), async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof createUserSchema>;
      if (req.auth?.role !== "super_admin" && body.companyId !== req.auth?.companyId) {
        throw new AppError(403, "Empresa inválida");
      }
      if (req.auth?.role !== "super_admin" && body.role === "super_admin") {
        throw new AppError(403, "Não permitido criar super admin");
      }
      const passwordHash = await hashPassword(body.password);
      const [row] = await db.insert(users).values({
        companyId: body.companyId,
        email: body.email.toLowerCase(),
        name: body.name,
        role: body.role,
        passwordHash,
      }).returning({ id: users.id, email: users.email, name: users.name, role: users.role, active: users.active, createdAt: users.createdAt, updatedAt: users.updatedAt });
      await auditLog({ companyId: body.companyId, userId: req.auth?.sub, action: "user.create", resource: row.id, ip: req.ip });
      res.status(201).json(row);
    } catch (e) {
      next(e);
    }
  });

  r.patch("/:userId", auth, requireRole("super_admin", "admin", "subadmin"), validateBody(updateUserSchema), async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const body = req.body as z.infer<typeof updateUserSchema>;
      const row = await db.query.users.findFirst({ where: eq(users.id, userId) });
      if (!row) throw new AppError(404, "Usuário não encontrado");
      if (req.auth?.role !== "super_admin" && row.companyId !== req.auth?.companyId) {
        throw new AppError(403, "Usuário inválido para este contexto");
      }
      if (req.auth?.role !== "super_admin" && body.role === "super_admin") {
        throw new AppError(403, "Não permitido atualizar para super admin");
      }
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };
      if (body.name) updateData.name = body.name;
      if (body.role) updateData.role = body.role;
      if (typeof body.active === "boolean") updateData.active = body.active;
      if (body.password) updateData.passwordHash = await hashPassword(body.password);
      const [updated] = await db.update(users).set(updateData).where(eq(users.id, userId)).returning({ id: users.id, email: users.email, name: users.name, role: users.role, active: users.active, createdAt: users.createdAt, updatedAt: users.updatedAt });
      await auditLog({ companyId: row.companyId, userId: req.auth?.sub, action: "user.update", resource: userId, ip: req.ip });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  });

  r.delete("/:userId", auth, requireRole("super_admin", "admin", "subadmin"), async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const row = await db.query.users.findFirst({ where: eq(users.id, userId) });
      if (!row) throw new AppError(404, "Usuário não encontrado");
      if (req.auth?.role !== "super_admin" && row.companyId !== req.auth?.companyId) {
        throw new AppError(403, "Usuário inválido para este contexto");
      }
      await db.delete(users).where(eq(users.id, userId));
      await auditLog({ companyId: row.companyId, userId: req.auth?.sub, action: "user.delete", resource: userId, ip: req.ip });
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });

  return r;
}
