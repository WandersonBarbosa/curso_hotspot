import { Router } from "express";
import { z } from "zod";
import { loginUser, refreshTokens } from "../../modules/auth/auth.service.js";
import { validateBody } from "../../middlewares/validate.js";
import { loginLimiter } from "../../middlewares/rate-limit.js";
import { auditLog } from "../../modules/audit/audit.service.js";
import type { AppConfig } from "../../config/env.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export function createAuthRouter(cfg: AppConfig) {
  const r = Router();

  r.post("/login", loginLimiter, validateBody(loginSchema), async (req, res, next) => {
    try {
      const { email, password } = req.body as z.infer<typeof loginSchema>;
      const { user, tokens } = await loginUser({
        email,
        password,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        accessSecret: cfg.JWT_ACCESS_SECRET,
        accessExpires: cfg.JWT_ACCESS_EXPIRES,
        refreshExpires: cfg.JWT_REFRESH_EXPIRES,
      });
      await auditLog({
        companyId: user.companyId,
        userId: user.id,
        action: "auth.login",
        ip: req.ip,
      });
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
        },
        ...tokens,
      });
    } catch (e) {
      next(e);
    }
  });

  r.post("/refresh", validateBody(refreshSchema), async (req, res, next) => {
    try {
      const { refreshToken } = req.body as z.infer<typeof refreshSchema>;
      const { tokens, user } = await refreshTokens({
        refreshToken,
        accessSecret: cfg.JWT_ACCESS_SECRET,
        accessExpires: cfg.JWT_ACCESS_EXPIRES,
        refreshExpires: cfg.JWT_REFRESH_EXPIRES,
      });
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
        },
        ...tokens,
      });
    } catch (e) {
      next(e);
    }
  });

  return r;
}
