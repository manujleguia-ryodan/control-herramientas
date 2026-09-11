import { describe, expect, it } from "vitest";
import { importToolsCsv } from "./db";

describe("serial asset validation", () => {
  it("requires the exact serialized tool columns", async () => {
    await expect(importToolsCsv("ID_Tag,Descripcion,Marca,Estado_Activo,Cantidad\nT-01,Martillo,ACME,1,1")).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects a legacy quantity column in the import header", async () => {
    await expect(importToolsCsv("ID_Tag,Descripcion,Marca,Estado_Activo,Ubicacion,Cantidad\nT-01,Martillo,ACME,1,Estante A,1")).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
