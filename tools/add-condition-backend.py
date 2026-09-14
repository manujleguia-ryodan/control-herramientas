from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/server/db.ts')
s=p.read_text()
s=s.replace('''export async function recordMovement(input: { toolId: number; workerId: number; storekeeperId: number; type: "dispatch" | "return" | "transfer"; note?: string; destination?: string; condition?: string }) {''','''export const CONDITION_COMPLETE = "Completa y operativa";
export const CONDITION_OPTIONS = [CONDITION_COMPLETE, "Incompleta", "Con pieza faltante", "Con pieza rota", "Dañada", "Requiere revisión", "Otro"] as const;
function validateCondition(condition: string | undefined, observation: string | undefined) {
  const normalized = (condition || CONDITION_COMPLETE).trim();
  if (!CONDITION_OPTIONS.includes(normalized as typeof CONDITION_OPTIONS[number])) throw new TRPCError({ code: "BAD_REQUEST", message: "Selecciona una condición válida." });
  if (normalized !== CONDITION_COMPLETE && !observation?.trim()) throw new TRPCError({ code: "BAD_REQUEST", message: "La observación es obligatoria cuando la herramienta no está completa y operativa." });
  return normalized;
}

export async function recordMovement(input: { toolId: number; workerId: number; storekeeperId: number; type: "dispatch" | "return" | "transfer"; note?: string; destination?: string; condition?: string }) {''')
s=s.replace('''  if (input.type === "return") return returnTransaction(tool.code, input.storekeeperId);
  return dispatchTransaction({ idTag: tool.code, codigoTrabajador: worker.code, userEntrega: input.storekeeperId });''','''  if (input.type === "return") return returnTransaction(tool.code, input.storekeeperId, undefined, input.condition, input.note);
  return dispatchTransaction({ idTag: tool.code, codigoTrabajador: worker.code, userEntrega: input.storekeeperId, condicionSalida: input.condition, observacionSalida: input.note });''')
s=s.replace('''export async function dispatchTransaction(input: { idTag: string; codigoTrabajador: string; userEntrega: number }) {''','''export async function dispatchTransaction(input: { idTag: string; codigoTrabajador: string; userEntrega: number; condicionSalida?: string; observacionSalida?: string }) {''')
s=s.replace('''    const fecha = peruNow();
    const inserted = await tx.insert(transacciones).values({ idTag: tool.idTag, codigoTrabajador: worker.codigoTrabajador, userEntrega: input.userEntrega, fechaSalida: fecha, descripcionHerramienta: tool.descripcion, nombreTrabajador: worker.nombreCompleto, marcobreTrabajador: worker.marcobre, estado: "Prestada" });
    await tx.insert(movimientos).values({ tipo: "Salida", idTag: tool.idTag, codigoTrabajador: worker.codigoTrabajador, userId: input.userEntrega, fechaMovimiento: fecha, transaccionId: Number(inserted[0].insertId), descripcionHerramienta: tool.descripcion, nombreTrabajador: worker.nombreCompleto, observacion: "Despacho de herramienta" });''','''    const condicionSalida = validateCondition(input.condicionSalida, input.observacionSalida);
    const observacionSalida = input.observacionSalida?.trim() || "Despacho de herramienta";
    const fecha = peruNow();
    const inserted = await tx.insert(transacciones).values({ idTag: tool.idTag, codigoTrabajador: worker.codigoTrabajador, userEntrega: input.userEntrega, fechaSalida: fecha, descripcionHerramienta: tool.descripcion, nombreTrabajador: worker.nombreCompleto, marcobreTrabajador: worker.marcobre, estado: "Prestada", condicionSalida, observacionSalida });
    await tx.insert(movimientos).values({ tipo: "Salida", idTag: tool.idTag, codigoTrabajador: worker.codigoTrabajador, userId: input.userEntrega, fechaMovimiento: fecha, transaccionId: Number(inserted[0].insertId), descripcionHerramienta: tool.descripcion, nombreTrabajador: worker.nombreCompleto, condicion: condicionSalida, observacion: observacionSalida });''')
s=s.replace('''export async function returnTransaction(idTag: string, userRecibe: number, movementId?: number) {''','''export async function returnTransaction(idTag: string, userRecibe: number, movementId?: number, condicionEntrada?: string, observacionEntrada?: string) {''')
s=s.replace('''    const fechaEntrada = peruNow();
    await tx.update(transacciones).set({ userRecibe, fechaRetorno: fechaEntrada, estado: "Devuelto" }).where(eq(transacciones.id, open.id));
    await tx.insert(movimientos).values({ tipo: "Entrada", idTag: open.idTag, codigoTrabajador: open.codigoTrabajador, userId: userRecibe, fechaMovimiento: fechaEntrada, transaccionId: open.id, descripcionHerramienta: open.descripcionHerramienta, nombreTrabajador: open.nombreTrabajador, observacion: "Recepción de devolución" });''','''    const condicion = validateCondition(condicionEntrada, observacionEntrada);
    const observacion = observacionEntrada?.trim() || "Recepción de devolución";
    const fechaEntrada = peruNow();
    await tx.update(transacciones).set({ userRecibe, fechaRetorno: fechaEntrada, estado: "Devuelto", condicionEntrada: condicion, observacionEntrada: observacion }).where(eq(transacciones.id, open.id));
    await tx.insert(movimientos).values({ tipo: "Entrada", idTag: open.idTag, codigoTrabajador: open.codigoTrabajador, userId: userRecibe, fechaMovimiento: fechaEntrada, transaccionId: open.id, descripcionHerramienta: open.descripcionHerramienta, nombreTrabajador: open.nombreTrabajador, condicion, observacion });''')
p.write_text(s)

p=Path('/home/ubuntu/control-herramientas/server/routers.ts')
s=p.read_text()
s=s.replace('''const movementSchema = z.object({ toolId: z.number().int().positive(), workerId: z.number().int().positive(), storekeeperId: z.number().int().positive(), type: z.enum(["dispatch", "return", "transfer"]), note: optionalText, destination: optionalText, condition: optionalText });''','''const conditionSchema = z.enum(["Completa y operativa", "Incompleta", "Con pieza faltante", "Con pieza rota", "Dañada", "Requiere revisión", "Otro"]);
const movementSchema = z.object({ toolId: z.number().int().positive(), workerId: z.number().int().positive(), storekeeperId: z.number().int().positive(), type: z.enum(["dispatch", "return", "transfer"]), note: optionalText, destination: optionalText, condition: conditionSchema.optional() });''')
s=s.replace('''dispatch: protectedProcedure.input(z.object({ idTag: z.string(), codigoTrabajador: z.string(), userEntrega: z.number().int().positive(), })).mutation(({ input }) => dispatchTransaction(input)), return: protectedProcedure.input(z.object({ idTag: z.string(), userRecibe: z.number().int().positive(), movementId: z.number().int().positive().optional() })).mutation(({ input }) => returnTransaction(input.idTag, input.userRecibe, input.movementId))''','''dispatch: protectedProcedure.input(z.object({ idTag: z.string(), codigoTrabajador: z.string(), userEntrega: z.number().int().positive(), condicionSalida: conditionSchema.optional(), observacionSalida: optionalText })).mutation(({ input }) => dispatchTransaction(input)), return: protectedProcedure.input(z.object({ idTag: z.string(), userRecibe: z.number().int().positive(), movementId: z.number().int().positive().optional(), condicionEntrada: conditionSchema.optional(), observacionEntrada: optionalText })).mutation(({ input }) => returnTransaction(input.idTag, input.userRecibe, input.movementId, input.condicionEntrada, input.observacionEntrada))''')
p.write_text(s)
