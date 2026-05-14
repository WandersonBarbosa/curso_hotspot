import { Router } from "express";
import type { AppConfig } from "../../config/env.js";
import { createAuthRouter } from "./auth.routes.js";
import { createCompaniesRouter } from "./companies.routes.js";
import { createMikrotiksRouter } from "./mikrotiks.routes.js";
import { createHotspotUsersRouter } from "./hotspot-users.routes.js";
import { createDashboardRouter } from "./dashboard.routes.js";
import { createWebhooksRouter } from "./webhooks.routes.js";
import { createAtlazRouter } from "./atlaz.routes.js";
import { createMeRouter } from "./me.routes.js";

export function createV1Router(cfg: AppConfig) {
  const r = Router();
  r.use("/auth", createAuthRouter(cfg));
  r.use("/me", createMeRouter(cfg));
  r.use("/companies", createCompaniesRouter(cfg));
  r.use("/mikrotiks", createMikrotiksRouter(cfg));
  r.use("/hotspot-users", createHotspotUsersRouter(cfg));
  r.use("/dashboard", createDashboardRouter(cfg));
  r.use("/atlaz", createAtlazRouter(cfg));
  r.use("/webhooks", createWebhooksRouter(cfg));
  return r;
}
