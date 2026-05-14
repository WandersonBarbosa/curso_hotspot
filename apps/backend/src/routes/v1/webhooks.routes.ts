import { Router } from "express";
import { z } from "zod";
import type { AppConfig } from "../../config/env.js";
import { getPaymentGateway } from "../../integrations/payments/index.js";
import type { PaymentProvider } from "@hotspot/shared";
import { enqueuePaymentJob } from "../../jobs/queues.js";
import { handleAtlazFinanceWebhook } from "../../integrations/atlaz/index.js";
import { logger } from "../../infra/logger.js";

export function createWebhooksRouter(_cfg: AppConfig) {
  const r = Router();

  r.post("/pix/:provider", async (req, res, next) => {
    try {
      const provider = req.params.provider as PaymentProvider;
      const gateway = getPaymentGateway(provider);
      const parsed = await gateway.parseWebhook({
        headers: req.headers as Record<string, string | string[] | undefined>,
        body: req.body,
      });
      if (parsed.status === "paid" && parsed.paidAt) {
        await enqueuePaymentJob(
          "pix-paid",
          { externalPaymentId: parsed.externalPaymentId, paidAt: parsed.paidAt.toISOString() },
          { removeOnComplete: true },
        );
      }
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  r.post("/atlaz/:companyId/finance", async (req, res, next) => {
    try {
      const companyId = z.string().uuid().parse(req.params.companyId);
      const result = await handleAtlazFinanceWebhook(req, companyId);
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  r.post("/health", (_req, res) => {
    logger.debug("Webhook health ping");
    res.json({ ok: true });
  });

  return r;
}
