import { pgTable, text, timestamp, uuid, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { invoices } from "./invoices.js";

export const paymentProviderEnum = pgEnum("payment_provider", ["mercadopago", "asaas", "gerencianet"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed", "expired", "refunded"]);

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  provider: paymentProviderEnum("provider").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  amountCents: integer("amount_cents").notNull(),
  pixQrCode: text("pix_qr_code"),
  pixCopyPaste: text("pix_copy_paste"),
  externalPaymentId: text("external_payment_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
