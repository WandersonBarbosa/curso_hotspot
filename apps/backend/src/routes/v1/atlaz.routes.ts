import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import type { AppConfig } from "../../config/env.js";
import { AppError } from "../../middlewares/error-handler.js";
import { getAtlazServiceForCompany } from "../../integrations/atlaz/index.js";

export function createAtlazRouter(cfg: AppConfig) {
  const r = Router();
  const auth = authenticate(cfg.JWT_ACCESS_SECRET);
  r.use(auth, requireRole("super_admin", "admin", "subadmin"));

  r.get("/:companyId/customers", async (req, res, next) => {
    try {
      const companyId = req.params.companyId;
      if (req.auth?.role !== "super_admin" && companyId !== req.auth?.companyId) {
        throw new AppError(403, "Empresa inválida");
      }
      const svc = await getAtlazServiceForCompany(companyId, cfg.ATLAZ_API_BASE_URL, cfg.ATLAZ_API_TOKEN);
      const items = await svc.fetchCustomers();
      res.json(items);
    } catch (e) {
      next(e);
    }
  });

  r.get("/:companyId/customers/:customerId/contracts", async (req, res, next) => {
    try {
      const { companyId, customerId } = req.params;
      if (req.auth?.role !== "super_admin" && companyId !== req.auth?.companyId) {
        throw new AppError(403, "Empresa inválida");
      }
      const svc = await getAtlazServiceForCompany(companyId, cfg.ATLAZ_API_BASE_URL, cfg.ATLAZ_API_TOKEN);
      const items = await svc.fetchContracts(customerId);
      res.json(items);
    } catch (e) {
      next(e);
    }
  });

  r.get("/:companyId/customers/:customerId/invoices", async (req, res, next) => {
    try {
      const { companyId, customerId } = req.params;
      if (req.auth?.role !== "super_admin" && companyId !== req.auth?.companyId) {
        throw new AppError(403, "Empresa inválida");
      }
      const svc = await getAtlazServiceForCompany(companyId, cfg.ATLAZ_API_BASE_URL, cfg.ATLAZ_API_TOKEN);
      const items = await svc.fetchInvoices(customerId);
      res.json(items);
    } catch (e) {
      next(e);
    }
  });

  return r;
}
