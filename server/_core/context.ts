import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getSessionUser } from "../internalSession";

export type TrpcContext = { req: CreateExpressContextOptions["req"]; res: CreateExpressContextOptions["res"]; user: User | null };

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  const session = await getSessionUser(opts.req);
  const now = new Date();
  const user: User | null = session ? { id: session.id, nombre: session.nombre, rol: session.rol, estado: 1, name: session.nombre, email: null, openId: String(session.id), loginMethod: "pin", role: session.rol === "Admin" ? "admin" : "user", createdAt: now, updatedAt: now, lastSignedIn: now } : null;
  return { req: opts.req, res: opts.res, user };
}
