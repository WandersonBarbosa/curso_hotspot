import type { PaymentProvider } from "@hotspot/shared";
import type { PaymentGateway } from "./payment-gateway.js";
import { MercadoPagoGateway } from "./providers/mercadopago.gateway.js";
import { AsaasGateway } from "./providers/asaas.gateway.js";
import { GerencianetGateway } from "./providers/gerencianet.gateway.js";

export function getPaymentGateway(provider: PaymentProvider): PaymentGateway {
  switch (provider) {
    case "mercadopago":
      return new MercadoPagoGateway();
    case "asaas":
      return new AsaasGateway();
    case "gerencianet":
      return new GerencianetGateway();
    default:
      throw new Error(`Provider PIX não suportado: ${String(provider)}`);
  }
}

export * from "./payment-gateway.js";
