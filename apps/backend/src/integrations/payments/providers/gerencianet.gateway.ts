import type { PaymentGateway } from "../payment-gateway.js";
import { v4 as uuidv4 } from "uuid";

/** Estrutura pronta — integrar Efi/Gerencianet conforme credenciais. */
export class GerencianetGateway implements PaymentGateway {
  readonly provider = "gerencianet" as const;

  async createPixCharge(input: import("../payment-gateway.js").CreatePixInput) {
    const id = `efi_${uuidv4()}`;
    return {
      externalPaymentId: id,
      pixQrCode: `QR-EFI-${id}`,
      pixCopyPaste: `EFI|${input.amountCents}|${input.externalReference}`,
      raw: { stub: true },
    };
  }

  async parseWebhook(req: { body: unknown }) {
    const body = req.body as { pix?: { status?: string; txid?: string } };
    const paid = body.pix?.status === "CONCLUIDA";
    return {
      externalPaymentId: body.pix?.txid ?? "unknown",
      status: paid ? ("paid" as const) : ("pending" as const),
      paidAt: paid ? new Date() : undefined,
    };
  }
}
