import { pgTable, text, timestamp, uuid, boolean, jsonb, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";

/** Perfis de acesso multiempresa. */
export const userRoleEnum = pgEnum("user_role", ["super_admin", "admin", "subadmin", "operator"]);

export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  document: text("document"),
  active: boolean("active").notNull().default(true),
  /** Configurações PIX/ERP por empresa (JSON). */
  settings: jsonb("settings").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  slugIdx: uniqueIndex("companies_slug_idx").on(t.slug),
}));
