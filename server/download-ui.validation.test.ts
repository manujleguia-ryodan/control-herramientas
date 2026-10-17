import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("descargas y alta de herramientas", () => {
  it("permite al administrador elegir la ubicación de cada reporte", () => {
    const ui = readFileSync("client/src/pages/Home.tsx", "utf8");
    expect(ui).toContain("showSaveFilePicker");
    expect(ui).toContain("me.data?.role === \"admin\"");
    expect(ui).toContain("Reporte_Movimientos.xlsx");
    expect(ui).toContain("Reporte_FS_");
  });

  it("mantiene compacto el botón principal del formulario de herramienta", () => {
    const css = readFileSync("client/src/index.css", "utf8");
    expect(css).toContain(".add-form > .pos-primary { height: 36px; min-height: 36px;");
  });
});
