import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { importToolsCsv } from "./db";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
function caller() {
  const user: AuthenticatedUser = { id: 1, nombre: "Administrador", rol: "Admin", estado: 1, name: "Administrador", role: "admin" };
  const ctx: TrpcContext = { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
  return appRouter.createCaller(ctx);
}

describe("stock and import validation", () => {
  it("requires the Cantidad column in tool imports", async () => {
    await expect(importToolsCsv("ID_Tag,Descripcion,Marca,Estado_Activo,Ubicacion\nT-01,Martillo,ACME,1,Estante A - Nivel 1")).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects zero quantity in quick dispatch", async () => {
    await expect(caller().movements.dispatch({ idTag: "T-01", codigoTrabajador: "P-01", userEntrega: 1, cantidad: 0 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
