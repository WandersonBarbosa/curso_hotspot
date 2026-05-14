import { Router } from "express";
import { eq, and, gte, sql, desc, isNotNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import { hotspotUsers, invoices, payments, logs, mikrotiks } from "../../db/schema/index.js";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import type { AppConfig } from "../../config/env.js";
import { AppError } from "../../middlewares/error-handler.js";
import { MikrotikHotspotService } from "../../integrations/mikrotik/index.js";

export function createDashboardRouter(cfg: AppConfig) {
  const r = Router();
  const auth = authenticate(cfg.JWT_ACCESS_SECRET);
  r.use(auth, requireRole("super_admin", "admin", "subadmin"));

  r.get("/:companyId/summary", async (req, res, next) => {
    try {
      const companyId = req.params.companyId;
      if (req.auth?.role !== "super_admin" && companyId !== req.auth?.companyId) {
        throw new AppError(403, "Empresa inválida");
      }
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [hotspotCount] = await db
        .select({ c: sql<number>`count(*)::int` })
        .from(hotspotUsers)
        .where(eq(hotspotUsers.companyId, companyId));

      const [revenueRow] = await db
        .select({ sum: sql<number>`coalesce(sum(${payments.amountCents}),0)::int` })
        .from(payments)
        .where(
          and(
            eq(payments.companyId, companyId),
            eq(payments.status, "paid"),
            isNotNull(payments.paidAt),
            gte(payments.paidAt, startOfMonth),
          ),
        );

      const [overdueRow] = await db
        .select({ c: sql<number>`count(*)::int` })
        .from(invoices)
        .where(and(eq(invoices.companyId, companyId), eq(invoices.status, "overdue")));

      const recentLogs = await db.query.logs.findMany({
        where: eq(logs.companyId, companyId),
        orderBy: [desc(logs.createdAt)],
        limit: 20,
      });

      let onlineClients = 0;
      const mk = await db.query.mikrotiks.findFirst({
        where: eq(mikrotiks.companyId, companyId),
      });
      if (mk) {
        try {
          const svc = new MikrotikHotspotService({
            host: mk.host,
            port: mk.port,
            user: mk.apiUser,
            password: mk.apiPassword,
          });
          const sessions = await svc.listSessions();
          onlineClients = sessions.length;
        } catch {
          onlineClients = 0;
        }
      }

      res.json({
        hotspotUsers: hotspotCount?.c ?? 0,
        revenueMonthCents: revenueRow?.sum ?? 0,
        overdueInvoices: overdueRow?.c ?? 0,
        onlineClients,
        bandwidthMbps: { download: null, upload: null },
        recentLogs,
      });
    } catch (e) {
      next(e);
    }
  });

  return r;
}
