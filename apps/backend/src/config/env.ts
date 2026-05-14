import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_EXPIRES: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  ATLAZ_API_BASE_URL: z.string().optional(),
  ATLAZ_API_TOKEN: z.string().optional(),
  WEBHOOK_HMAC_SECRET: z.string().optional(),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(): AppConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("Variáveis de ambiente inválidas:", parsed.error.flatten().fieldErrors);
    throw new Error("Falha ao carregar configuração");
  }
  return parsed.data;
}
