import { pgTable, text, timestamp, uuid, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { mikrotiks } from "./mikrotiks.js";
import { plans } from "./plans.js";

export const hotspotUsers = pgTable("hotspot_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  mikrotikId: uuid("mikrotik_id").references(() => mikrotiks.id, { onDelete: "set null" }),
  planId: uuid("plan_id").references(() => plans.id, { onDelete: "set null" }),
  username: text("username").notNull(),
  password: text("password").notNull(),
  profile: text("profile"),
  comment: text("comment"),
  blocked: boolean("blocked").notNull().default(false),
  /** ID externo ERP Atlaz (cliente/contrato). */
  atlazCustomerId: text("atlaz_customer_id"),
  atlazContractId: text("atlaz_contract_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  companyUsername: uniqueIndex("hotspot_users_company_username").on(t.companyId, t.username),
}));
