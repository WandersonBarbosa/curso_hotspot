import { Router } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../../db/index.js";
import { hotspotUsers, mikrotiks, invoices, payments } from "../../db/schema/index.js";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import { validateBody } from "../../middlewares/validate.js";
import type { AppConfig } from "../../config/env.js";
import { AppError } from "../../middlewares/error-handler.js";
import { MikrotikHotspotService } from "../../integrations/mikrotik/index.js";
import { auditLog } from "../../modules/audit/audit.service.js";
import { getPaymentGateway } from "../../integrations/payments/index.js";
import type { PaymentProvider } from "@hotspot/shared";

const createSchema = z.object({
  companyId: z.string().uuid(),
  mikrotikId: z.string().uuid().optional(),
  planId: z.string().uuid().optional(),
  username: z.string().min(1),
  password: z.string().min(1),
  profile: z.string().optional(),
  comment: z.string().optional(),
  syncRouter: z.boolean().optional().default(true),
});

export function createHotspotUsersRouter(cfg: AppConfig) {
  const r = Router();
  const auth = authenticate(cfg.JWT_ACCESS_SECRET);
  r.use(auth, requireRole("super_admin", "admin", "subadmin", "operator"));

  r.get("/:companyId", async (req, res, next) => {
    try {
      const companyId = req.params.companyId;
      if (req.auth?.role !== "super_admin" && companyId !== req.auth?.companyId) {
        throw new AppError(403, "Empresa inválida");
      }
      const rows = await db.query.hotspotUsers.findMany({
        where: eq(hotspotUsers.companyId, companyId),
      });
      res.json(rows);
    } catch (e) {
      next(e);
    }
  });

  r.post("/", validateBody(createSchema), async (req, res, next) => {
    try {
      const b = req.body as z.infer<typeof createSchema>;
      if (req.auth?.role !== "super_admin" && b.companyId !== req.auth?.companyId) {
        throw new AppError(403, "Empresa inválida");
      }
      const { syncRouter, ...rest } = b;
      const [row] = await db.insert(hotspotUsers).values(rest).returning();
      if (syncRouter && b.mikrotikId) {
        const mk = await db.query.mikrotiks.findFirst({ where: eq(mikrotiks.id, b.mikrotikId) });
        if (mk) {
          const svc = new MikrotikHotspotService({
            host: mk.host,
            port: mk.port,
            user: mk.apiUser,
            password: mk.apiPassword,
          });
          await svc.addUser({
            name: b.username,
            password: b.password,
            profile: b.profile,
            comment: b.comment,
          });
        }
      }
      await auditLog({
        companyId: b.companyId,
        userId: req.auth?.sub,
        action: "hotspot_user.create",
        resource: row.id,
        ip: req.ip,
      });
      res.status(201).json(row);
    } catch (e) {
      next(e);
    }
  });

  r.patch("/:id/block", async (req, res, next) => {
    try {
      const blocked = Boolean((req.body as { blocked?: boolean }).blocked);
      const row = await db.query.hotspotUsers.findFirst({
        where: eq(hotspotUsers.id, req.params.id),
        with: { mikrotik: true },
      });
      if (!row) throw new AppError(404, "Usuário não encontrado");
      if (req.auth?.role !== "super_admin" && row.companyId !== req.auth?.companyId) {
        throw new AppError(403, "Acesso negado");
      }
      await db.update(hotspotUsers).set({ blocked, updatedAt: new Date() }).where(eq(hotspotUsers.id, row.id));
      if (row.mikrotik) {
        const svc = new MikrotikHotspotService({
          host: row.mikrotik.host,
          port: row.mikrotik.port,
          user: row.mikrotik.apiUser,
          password: row.mikrotik.apiPassword,
        });
        await svc.setBlocked(row.username, blocked);
      }
      res.json({ id: row.id, blocked });
    } catch (e) {
      next(e);
    }
  });

  r.delete("/:id", async (req, res, next) => {
    try {
      const row = await db.query.hotspotUsers.findFirst({
        where: eq(hotspotUsers.id, req.params.id),
        with: { mikrotik: true },
      });
      if (!row) throw new AppError(404, "Usuário não encontrado");
      if (req.auth?.role !== "super_admin" && row.companyId !== req.auth?.companyId) {
        throw new AppError(403, "Acesso negado");
      }
      if (row.mikrotik) {
        const svc = new MikrotikHotspotService({
          host: row.mikrotik.host,
          port: row.mikrotik.port,
          user: row.mikrotik.apiUser,
          password: row.mikrotik.apiPassword,
        });
        await svc.removeUser(row.username);
      }
      await db.delete(hotspotUsers).where(eq(hotspotUsers.id, row.id));
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  r.get("/:id/sessions", async (req, res, next) => {
    try {
      const row = await db.query.hotspotUsers.findFirst({
        where: eq(hotspotUsers.id, req.params.id),
        with: { mikrotik: true },
      });
      if (!row?.mikrotik) throw new AppError(400, "Sem MikroTik");
      if (req.auth?.role !== "super_admin" && row.companyId !== req.auth?.companyId) {
        throw new AppError(403, "Acesso negado");
      }
      const svc = new MikrotikHotspotService({
        host: row.mikrotik.host,
        port: row.mikrotik.port,
        user: row.mikrotik.apiUser,
        password: row.mikrotik.apiPassword,
      });
      const sessions = await svc.listSessions();
      res.json(sessions.filter((s: { user?: string }) => s.user === row.username));
    } catch (e) {
      next(e);
    }
  });

  r.post("/:id/disconnect", async (req, res, next) => {
    try {
      const row = await db.query.hotspotUsers.findFirst({
        where: eq(hotspotUsers.id, req.params.id),
        with: { mikrotik: true },
      });
      if (!row?.mikrotik) throw new AppError(400, "Sem MikroTik");
      if (req.auth?.role !== "super_admin" && row.companyId !== req.auth?.companyId) {
        throw new AppError(403, "Acesso negado");
      }
      const svc = new MikrotikHotspotService({
        host: row.mikrotik.host,
        port: row.mikrotik.port,
        user: row.mikrotik.apiUser,
        password: row.mikrotik.apiPassword,
      });
      await svc.disconnectByUser(row.username);
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  /** Cria cobrança PIX (stub por provider) vinculada a fatura. */
  r.post("/:companyId/pix", async (req, res, next) => {
    try {
      const companyId = req.params.companyId;
      if (req.auth?.role !== "super_admin" && companyId !== req.auth?.companyId) {
        throw new AppError(403, "Empresa inválida");
      }
      const schema = z.object({
        invoiceId: z.string().uuid(),
        provider: z.enum(["mercadopago", "asaas", "gerencianet"]),
      });
      const body = schema.parse(req.body);
      const gateway = getPaymentGateway(body.provider as PaymentProvider);
      const inv = await db.query.invoices.findFirst({
        where: and(eq(invoices.id, body.invoiceId), eq(invoices.companyId, companyId)),
      });
      if (!inv) throw new AppError(404, "Fatura não encontrada");
      const charge = await gateway.createPixCharge({
        amountCents: inv.amountCents,
        description: inv.description ?? "Fatura",
        externalReference: inv.id,
      });
      const [pay] = await db
        .insert(payments)
        .values({
          companyId,
          invoiceId: inv.id,
          provider: body.provider,
          amountCents: inv.amountCents,
          externalPaymentId: charge.externalPaymentId,
          pixQrCode: charge.pixQrCode,
          pixCopyPaste: charge.pixCopyPaste,
          metadata: { raw: charge.raw },
        })
        .returning();
      res.status(201).json(pay);
    } catch (e) {
      next(e);
    }
  });

  return r;
}
