import { describe, expect, it } from "vitest";
import { movimientos } from "../drizzle/schema";

describe("movement ledger", () => {
  it("defines an append-only Entrada/Salida ledger", () => {
    expect(movimientos).toBeDefined();
    expect(Object.keys(movimientos)).toEqual(expect.arrayContaining(["id", "tipo", "idTag", "userId", "cantidad", "fechaMovimiento", "transaccionId"]));
  });
});
