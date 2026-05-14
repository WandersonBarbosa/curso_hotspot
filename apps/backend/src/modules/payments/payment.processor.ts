import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { payments } from "../../db/schema/index.js";
import { markPaymentPaid, releaseHotspotAfterPayment } from "../hotspot/release.service.js";
import { logger } from "../../infra/logger.js";

export async function processPaidPaymentByExternalId(externalId: string, paidAt: Date) {
  const pay = await db.query.payments.findFirst({ where: eq(payments.externalPaymentId, externalId) });
  if (!pay) {
    logger.warn("Pagamento externo não encontrado", { externalId });
    return;
  }
  if (pay.status === "paid") {
    logger.debug("Pagamento já estava pago", { externalId });
    return;
  }
  await markPaymentPaid(pay.id, paidAt);
  if (pay.invoiceId) {
    await releaseHotspotAfterPayment({ companyId: pay.companyId, invoiceId: pay.invoiceId });
  }
}
