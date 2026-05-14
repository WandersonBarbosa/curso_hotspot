import type { PaymentGateway } from "../payment-gateway.js";
import { v4 as uuidv4 } from "uuid";

/** Estrutura pronta — integrar com API Asaas (PIX). */
export class AsaasGateway implements PaymentGateway {
  readonly provider = "asaas" as const;

  async createPixCharge(input: import("../payment-gateway.js").CreatePixInput) {
    const id = `asaas_${uuidv4()}`;
    return {
      externalPaymentId: id,
      pixQrCode: `QR-ASAAS-${id}`,
      pixCopyPaste: `ASAAS|${input.amountCents}|${input.externalReference}`,
      raw: { stub: true },
    };
  }

  async parseWebhook(req: { body: unknown }) {
    const body = req.body as { payment?: { id?: string; status?: string } };
    const status = body.payment?.status === "CONFIRMED" ? ("paid" as const) : ("pending" as const);
    return {
      externalPaymentId: body.payment?.id ?? "unknown",
      status,
      paidAt: status === "paid" ? new Date() : undefined,
    };
  }
}
