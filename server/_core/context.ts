import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getInternalSession } from "../internalAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  const session = await getInternalSession(opts.req);
  const now = new Date();
  const user: User | null = session ? {
    id: session.storekeeperId,
    openId: `storekeeper:${session.code}`,
    name: session.name,
    email: null,
    loginMethod: "internal-code",
    role: session.role === "admin" ? "admin" : "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  } : null;
  return { req: opts.req, res: opts.res, user };
}
