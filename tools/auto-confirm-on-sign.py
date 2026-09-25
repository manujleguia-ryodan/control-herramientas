from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/server/db.ts')
s=p.read_text()
old='''export async function signLatestPendingDispatch(firmaTrabajador: string) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const rows = await db.select().from(despachosPendientes).where(eq(despachosPendientes.estado, "PENDIENTE")).orderBy(desc(despachosPendientes.creadoAt)).limit(1);
  const row = rows[0]; if (!row) throw new TRPCError({ code: "CONFLICT", message: "No hay un despacho pendiente de firma." });
  if (Date.now() > row.creadoAt + 10 * 60 * 1000) throw new TRPCError({ code: "CONFLICT", message: "El despacho pendiente expiró." });
  await db.update(despachosPendientes).set({ estado: "FIRMADO", firmaTrabajador, firmadoAt: Date.now() }).where(eq(despachosPendientes.id, row.id));
  return getLatestPendingDispatch();
}'''
new='''export async function signLatestPendingDispatch(firmaTrabajador: string) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const rows = await db.select().from(despachosPendientes).where(eq(despachosPendientes.estado, "PENDIENTE")).orderBy(desc(despachosPendientes.creadoAt)).limit(1);
  const row = rows[0]; if (!row) throw new TRPCError({ code: "CONFLICT", message: "No hay un despacho pendiente de firma." });
  if (Date.now() > row.creadoAt + 10 * 60 * 1000) throw new TRPCError({ code: "CONFLICT", message: "El despacho pendiente expiró." });
  const result = await dispatchTransactionsBulk(JSON.parse(row.idTags) as string[], row.codigoTrabajador, row.userEntrega, firmaTrabajador);
  await db.update(despachosPendientes).set({ estado: "CONFIRMADO", firmaTrabajador, firmadoAt: Date.now(), confirmadoAt: Date.now() }).where(eq(despachosPendientes.id, row.id));
  return { ...result, firmado: true } as const;
}'''
if old not in s: raise SystemExit('signLatest block not found')
s=s.replace(old,new,1)
p.write_text(s)
PY
cd /home/ubuntu/control-herramientas && sed -i '/^PY$/d;/^cd \/home\/ubuntu\/control-herramientas &&/d' tools/auto-confirm-on-sign.py && python3 tools/auto-confirm-on-sign.py && rm -f tools/auto-confirm-on-sign.py && pnpm exec tsc --noEmit