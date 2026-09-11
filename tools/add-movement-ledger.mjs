import fs from 'node:fs';
const schema='/home/ubuntu/control-herramientas/drizzle/schema.ts'; let s=fs.readFileSync(schema,'utf8');
const marker='/** Tipo de sesión interno.';
const table=`export const movimientos = mysqlTable("movimientos", {
  id: int("ID").autoincrement().primaryKey(),
  tipo: mysqlEnum("Tipo", ["Entrada", "Salida"]).notNull(),
  idTag: varchar("ID_Tag", { length: 100 }).notNull(),
  codigoTrabajador: varchar("Codigo_Trabajador", { length: 80 }),
  userId: int("User_ID").notNull(),
  cantidad: int("Cantidad").notNull(),
  fechaMovimiento: bigint("Fecha_Movimiento", { mode: "number" }).notNull(),
  transaccionId: int("Transaccion_ID"),
  descripcionHerramienta: text("Descripcion_Herramienta"),
  nombreTrabajador: varchar("Nombre_Trabajador", { length: 160 }),
  observacion: text("Observacion"),
});

`;
if(!s.includes('export const movimientos')) s=s.replace(marker,table+marker); fs.writeFileSync(schema,s);

const db='/home/ubuntu/control-herramientas/server/db.ts'; let d=fs.readFileSync(db,'utf8');
d=d.replace('catalogoHerramientas, catalogoPersonal, InsertUser, transacciones, usuarios', 'catalogoHerramientas, catalogoPersonal, InsertUser, movimientos, transacciones, usuarios');
d=d.replace('const [herramientas, personal, tx, userRows] = await Promise.all([', 'const [herramientas, personal, tx, ledger, userRows] = await Promise.all([');
d=d.replace('db.select().from(transacciones).orderBy(desc(transacciones.fechaSalida)).limit(500),\n    db.select({ id: usuarios.id', 'db.select().from(transacciones).orderBy(desc(transacciones.fechaSalida)).limit(500),\n    db.select().from(movimientos).orderBy(desc(movimientos.fechaMovimiento)).limit(1000),\n    db.select({ id: usuarios.id');
d=d.replace('return { units: [], locations: [], storekeepers, workers, tools, movements, stats:', 'return { units: [], locations: [], storekeepers, workers, tools, movements, movementLog: ledger, stats:');
d=d.replace('await tx.insert(transacciones).values({ idTag: tool.idTag, codigoTrabajador: worker.codigoTrabajador, userEntrega: input.userEntrega, fechaSalida: peruNow(), descripcionHerramienta: tool.descripcion, nombreTrabajador: worker.nombreCompleto, marcobreTrabajador: worker.marcobre, cantidadPrestada: cantidad, estado: "Prestada" });', 'const inserted = await tx.insert(transacciones).values({ idTag: tool.idTag, codigoTrabajador: worker.codigoTrabajador, userEntrega: input.userEntrega, fechaSalida: peruNow(), descripcionHerramienta: tool.descripcion, nombreTrabajador: worker.nombreCompleto, marcobreTrabajador: worker.marcobre, cantidadPrestada: cantidad, estado: "Prestada" });\n    await tx.insert(movimientos).values({ tipo: "Salida", idTag: tool.idTag, codigoTrabajador: worker.codigoTrabajador, userId: input.userEntrega, cantidad, fechaMovimiento: fecha, transaccionId: Number(inserted[0].insertId), descripcionHerramienta: tool.descripcion, nombreTrabajador: worker.nombreCompleto, observacion: "Despacho de herramienta" });');
d=d.replace('await tx.update(transacciones).set({ userRecibe, fechaRetorno: peruNow(), estado: "Devuelto" }).where(eq(transacciones.id, open.id));', 'const fechaEntrada = peruNow();\n    await tx.update(transacciones).set({ userRecibe, fechaRetorno: fechaEntrada, estado: "Devuelto" }).where(eq(transacciones.id, open.id));\n    await tx.insert(movimientos).values({ tipo: "Entrada", idTag: open.idTag, codigoTrabajador: open.codigoTrabajador, userId: userRecibe, cantidad: open.cantidadPrestada ?? 1, fechaMovimiento: fechaEntrada, transaccionId: open.id, descripcionHerramienta: open.descripcionHerramienta, nombreTrabajador: open.nombreTrabajador, observacion: "Recepción de devolución" });');
fs.writeFileSync(db,d);

const home='/home/ubuntu/control-herramientas/client/src/pages/Home.tsx'; let h=fs.readFileSync(home,'utf8');
h=h.replace('type Tab = "dispatch" | "active" | "inventory" | "retired" | "people" | "access";', 'type Tab = "dispatch" | "active" | "movements" | "inventory" | "retired" | "people" | "access";');
h=h.replace('type Snapshot = { tools: Tool[]; workers: Worker[]; storekeepers: Storekeeper[]; movements: Movement[];', 'type LedgerMovement = { id: number; tipo: "Entrada" | "Salida"; idTag: string; codigoTrabajador?: string | null; userId: number; cantidad: number; fechaMovimiento: number; transaccionId?: number | null; descripcionHerramienta?: string | null; nombreTrabajador?: string | null; observacion?: string | null };\ntype Snapshot = { tools: Tool[]; workers: Worker[]; storekeepers: Storekeeper[]; movements: Movement[]; movementLog: LedgerMovement[];');
h=h.replace('const emptySnapshot: Snapshot = { tools: [], workers: [], storekeepers: [], movements: [], stats:', 'const emptySnapshot: Snapshot = { tools: [], workers: [], storekeepers: [], movements: [], movementLog: [], stats:');
h=h.replace('[[' + '"dispatch", "Despacho rápido", ArrowUpFromLine], ["active", "Préstamos activos", AlertTriangle],', '[["dispatch", "Despacho rápido", ArrowUpFromLine], ["active", "Préstamos activos", AlertTriangle], ["movements", "Movimientos", Archive],');
const insert='<main className="pos-main">';
const ledger='<main className="pos-main">{tab === "movements" && <section><PageTitle title="Registro de movimientos" subtitle="Historial permanente: cada salida y entrada queda registrada y no se puede borrar." /><div className="pos-card table-wrap"><table><thead><tr><th>Fecha</th><th>Movimiento</th><th>Herramienta</th><th>Trabajador</th><th>Cantidad</th><th>Responsable</th></tr></thead><tbody>{snapshot.movementLog.length ? snapshot.movementLog.map((row) => <tr key={row.id} className={row.tipo === "Salida" ? "movement-out" : "movement-in"}><td>{new Date(row.fechaMovimiento).toLocaleString("es-PE", { timeZone: "America/Lima" })}</td><td><b>{row.tipo}</b><small>{row.observacion}</small></td><td><b>{row.idTag}</b><span>{row.descripcionHerramienta || "—"}</span></td><td>{row.nombreTrabajador || row.codigoTrabajador || "—"}</td><td>{row.cantidad}</td><td>{snapshot.storekeepers.find((user) => user.id === row.userId)?.fullName || `Usuario #${row.userId}`}</td></tr>) : <EmptyRow text="Todavía no hay movimientos registrados." />}</tbody></table></div></section>}';
if(!h.includes('title="Registro de movimientos"')) h=h.replace(insert,ledger);
fs.writeFileSync(home,h);
