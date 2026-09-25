import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("tablet signature auto-confirm contract", () => {
  it("registers the loan and movement as the final signature action", () => {
    const db = readFileSync("server/db.ts", "utf8");
    const start = db.indexOf("export async function signLatestPendingDispatch");
    const end = db.indexOf("export async function confirmLatestPendingDispatch", start);
    const handler = db.slice(start, end);

    expect(handler).toContain("dispatchTransactionsBulk");
    expect(handler).toContain('estado: "CONFIRMADO"');
    expect(handler).not.toContain('estado: "FIRMADO"');
  });

  it("does not expose the previous handoff wording in the tablet signature modal", () => {
    const ui = readFileSync("client/src/pages/Home.tsx", "utf8");
    expect(ui).toContain("Firmar y registrar despacho");
    expect(ui).not.toContain("Firma enviada a la computadora");
  });
});
