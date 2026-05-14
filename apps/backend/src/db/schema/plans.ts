import { pgTable, text, timestamp, uuid, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";

export const plans = pgTable("plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  /** Download em Mbps (referência para UI / MikroTik profile). */
  downloadMbps: numeric("download_mbps", { precision: 10, scale: 2 }).notNull(),
  uploadMbps: numeric("upload_mbps", { precision: 10, scale: 2 }).notNull(),
  priceCents: integer("price_cents").notNull().default(0),
  mikrotikProfileName: text("mikrotik_profile_name"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
