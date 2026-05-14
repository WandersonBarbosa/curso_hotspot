import { db } from "../../db/index.js";
import { logs } from "../../db/schema/index.js";
import { logger } from "../../infra/logger.js";

export async function auditLog(input: {
  companyId?: string | null;
  userId?: string | null;
  action: string;
  resource?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}) {
  try {
    await db.insert(logs).values({
      companyId: input.companyId ?? undefined,
      userId: input.userId ?? undefined,
      action: input.action,
      resource: input.resource,
      metadata: input.metadata ?? {},
      ip: input.ip,
    });
  } catch (e) {
    logger.warn("Falha ao gravar auditoria", { e });
  }
}
