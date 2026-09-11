import { describe, expect, it } from "vitest";
import { bajasHerramientas } from "../drizzle/schema";
import { readFileSync } from "node:fs";

describe("retirement report contract", () => {
  it("includes supervisor and generated PDF metadata in the audit table", () => {
    const columns = Object.keys(bajasHerramientas);
    expect(columns).toContain("supervisorCodigo");
    expect(columns).toContain("pdfNombre");
  });

  it("exposes the multipart endpoint and limits evidence to five files", () => {
    const source = readFileSync("server/_core/index.ts", "utf8");
    expect(source).toContain('/api/retirements/report');
    expect(source).toContain('upload.array("photos", 5)');
  });

  it("keeps the exact unavailable message and early dispatch lock in the UI", () => {
    const source = readFileSync("client/src/pages/Home.tsx", "utf8");
    expect(source).toContain("⚠️ NO DISPONIBLE: Actualmente en custodia de");
    expect(source).toContain("selectedToolUnavailable");
    expect(source).toContain('accept="image/*" multiple');
  });
});
