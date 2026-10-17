import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("importación independiente en la interfaz", () => {
  it("permite cargar herramientas y personal por separado", () => {
    const ui = readFileSync("client/src/pages/Home.tsx", "utf8");
    expect(ui).toContain("importToolsCsvFile");
    expect(ui).toContain("importPeopleCsvFile");
    expect(ui).toContain("/api/import/tools");
    expect(ui).toContain("/api/import/personal");
    expect(ui).not.toContain("Procesar ambos CSV");
    expect(ui).not.toContain("Selecciona los dos archivos CSV antes de importar.");
  });
});
