import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { eq, and, gt } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import crypto from "node:crypto";
import type { JwtPayload, UserRole } from "@hotspot/shared";
import { db } from "../../db/index.js";
import { users, sessions } from "../../db/schema/index.js";
import { AppError } from "../../middlewares/error-handler.js";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function loginUser(params: {
  email: string;
  password: string;
  ip?: string;
  userAgent?: string;
  accessSecret: string;
  accessExpires: string;
  refreshExpires: string;
}): Promise<{ user: typeof users.$inferSelect; tokens: AuthTokens }> {
  const row = await db.query.users.findFirst({ where: eq(users.email, params.email.toLowerCase()) });
  if (!row?.active) throw new AppError(401, "Credenciais inválidas");

  const ok = await bcrypt.compare(params.password, row.passwordHash);
  if (!ok) throw new AppError(401, "Credenciais inválidas");

  const payload: JwtPayload = {
    sub: row.id,
    email: row.email,
    companyId: row.companyId,
    role: row.role as UserRole,
  };

  const accessToken = jwt.sign(payload, params.accessSecret, {
    expiresIn: params.accessExpires,
  } as SignOptions);
  const refreshToken = uuidv4() + "." + uuidv4();
  const refreshTokenHash = hashToken(refreshToken);

  const refreshMs = parseDurationToMs(params.refreshExpires);
  const expiresAt = new Date(Date.now() + refreshMs);

  await db.insert(sessions).values({
    userId: row.id,
    refreshTokenHash,
    expiresAt,
    ip: params.ip,
    userAgent: params.userAgent,
  });

  await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, row.id));

  const decoded = jwt.decode(accessToken) as { exp?: number } | null;
  const expiresIn = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900;

  return {
    user: row,
    tokens: { accessToken, refreshToken, expiresIn },
  };
}

export async function refreshTokens(params: {
  refreshToken: string;
  accessSecret: string;
  accessExpires: string;
  refreshExpires: string;
}): Promise<{ tokens: AuthTokens; user: typeof users.$inferSelect }> {
  const hash = hashToken(params.refreshToken);
  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.refreshTokenHash, hash), gt(sessions.expiresAt, new Date())),
  });
  if (!session) throw new AppError(401, "Sessão inválida");

  const userRow = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
  if (!userRow?.active) throw new AppError(401, "Usuário inativo");

  await db.delete(sessions).where(eq(sessions.id, session.id));

  const payload: JwtPayload = {
    sub: userRow.id,
    email: userRow.email,
    companyId: userRow.companyId,
    role: userRow.role as UserRole,
  };

  const accessToken = jwt.sign(payload, params.accessSecret, {
    expiresIn: params.accessExpires,
  } as SignOptions);
  const refreshToken = uuidv4() + "." + uuidv4();
  const refreshTokenHash = hashToken(refreshToken);
  const refreshMs = parseDurationToMs(params.refreshExpires);
  const expiresAt = new Date(Date.now() + refreshMs);

  await db.insert(sessions).values({
    userId: userRow.id,
    refreshTokenHash,
    expiresAt,
    ip: session.ip,
    userAgent: session.userAgent,
  });

  const decoded = jwt.decode(accessToken) as { exp?: number } | null;
  const expiresIn = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900;

  return { user: userRow, tokens: { accessToken, refreshToken, expiresIn } };
}

/** Parser simples para durações tipo 15m, 7d, 12h */
function parseDurationToMs(input: string): number {
  const m = /^(\d+)([smhd])$/.exec(input.trim());
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const n = Number(m[1]);
  const u = m[2];
  const mult = u === "s" ? 1000 : u === "m" ? 60_000 : u === "h" ? 3_600_000 : 86_400_000;
  return n * mult;
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}
