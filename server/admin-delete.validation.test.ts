import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
function adminCaller() {
  const user: AuthenticatedUser = { id: 1, nombre: "Admin", rol: "Admin", estado: 1, name: "Admin", role: "admin" };
  const ctx: TrpcContext = { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
  return appRouter.createCaller(ctx);
}

describe("administrative deletion validation", () => {
  it("requires a valid user ID", async () => {
    await expect(adminCaller().catalog.deleteUserSafely({ id: 0 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("requires a valid tool tag", async () => {
    await expect(adminCaller().catalog.deleteToolSafely({ idTag: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
