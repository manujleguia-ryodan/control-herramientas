import { describe, expect, it } from "vitest";
import { movimientos } from "../drizzle/schema";
import { validateCondition } from "./db";

describe("movement ledger", () => {
  it("defines an append-only Entrada/Salida ledger", () => {
    expect(movimientos).toBeDefined();
    expect(Object.keys(movimientos)).toEqual(expect.arrayContaining(["id", "tipo", "idTag", "userId", "fechaMovimiento", "transaccionId"]));
  });

  it("requires an observation for abnormal conditions", () => {
    expect(() => validateCondition("Con pieza rota", "")).toThrow("La observación es obligatoria cuando la herramienta no está completa y operativa.");
    expect(validateCondition("Con pieza rota", "Broca rota de 10 mm")).toBe("Con pieza rota");
    expect(validateCondition("Completa y operativa", "")).toBe("Completa y operativa");
  });
});
