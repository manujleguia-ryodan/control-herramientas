import crypto from "node:crypto";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import { getDb } from "./db";
import { storekeepers } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { ENV } from "./_core/env";
import { verifyPassword } from "./passwords";

const INTERNAL_PREFIX = "internal:";
const INTERNAL_APP = "control-herramientas-internal";

export type InternalSession = { storekeeperId: number; code: string; name: string; role: "admin" | "operator" };

function secret() { return new TextEncoder().encode(ENV.cookieSecret); }

export async function createInternalSession(storekeeper: { id: number; code: string; fullName: string; role: "admin" | "operator" }) {
  return new SignJWT({ kind: INTERNAL_PREFIX, storekeeperId: storekeeper.id, code: storekeeper.code, name: storekeeper.fullName, role: storekeeper.role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(INTERNAL_APP)
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + ONE_YEAR_MS) / 1000))
    .sign(secret());
}

export async function getInternalSession(req: Request): Promise<InternalSession | null> {
  const header = req.headers.authorization;
  const cookies = parseCookieHeader(req.headers.cookie ?? "");
  const token = cookies[COOKIE_NAME] || (typeof header === "string" && header.startsWith("Bearer ") ? header.slice(7) : undefined);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (payload.sub !== INTERNAL_APP || payload.kind !== INTERNAL_PREFIX || typeof payload.storekeeperId !== "number" || typeof payload.code !== "string" || typeof payload.name !== "string") return null;
    const db = await getDb();
    if (!db) return null;
    const row = (await db.select({ id: storekeepers.id, code: storekeepers.code, fullName: storekeepers.fullName, role: storekeepers.role, active: storekeepers.active }).from(storekeepers).where(and(eq(storekeepers.id, payload.storekeeperId), eq(storekeepers.active, 1))).limit(1))[0];
    if (!row || row.code !== payload.code) return null;
    return { storekeeperId: row.id, code: row.code, name: row.fullName, role: row.role };
  } catch { return null; }
}

export function setInternalSessionCookie(res: Response, req: Request, token: string) {
  const secure = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https";
  res.cookie(COOKIE_NAME, token, { httpOnly: true, path: "/", sameSite: "lax", secure, maxAge: ONE_YEAR_MS });
}

export function clearInternalSessionCookie(res: Response, req: Request) {
  const secure = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https";
  res.clearCookie(COOKIE_NAME, { httpOnly: true, path: "/", sameSite: "lax", secure, maxAge: -1 });
}
