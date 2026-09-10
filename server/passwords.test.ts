import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./passwords";

describe("storekeeper passwords", () => {
  it("hashes and verifies the original password", () => {
    const stored = hashPassword("almacen-seguro");
    expect(stored).not.toContain("almacen-seguro");
    expect(verifyPassword("almacen-seguro", stored)).toBe(true);
  });

  it("rejects a different password", () => {
    const stored = hashPassword("almacen-seguro");
    expect(verifyPassword("otra-clave", stored)).toBe(false);
  });
});
