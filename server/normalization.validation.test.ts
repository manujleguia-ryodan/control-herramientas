import { describe, expect, it } from "vitest";
import { normalizeBrand, normalizeCode, normalizeDescription, normalizeLocation, normalizeName, normalizeType } from "../shared/normalization";

describe("formato único de catálogos", () => {
  it("normaliza códigos sin distinguir mayúsculas y minúsculas", () => {
    expect(normalizeCode("  tag-01 a ")).toBe("TAG-01 A");
  });

  it("normaliza nombres y descripciones con una presentación consistente", () => {
    expect(normalizeName("  juan   pérez ")).toBe("Juan Pérez");
    expect(normalizeDescription("martillo   demo")).toBe("Martillo Demo");
    expect(normalizeBrand(" acme tools ")).toBe("ACME TOOLS");
    expect(normalizeLocation(" estante a - nivel 2 ")).toBe("ESTANTE A - NIVEL 2");
    expect(normalizeType("CONTRATISTA")).toBe("Contratista");
  });
});
