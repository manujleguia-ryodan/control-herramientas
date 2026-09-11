import { SignJWT, jwtVerify } from "jose";
import type { Request, Response } from "express";
import { COOKIE_NAME } from "@shared/const";
import { ENV } from "./_core/env";
import { getUserById } from "./db";

const secret = new TextEncoder().encode(ENV.cookieSecret || "local-internal-session-secret");
const ISSUER = "control-herramientas-interno";
export type InternalUser = { id: number; nombre: string; rol: "Admin" | "Almacen" };

export async function createSession(user: InternalUser) {
  return new SignJWT({ id: user.id, nombre: user.nombre, rol: user.rol })
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("12h").setIssuer(ISSUER).sign(secret);
}
export function setSession(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, { httpOnly: true, sameSite: "lax", secure: ENV.isProduction, path: "/", maxAge: 12 * 60 * 60 * 1000 });
}
export function clearSession(res: Response) { res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: "lax", secure: ENV.isProduction, path: "/" }); }
function cookieValue(req: Request) { return req.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1); }
export async function getSessionUser(req: Request): Promise<InternalUser | null> {
  const token = cookieValue(req); if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: ISSUER });
    const id = Number(payload.id); if (!Number.isInteger(id)) return null;
    const user = await getUserById(id); if (!user || !user.estado) return null;
    return { id: user.id, nombre: user.nombre, rol: user.rol };
  } catch { return null; }
}
