import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { users } from "./users.js";

export const logs = pgTable("logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  resource: text("resource"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  ip: text("ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
