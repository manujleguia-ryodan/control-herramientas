import fs from 'node:fs';
const dbp='/home/ubuntu/control-herramientas/server/db.ts'; let d=fs.readFileSync(dbp,'utf8');
const marker='export async function deactivateTool(idTag: string, motivoBaja: string) {';
const fn=`export async function deleteToolSafely(idTag: string) {
  const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const active = await db.select({ id: transacciones.id }).from(transacciones).where(and(eq(transacciones.idTag, idTag), isNull(transacciones.fechaRetorno))).limit(1);
  if (active.length) throw new TRPCError({ code: "CONFLICT", message: "No se puede eliminar: la herramienta tiene préstamos activos." });
  await db.delete(catalogoHerramientas).where(eq(catalogoHerramientas.idTag, idTag));
  return { success: true } as const;
}
`;
if(!d.includes('export async function deleteToolSafely')) d=d.replace(marker,fn+marker); fs.writeFileSync(dbp,d);
const rp='/home/ubuntu/control-herramientas/server/routers.ts'; let r=fs.readFileSync(rp,'utf8');
r=r.replace('deactivatePersonal, deactivateTool, deactivateUser,', 'deactivatePersonal, deactivateTool, deleteToolSafely, deactivateUser,');
r=r.replace('deactivateTool: adminProcedure.input(z.object({ idTag: z.string().min(1), motivoBaja: z.string().trim().min(3).max(2000) })).mutation(({ input }) => deactivateTool(input.idTag, input.motivoBaja)),','deactivateTool: adminProcedure.input(z.object({ idTag: z.string().min(1), motivoBaja: z.string().trim().min(3).max(2000) })).mutation(({ input }) => deactivateTool(input.idTag, input.motivoBaja)),\n    deleteToolSafely: adminProcedure.input(z.object({ idTag: z.string().min(1) })).mutation(({ input }) => deleteToolSafely(input.idTag)),'); fs.writeFileSync(rp,r);
