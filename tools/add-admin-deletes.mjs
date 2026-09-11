import fs from 'node:fs';
const dbp='/home/ubuntu/control-herramientas/server/db.ts'; let d=fs.readFileSync(dbp,'utf8');
const marker='export async function deactivateUser(id: number) {';
const fn=`export async function deleteUserSafely(id: number, actingUserId: number) {
  const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  if (id === actingUserId) throw new TRPCError({ code: "BAD_REQUEST", message: "No puedes eliminar tu propio usuario administrador." });
  const target = (await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1))[0];
  if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "El usuario no existe." });
  if (target.rol === "Admin") {
    const admins = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.rol, "Admin"));
    if (admins.length <= 1) throw new TRPCError({ code: "CONFLICT", message: "No se puede eliminar al último Administrador." });
  }
  await db.delete(usuarios).where(eq(usuarios.id, id));
  return { success: true } as const;
}
`;
if(!d.includes('export async function deleteUserSafely')) d=d.replace(marker,fn+marker); fs.writeFileSync(dbp,d);
const rp='/home/ubuntu/control-herramientas/server/routers.ts'; let r=fs.readFileSync(rp,'utf8');
r=r.replace('deleteToolSafely, deactivateUser,', 'deleteToolSafely, deleteUserSafely, deactivateUser,');
r=r.replace('deactivateUser: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deactivateUser(input.id)),','deactivateUser: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deactivateUser(input.id)),\n    deleteUserSafely: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input, ctx }) => deleteUserSafely(input.id, ctx.user.id)),'); fs.writeFileSync(rp,r);
const hp='/home/ubuntu/control-herramientas/client/src/pages/Home.tsx'; let h=fs.readFileSync(hp,'utf8');
h=h.replace('const retireMutation = trpc.catalog.deactivateTool.useMutation({ onSuccess: () => void utils.catalog.snapshot.invalidate() });', 'const retireMutation = trpc.catalog.deactivateTool.useMutation({ onSuccess: () => void utils.catalog.snapshot.invalidate() });\n  const deleteToolMutation = trpc.catalog.deleteToolSafely.useMutation({ onSuccess: () => void utils.catalog.snapshot.invalidate() });\n  const deleteUserMutation = trpc.catalog.deleteUserSafely.useMutation({ onSuccess: () => { void accessUsers.refetch(); void users.refetch(); } });');
h=h.replace('const saveRetire = async () => {', 'const deleteTool = async (tool: Tool) => { if (!window.confirm(`¿Eliminar definitivamente ${tool.code} del catálogo? El historial de movimientos se conservará.`)) return; try { await deleteToolMutation.mutateAsync({ idTag: tool.code }); notify("Herramienta eliminada del catálogo; historial conservado"); } catch (error) { notify(error instanceof Error ? error.message : "No se pudo eliminar la herramienta."); } };\n  const deleteUser = async (id: number, name: string) => { if (!window.confirm(`¿Eliminar definitivamente al usuario ${name}? Su historial se conservará.`)) return; try { await deleteUserMutation.mutateAsync({ id }); notify("Usuario eliminado; historial conservado"); } catch (error) { notify(error instanceof Error ? error.message : "No se pudo eliminar el usuario."); } };\n  const saveRetire = async () => {');
h=h.replace('<button className="retire-button" onClick={() => setModalTool(tool)}><ShieldAlert size={15} />Dar de baja</button>', '<button className="retire-button" onClick={() => setModalTool(tool)}><ShieldAlert size={15} />Dar de baja</button>{me.data!.role === "admin" && <button className="icon-danger" title="Eliminar definitivamente" onClick={() => void deleteTool(tool)}><Trash2 size={15} /></button>}');
h=h.replace('<td>{accessUser.estado ? "Activo" : "Inactivo"}</td></tr>', '<td>{accessUser.estado ? "Activo" : "Inactivo"}</td><td><button className="icon-danger" title="Eliminar usuario" disabled={accessUser.id === me.data!.id || deleteUserMutation.isPending} onClick={() => void deleteUser(accessUser.id, accessUser.nombre)}><Trash2 size={15} /></button></td></tr>');
h=h.replace('<th>Nombre</th><th>Rol</th><th>Estado</th>', '<th>Nombre</th><th>Rol</th><th>Estado</th><th></th>');
fs.writeFileSync(hp,h);
