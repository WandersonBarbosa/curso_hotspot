import type { PaymentProvider } from "@hotspot/shared";

export interface CreatePixInput {
  amountCents: number;
  description: string;
  externalReference: string;
}

export interface CreatePixResult {
  externalPaymentId: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  raw?: unknown;
}

export interface PaymentGateway {
  readonly provider: PaymentProvider;
  createPixCharge(input: CreatePixInput): Promise<CreatePixResult>;
  parseWebhook(req: { headers: Record<string, string | string[] | undefined>; body: unknown }): Promise<{
    externalPaymentId: string;
    status: "paid" | "pending" | "failed";
    paidAt?: Date;
  }>;
}
