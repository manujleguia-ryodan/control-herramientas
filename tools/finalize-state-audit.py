from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s=p.read_text()
s=s.replace('{selectedToolObservations.length > 0 && <div className="dispatch-observation-warning">','{selectedToolObservations.length > 0 && !selectedToolUnavailable && <div className="dispatch-observation-warning">',1)
p.write_text(s)

p=Path('/home/ubuntu/control-herramientas/server/db.ts')
s=p.read_text()
old='''export async function deactivateTool(idTag: string, motivoBaja: string, fechaIncidente: number, trabajadorResponsable: string, usuarioBaja: number) {\n  const db = await getDb(); if (!db) throw new Error("Database unavailable");\n  await db.update(catalogoHerramientas).set({ estadoActivo: 0 }).where(eq(catalogoHerramientas.idTag, idTag));'''
new='''export async function deactivateTool(idTag: string, motivoBaja: string, fechaIncidente: number, trabajadorResponsable: string, usuarioBaja: number) {\n  const db = await getDb(); if (!db) throw new Error("Database unavailable");\n  const activeLoan = await db.select({ id: transacciones.id }).from(transacciones).where(and(eq(transacciones.idTag, idTag), isNull(transacciones.fechaRetorno))).limit(1);\n  if (activeLoan.length) throw new TRPCError({ code: "CONFLICT", message: "No se puede dar de baja una herramienta que está prestada. Primero debe ser devuelta." });\n  await db.update(catalogoHerramientas).set({ estadoActivo: 0 }).where(eq(catalogoHerramientas.idTag, idTag));'''
if old not in s: raise SystemExit('retirement safety marker not found')
p.write_text(s.replace(old,new,1))
