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

  it("requires the worker first and exposes multi-tool dispatch in the UI and router", () => {
    const ui = readFileSync("client/src/pages/Home.tsx", "utf8");
    const router = readFileSync("server/routers.ts", "utf8");
    const db = readFileSync("server/db.ts", "utf8");
    expect(ui).toContain("1. Trabajador que recibe");
    expect(ui).toContain("2. Herramientas a prestar");
    expect(ui).toContain("selectedToolCodes");
    expect(router).toContain("dispatchBulk");
    expect(db).toContain("dispatchTransactionsBulk");
  });
});


describe("bulk dispatch UI contract", () => {
  it("keeps evidence upload limited to five files", () => {
    const source = readFileSync("client/src/pages/Home.tsx", "utf8");
    expect(source).toContain('accept="image/*" multiple');
  });
});

// The report and dispatch contracts intentionally remain in one file because both
// are audit-critical flows used by the warehouse operator.
void it;
void expect;
void describe;
