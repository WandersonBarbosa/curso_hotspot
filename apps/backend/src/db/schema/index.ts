export * from "./companies.js";
export * from "./users.js";
export * from "./mikrotiks.js";
export * from "./plans.js";
export * from "./hotspot_users.js";
export * from "./invoices.js";
export * from "./payments.js";
export * from "./sessions.js";
export * from "./logs.js";

import { relations } from "drizzle-orm";
import { companies } from "./companies.js";
import { users } from "./users.js";
import { mikrotiks } from "./mikrotiks.js";
import { plans } from "./plans.js";
import { hotspotUsers } from "./hotspot_users.js";
import { invoices } from "./invoices.js";
import { payments } from "./payments.js";
import { sessions } from "./sessions.js";
import { logs } from "./logs.js";

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  mikrotiks: many(mikrotiks),
  plans: many(plans),
  hotspotUsers: many(hotspotUsers),
  invoices: many(invoices),
  payments: many(payments),
  logs: many(logs),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
  sessions: many(sessions),
}));

export const mikrotiksRelations = relations(mikrotiks, ({ one, many }) => ({
  company: one(companies, { fields: [mikrotiks.companyId], references: [companies.id] }),
  hotspotUsers: many(hotspotUsers),
}));

export const plansRelations = relations(plans, ({ one, many }) => ({
  company: one(companies, { fields: [plans.companyId], references: [companies.id] }),
  hotspotUsers: many(hotspotUsers),
}));

export const hotspotUsersRelations = relations(hotspotUsers, ({ one, many }) => ({
  company: one(companies, { fields: [hotspotUsers.companyId], references: [companies.id] }),
  mikrotik: one(mikrotiks, { fields: [hotspotUsers.mikrotikId], references: [mikrotiks.id] }),
  plan: one(plans, { fields: [hotspotUsers.planId], references: [plans.id] }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  company: one(companies, { fields: [invoices.companyId], references: [companies.id] }),
  hotspotUser: one(hotspotUsers, { fields: [invoices.hotspotUserId], references: [hotspotUsers.id] }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  company: one(companies, { fields: [payments.companyId], references: [companies.id] }),
  invoice: one(invoices, { fields: [payments.invoiceId], references: [invoices.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const logsRelations = relations(logs, ({ one }) => ({
  company: one(companies, { fields: [logs.companyId], references: [companies.id] }),
  user: one(users, { fields: [logs.userId], references: [users.id] }),
}));
