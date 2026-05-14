/** Tipos e constantes compartilhados entre API e frontend. */
export const API_PREFIX = "/api/v1" as const;

export type UserRole = "super_admin" | "admin" | "subadmin" | "operator";

export interface JwtPayload {
  sub: string;
  email: string;
  companyId: string | null;
  role: UserRole;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const PAYMENT_PROVIDERS = ["mercadopago", "asaas", "gerencianet"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export type PaymentStatus = "pending" | "paid" | "failed" | "expired" | "refunded";
