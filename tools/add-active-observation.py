from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/drizzle/schema.ts')
s=p.read_text()
s=s.replace('''  estadoActivo: int("Estado_Activo").default(1).notNull(),
});''','''  estadoActivo: int("Estado_Activo").default(1).notNull(),
  estadoActual: varchar("Estado_Actual", { length: 50 }).default("Disponible").notNull(),
  condicionActual: varchar("Condicion_Actual", { length: 80 }).default("Completa y operativa").notNull(),
  observacionActiva: text("Observacion_Activa"),
  observacionFecha: bigint("Observacion_Fecha", { mode: "number" }),
  observacionUsuario: int("Observacion_Usuario"),
});''',1)
p.write_text(s)

p=Path('/home/ubuntu/control-herramientas/server/db.ts')
s=p.read_text()
s=s.replace('''ubicacion: tool.ubicacion, status: tool.estadoActivo ? "available" : "retired", imageUrl: null,''','''ubicacion: tool.ubicacion, status: tool.estadoActivo ? (tool.estadoActual === "Disponible con observación" ? "available_observed" : "available") : "retired", estadoActual: tool.estadoActual, condicionActual: tool.condicionActual, observacionActiva: tool.observacionActiva, observacionFecha: tool.observacionFecha, observacionUsuario: tool.observacionUsuario, imageUrl: null,''',1)
s=s.replace('''await tx.insert(movimientos).values({ tipo: "Entrada", idTag: open.idTag, codigoTrabajador: open.codigoTrabajador, userId: userRecibe, fechaMovimiento: fechaEntrada, transaccionId: open.id, descripcionHerramienta: open.descripcionHerramienta, nombreTrabajador: open.nombreTrabajador, condicion, observacion });
    return { success: true, movementId: open.id } as const;''','''await tx.insert(movimientos).values({ tipo: "Entrada", idTag: open.idTag, codigoTrabajador: open.codigoTrabajador, userId: userRecibe, fechaMovimiento: fechaEntrada, transaccionId: open.id, descripcionHerramienta: open.descripcionHerramienta, nombreTrabajador: open.nombreTrabajador, condicion, observacion });
    const hasIssue = condicion !== "Completa y operativa";
    await tx.update(catalogoHerramientas).set({ estadoActual: hasIssue ? "Disponible con observación" : "Disponible", condicionActual: condicion, observacionActiva: hasIssue ? observacion : null, observacionFecha: hasIssue ? fechaEntrada : null, observacionUsuario: hasIssue ? userRecibe : null }).where(eq(catalogoHerramientas.idTag, open.idTag));
    return { success: true, movementId: open.id, estadoActual: hasIssue ? "Disponible con observación" : "Disponible", observacionActiva: hasIssue ? observacion : null } as const;''',1)
s=s.replace('''const inserted = await tx.insert(transacciones).values({ idTag: tool.idTag, codigoTrabajador: worker.codigoTrabajador, userEntrega: input.userEntrega, fechaSalida: fecha, descripcionHerramienta: tool.descripcion, nombreTrabajador: worker.nombreCompleto, marcobreTrabajador: worker.marcobre, estado: "Prestada", condicionSalida, observacionSalida });
    await tx.insert(movimientos)''','''const inserted = await tx.insert(transacciones).values({ idTag: tool.idTag, codigoTrabajador: worker.codigoTrabajador, userEntrega: input.userEntrega, fechaSalida: fecha, descripcionHerramienta: tool.descripcion, nombreTrabajador: worker.nombreCompleto, marcobreTrabajador: worker.marcobre, estado: "Prestada", condicionSalida, observacionSalida });
    await tx.update(catalogoHerramientas).set({ estadoActual: "Prestada" }).where(eq(catalogoHerramientas.idTag, tool.idTag));
    await tx.insert(movimientos)''',1)
p.write_text(s)

p=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s=p.read_text()
s=s.replace('''type Tool = { id: number; code: string; name: string; brand?: string | null; ubicacion?: string | null; status: string; rotations: number; notes?: string | null; incidentDate?: number | null; retirementWorker?: string | null; retirementUserId?: number | null };''','''type Tool = { id: number; code: string; name: string; brand?: string | null; ubicacion?: string | null; status: string; estadoActual?: string | null; condicionActual?: string | null; observacionActiva?: string | null; observacionFecha?: number | null; observacionUsuario?: number | null; rotations: number; notes?: string | null; incidentDate?: number | null; retirementWorker?: string | null; retirementUserId?: number | null };''',1)
s=s.replace('''<span>{tool.brand ?? "Sin marca"}</span>''','''<span>{tool.brand ?? "Sin marca"}</span>{tool.observacionActiva && <small className="tool-active-observation">⚠️ {tool.observacionActiva}</small>}''')
p.write_text(s)

p=Path('/home/ubuntu/control-herramientas/client/src/index.css')
s=p.read_text()
if '.tool-active-observation' not in s:
 s += '\n.tool-active-observation{display:block;margin-top:6px;color:#b45309;font-weight:700;background:#fff7ed;padding:6px 8px;border-radius:6px;border-left:3px solid #f97316}\n'
 p.write_text(s)
