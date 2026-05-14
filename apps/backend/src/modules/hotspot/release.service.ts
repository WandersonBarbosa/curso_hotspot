import { eq, and, lte } from "drizzle-orm";
import { db } from "../../db/index.js";
import { invoices, payments, hotspotUsers } from "../../db/schema/index.js";
import { MikrotikHotspotService } from "../../integrations/mikrotik/index.js";
import { auditLog } from "../audit/audit.service.js";
import { logger } from "../../infra/logger.js";

/** Após pagamento confirmado: fatura paga + desbloquear usuário hotspot no MikroTik. */
export async function releaseHotspotAfterPayment(params: {
  companyId: string;
  invoiceId: string;
  userId?: string | null;
}) {
  const invoice = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, params.invoiceId), eq(invoices.companyId, params.companyId)),
    with: { hotspotUser: { with: { mikrotik: true } } },
  });
  if (!invoice) {
    logger.warn("Fatura não encontrada para liberação", params);
    return;
  }

  await db
    .update(invoices)
    .set({ status: "paid", updatedAt: new Date() })
    .where(eq(invoices.id, invoice.id));

  const hu = invoice.hotspotUser;
  if (!hu?.mikrotik) {
    await auditLog({
      companyId: params.companyId,
      userId: params.userId,
      action: "payment.release",
      resource: invoice.id,
      metadata: { note: "Sem MikroTik vinculado ao usuário hotspot" },
    });
    return;
  }

  const mk = hu.mikrotik;
  const svc = new MikrotikHotspotService({
    host: mk.host,
    port: mk.port,
    user: mk.apiUser,
    password: mk.apiPassword,
  });
  await svc.setBlocked(hu.username, false);
  await db.update(hotspotUsers).set({ blocked: false, updatedAt: new Date() }).where(eq(hotspotUsers.id, hu.id));

  await auditLog({
    companyId: params.companyId,
    userId: params.userId,
    action: "payment.release",
    resource: invoice.id,
    metadata: { hotspotUser: hu.username, mikrotikId: mk.id },
  });
}

/** Marca inadimplência e bloqueia usuários com faturas vencidas. */
export async function blockOverdueHotspotUsers(companyId?: string) {
  const now = new Date();
  const conditions = [eq(invoices.status, "open"), lte(invoices.dueDate, now)];
  if (companyId) conditions.push(eq(invoices.companyId, companyId));
  const overdue = await db.query.invoices.findMany({
    where: and(...conditions),
    with: { hotspotUser: { with: { mikrotik: true } } },
    limit: 500,
  });

  for (const inv of overdue) {
    await db.update(invoices).set({ status: "overdue", updatedAt: new Date() }).where(eq(invoices.id, inv.id));
    const hu = inv.hotspotUser;
    if (!hu?.mikrotik) continue;
    const mk = hu.mikrotik;
    const svc = new MikrotikHotspotService({
      host: mk.host,
      port: mk.port,
      user: mk.apiUser,
      password: mk.apiPassword,
    });
    try {
      await svc.setBlocked(hu.username, true);
      await db.update(hotspotUsers).set({ blocked: true, updatedAt: new Date() }).where(eq(hotspotUsers.id, hu.id));
      await auditLog({
        companyId: inv.companyId,
        action: "invoice.overdue.block",
        resource: inv.id,
        metadata: { hotspotUser: hu.username },
      });
    } catch (e) {
      logger.error("Falha ao bloquear por atraso", { e, invoiceId: inv.id });
    }
  }
}

export async function markPaymentPaid(paymentId: string, paidAt: Date) {
  await db
    .update(payments)
    .set({ status: "paid", paidAt, updatedAt: new Date() })
    .where(eq(payments.id, paymentId));
}
