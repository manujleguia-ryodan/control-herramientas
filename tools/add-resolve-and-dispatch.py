from pathlib import Path

p=Path('/home/ubuntu/control-herramientas/drizzle/schema.ts')
s=p.read_text()
insert='''\nexport const resolucionesObservaciones = mysqlTable("resoluciones_observaciones", {\n  id: int("ID").autoincrement().primaryKey(),\n  idTag: varchar("ID_Tag", { length: 100 }).notNull(),\n  observacionAnterior: text("Observacion_Anterior").notNull(),\n  condicionAnterior: varchar("Condicion_Anterior", { length: 80 }),\n  comentarioResolucion: text("Comentario_Resolucion").notNull(),\n  fechaResolucion: bigint("Fecha_Resolucion", { mode: "number" }).notNull(),\n  usuarioResolucion: int("Usuario_Resolucion").notNull(),\n  transaccionId: int("Transaccion_ID"),\n});\n'''
if 'export const resolucionesObservaciones' not in s:
 s=s+insert
p.write_text(s)

p=Path('/home/ubuntu/control-herramientas/server/db.ts')
s=p.read_text()
s=s.replace('''bajasHerramientas, catalogoHerramientas, catalogoPersonal, InsertUser, movimientos, transacciones, usuarios''','''bajasHerramientas, catalogoHerramientas, catalogoPersonal, InsertUser, movimientos, resolucionesObservaciones, transacciones, usuarios''',1)
old='''export async function dispatchTransaction(input: { idTag: string; codigoTrabajador: string; userEntrega: number; condicionSalida?: string; observacionSalida?: string }) {'''
new='''export async function dispatchTransaction(input: { idTag: string; codigoTrabajador: string; userEntrega: number; condicionSalida?: string; observacionSalida?: string; comentarioResolucion?: string }) {'''
s=s.replace(old,new,1)
marker='''    if (!worker) throw new TRPCError({ code: "NOT_FOUND", message: "El trabajador no existe." });\n    const condicionSalida = validateCondition(input.condicionSalida, input.observacionSalida);'''
replacement='''    if (!worker) throw new TRPCError({ code: "NOT_FOUND", message: "El trabajador no existe." });\n    const activeObservation = tool.observacionActiva?.trim();\n    if (activeObservation && !input.comentarioResolucion?.trim()) throw new TRPCError({ code: "CONFLICT", message: `Esta herramienta tiene una observación activa: ${activeObservation}. Registra cómo se resolvió antes de entregarla.` });\n    const condicionSalida = validateCondition(input.condicionSalida, input.observacionSalida);'''
if marker not in s: raise SystemExit('dispatch validation marker not found')
s=s.replace(marker,replacement,1)
old='''    await tx.update(catalogoHerramientas).set({ estadoActual: "Prestada" }).where(eq(catalogoHerramientas.idTag, tool.idTag));\n    await tx.insert(movimientos).values({ tipo: "Salida", idTag: tool.idTag, codigoTrabajador: worker.codigoTrabajador, userId: input.userEntrega, fechaMovimiento: fecha, transaccionId: Number(inserted[0].insertId), descripcionHerramienta: tool.descripcion, nombreTrabajador: worker.nombreCompleto, condicion: condicionSalida, observacion: observacionSalida });\n    return { success: true } as const;'''
new='''    await tx.update(catalogoHerramientas).set({ estadoActual: "Prestada", condicionActual: condicionSalida, observacionActiva: null, observacionFecha: null, observacionUsuario: null }).where(eq(catalogoHerramientas.idTag, tool.idTag));\n    if (activeObservation) await tx.insert(resolucionesObservaciones).values({ idTag: tool.idTag, observacionAnterior: activeObservation, condicionAnterior: tool.condicionActual, comentarioResolucion: input.comentarioResolucion!.trim(), fechaResolucion: fecha, usuarioResolucion: input.userEntrega, transaccionId: Number(inserted[0].insertId) });\n    await tx.insert(movimientos).values({ tipo: "Salida", idTag: tool.idTag, codigoTrabajador: worker.codigoTrabajador, userId: input.userEntrega, fechaMovimiento: fecha, transaccionId: Number(inserted[0].insertId), descripcionHerramienta: tool.descripcion, nombreTrabajador: worker.nombreCompleto, condicion: condicionSalida, observacion: activeObservation ? `Resolución: ${input.comentarioResolucion!.trim()} · ${observacionSalida}` : observacionSalida });\n    return { success: true, resolvedObservation: Boolean(activeObservation) } as const;'''
if old not in s: raise SystemExit('dispatch update marker not found')
s=s.replace(old,new,1)
p.write_text(s)

p=Path('/home/ubuntu/control-herramientas/server/routers.ts')
s=p.read_text()
s=s.replace('''userEntrega: z.number().int().positive(), condicionSalida: conditionSchema.optional(), observacionSalida: optionalText''','''userEntrega: z.number().int().positive(), condicionSalida: conditionSchema.optional(), observacionSalida: optionalText, comentarioResolucion: optionalText''',1)
p.write_text(s)

p=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s=p.read_text()
s=s.replace('''const [dispatchCondition, setDispatchCondition] = useState("Completa y operativa"); const [dispatchObservation, setDispatchObservation] = useState("");''','''const [dispatchCondition, setDispatchCondition] = useState("Completa y operativa"); const [dispatchObservation, setDispatchObservation] = useState(""); const [resolutionComment, setResolutionComment] = useState("");''',1)
s=s.replace('''if (conditionNeedsObservation(dispatchCondition) && !dispatchObservation.trim()) return notify("Registra una observación para la condición seleccionada.");''','''if (conditionNeedsObservation(dispatchCondition) && !dispatchObservation.trim()) return notify("Registra una observación para la condición seleccionada."); if (selectedTool.observacionActiva && !resolutionComment.trim()) return notify("Describe cómo se resolvió la observación antes de entregar.");''',1)
s=s.replace('''observacionSalida: dispatchObservation.trim() || undefined });''','''observacionSalida: dispatchObservation.trim() || undefined, comentarioResolucion: resolutionComment.trim() || undefined });''',1)
s=s.replace('''setDispatchCondition("Completa y operativa"); setDispatchObservation(""); notify("Despacho registrado correctamente")''','''setDispatchCondition("Completa y operativa"); setDispatchObservation(""); setResolutionComment(""); notify(selectedTool.observacionActiva ? "Observación resuelta y despacho registrado correctamente" : "Despacho registrado correctamente")''',1)
# Add resolution field after the observation warning and before the unavailable warning.
needle='''</div></div>}{selectedToolUnavailable && <div className="dispatch-unavailable">'''
replacement='''</div></div>}{selectedTool?.observacionActiva && <div className="resolve-observation-box"><strong>Resolver observación antes de entregar</strong><span>Observación activa: {selectedTool.observacionActiva}</span><textarea rows={2} required placeholder="Ej.: Se encontró y repuso el dado de 24 mm." value={resolutionComment} onChange={(e)=>setResolutionComment(e.target.value)} /></div>}{selectedToolUnavailable && <div className="dispatch-unavailable">'''
if needle not in s: raise SystemExit('dispatch warning insertion marker not found')
s=s.replace(needle,replacement,1)
# Change button label when resolving.
s=s.replace('''>{dispatchMutation.isPending ? "Registrando…" : "Confirmar despacho"}</button>''','''>{dispatchMutation.isPending ? "Registrando…" : (selectedTool?.observacionActiva ? "Resolver observación y entregar" : "Confirmar despacho")}</button>''',1)
p.write_text(s)

p=Path('/home/ubuntu/control-herramientas/client/src/index.css')
s=p.read_text()+'''\n.resolve-observation-box{margin:14px 0;padding:13px;background:#ecfdf5;border:1px solid #34d399;border-radius:9px;color:#065f46}.resolve-observation-box strong,.resolve-observation-box span{display:block}.resolve-observation-box strong{font-size:15px}.resolve-observation-box span{margin:5px 0 9px;font-size:13px}.resolve-observation-box textarea{width:100%;background:#fff;border:1px solid #86efac;border-radius:6px;padding:9px 11px;min-height:58px}\n'''
p.write_text(s)
