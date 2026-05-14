import type { PaymentGateway } from "../payment-gateway.js";
import { v4 as uuidv4 } from "uuid";

/** Estrutura pronta — substitua chamadas reais pela SDK Mercado Pago. */
export class MercadoPagoGateway implements PaymentGateway {
  readonly provider = "mercadopago" as const;

  async createPixCharge(input: import("../payment-gateway.js").CreatePixInput) {
    const id = `mp_${uuidv4()}`;
    return {
      externalPaymentId: id,
      pixQrCode: `00020126360014BR.GOV.BCB.PIX0114+${id}`,
      pixCopyPaste: `PIX COPY ${input.amountCents} REF ${input.externalReference}`,
      raw: { stub: true },
    };
  }

  async parseWebhook(req: { body: unknown }) {
    const body = req.body as { data?: { id?: string }; type?: string };
    return {
      externalPaymentId: body.data?.id ?? "unknown",
      status: body.type === "payment" ? ("paid" as const) : ("pending" as const),
      paidAt: new Date(),
    };
  }
}
