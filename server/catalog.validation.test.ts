import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function caller() {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "catalog-test-user",
    email: "test@example.com",
    name: "Administrador de prueba",
    loginMethod: "test",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return appRouter.createCaller(ctx);
}

describe("catalog input validation", () => {
  it("requires the core fields for an Excel import row", async () => {
    await expect(caller().catalog.import({
      units: [{ code: 42 as never, name: "" }],
      locations: [],
      storekeepers: [],
      workers: [],
      tools: [],
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects non-image uploads before storage is called", async () => {
    await expect(caller().catalog.uploadImage({
      fileName: "manual.pdf",
      contentType: "application/pdf",
      dataUrl: "data:application/pdf;base64,ZmFrZQ==",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects a duplicate active serialized loan", async () => {
    await expect(caller().movements.create({
      toolId: 1,
      workerId: 1,
      storekeeperId: 1,
      type: "dispatch",
    })).rejects.toMatchObject({ code: "CONFLICT" });
  });
});


  it("requires the exact CSV headers for the hybrid import", async () => {
    await expect(caller().catalog.importCsv({
      herramientasCsv: "ID_Tag,Descripcion,Marca,Estado_Activo,Ubicacion\nT-01,Martillo,ACME,1,Estante A - Nivel 2",
      personalCsv: "Codigo_Trabajador,Nombre_Completo,Compañía,Tipo\nP-01,Persona,Marcobre,Marcobre",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
