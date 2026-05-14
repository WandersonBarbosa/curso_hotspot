import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { API_PREFIX } from "@hotspot/shared";
import type { AppConfig } from "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { apiLimiter } from "./middlewares/rate-limit.js";
import { createV1Router } from "./routes/v1/index.js";
import { swaggerSpec } from "./swagger.js";

export function createApp(cfg: AppConfig) {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: cfg.CORS_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(apiLimiter);

  app.get("/health", (_req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

  app.use(`${API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get(`${API_PREFIX}/openapi.json`, (_req, res) => res.json(swaggerSpec));

  app.use(API_PREFIX, createV1Router(cfg));

  app.use(errorHandler as express.ErrorRequestHandler);

  return app;
}