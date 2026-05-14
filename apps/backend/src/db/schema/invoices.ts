import { pgTable, text, timestamp, uuid, integer, pgEnum } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { hotspotUsers } from "./hotspot_users.js";

export const invoiceStatusEnum = pgEnum("invoice_status", ["open", "paid", "overdue", "cancelled"]);

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  hotspotUserId: uuid("hotspot_user_id").references(() => hotspotUsers.id, { onDelete: "set null" }),
  externalId: text("external_id"),
  description: text("description"),
  amountCents: integer("amount_cents").notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  status: invoiceStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
