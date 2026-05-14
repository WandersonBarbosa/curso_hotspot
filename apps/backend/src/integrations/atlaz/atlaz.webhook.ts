import type { Request } from "express";
import { createAtlazClient, AtlazService } from "./atlaz.client.js";
import { db } from "../../db/index.js";
import { companies } from "../../db/schema/index.js";
import { eq } from "drizzle-orm";
import { auditLog } from "../../modules/audit/audit.service.js";
import { logger } from "../../infra/logger.js";

/**
 * Webhook financeiro Atlaz → reconciliar faturas e disparar liberação automática.
 * Valide assinatura/HMAC conforme manual do Atlaz em produção.
 */
export async function handleAtlazFinanceWebhook(req: Request, companyId: string) {
  const payload = req.body as Record<string, unknown>;
  logger.info("Webhook Atlaz recebido", { companyId, event: payload?.type ?? payload?.event });

  await auditLog({
    companyId,
    action: "webhook.atlaz.finance",
    resource: String(payload?.invoiceId ?? payload?.id ?? ""),
    metadata: payload,
    ip: req.ip,
  });

  // Aqui: mapear payload → atualizar invoices/payments e enfileirar job de liberação hotspot.
  return { received: true };
}

export async function getAtlazServiceForCompany(companyId: string, fallbackBaseUrl?: string, fallbackToken?: string) {
  const company = await db.query.companies.findFirst({ where: eq(companies.id, companyId) });
  const settings = (company?.settings ?? {}) as {
    atlazBaseUrl?: string;
    atlazToken?: string;
  };
  const baseURL = settings.atlazBaseUrl ?? fallbackBaseUrl;
  const token = settings.atlazToken ?? fallbackToken;
  if (!baseURL || !token) {
    throw new Error("Atlaz não configurado para esta empresa");
  }
  const client = createAtlazClient(baseURL, token);
  return new AtlazService(client);
}
