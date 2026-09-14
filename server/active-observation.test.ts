import { describe, expect, it } from "vitest";
import { catalogoHerramientas } from "../drizzle/schema";
import { CONDITION_COMPLETE, validateCondition } from "./db";

describe("active inventory observations", () => {
  it("has current-state fields separate from the immutable movement ledger", () => {
    expect(catalogoHerramientas.estadoActual).toBeDefined();
    expect(catalogoHerramientas.condicionActual).toBeDefined();
    expect(catalogoHerramientas.observacionActiva).toBeDefined();
    expect(catalogoHerramientas.observacionFecha).toBeDefined();
    expect(catalogoHerramientas.observacionUsuario).toBeDefined();
  });

  it("requires an observation for an abnormal condition and allows a normal return without one", () => {
    expect(validateCondition(CONDITION_COMPLETE, undefined)).toBe(CONDITION_COMPLETE);
    expect(() => validateCondition("Con pieza faltante", undefined)).toThrow(
      "La observación es obligatoria cuando la herramienta no está completa y operativa.",
    );
    expect(validateCondition("Con pieza faltante", "Falta broca de 10 mm")).toBe("Con pieza faltante");
  });
});
