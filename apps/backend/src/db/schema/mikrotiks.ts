import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";

/** Roteadores MikroTik por empresa (multi-router). */
export const mikrotiks = pgTable("mikrotiks", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  host: text("host").notNull(),
  port: integer("port").notNull().default(8728),
  apiUser: text("api_user").notNull(),
  /** Senha API — em produção criptografar na camada de aplicação antes de persistir. */
  apiPassword: text("api_password").notNull(),
  useTls: boolean("use_tls").notNull().default(false),
  active: boolean("active").notNull().default(true),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
