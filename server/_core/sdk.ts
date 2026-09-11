import type { User } from "../../drizzle/schema";

export type AuthenticatedUser = User & { isCron?: boolean; taskUid?: string };

/** OAuth fue desactivado: el sistema es de uso interno y autentica por PIN. */
class InternalOnlySdk {
  async authenticateRequest(): Promise<AuthenticatedUser | null> { return null; }
  async exchangeCodeForToken(): Promise<never> { throw new Error("OAuth disabled: use internal PIN login"); }
  async getUserInfo(): Promise<never> { throw new Error("OAuth disabled: use internal PIN login"); }
  async createSessionToken(): Promise<never> { throw new Error("OAuth disabled: use internal PIN login"); }
}
export const sdk = new InternalOnlySdk();
