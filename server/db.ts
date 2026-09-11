import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { TRPCError } from "@trpc/server";
import { catalogoHerramientas, catalogoPersonal, InsertUser, movimientos, transacciones, usuarios } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { hashPin } from "./pinAuth";

let _db: ReturnType<typeof drizzle> | null = null;
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

/** Compatibilidad interna: el acceso nuevo no usa correo ni OAuth. */
export async function upsertUser(user: InsertUser): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(usuarios).values(user).onDuplicateKeyUpdate({ set: { nombre: user.nombre, pinHash: user.pinHash, rol: user.rol ?? "Almacen", estado: user.estado ?? 1 } });
}
export async function getUserByOpenId(openId: string) {
  const id = Number(openId);
  if (!Number.isInteger(id)) return undefined;
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1))[0];
}

export async function getUsers() {
  const db = await getDb();
  return db ? db.select({ id: usuarios.id, nombre: usuarios.nombre, rol: usuarios.rol, estado: usuarios.estado }).from(usuarios).orderBy(usuarios.nombre) : [];
}
export async function getUserCount() {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql<number>`count(*)` }).from(usuarios);
  return Number(rows[0]?.count ?? 0);
}
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1))[0];
}
export async function createUser(input: { nombre: string; pin: string; rol?: "Admin" | "Almacen" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(usuarios).values({ nombre: input.nombre.trim(), pinHash: hashPin(input.pin), rol: input.rol ?? "Almacen", estado: 1 });
  return { success: true, id: Number(result[0].insertId) } as const;
}
export async function deactivateUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(usuarios).set({ estado: 0 }).where(eq(usuarios.id, id));
  return { success: true } as const;
}

export async function getCatalogSnapshot() {
  const db = await getDb();
  if (!db) return { units: [], locations: [], storekeepers: [], workers: [], tools: [], movements: [], stats: emptyStats() };
  const [herramientas, personal, tx, ledger, userRows] = await Promise.all([
    db.select().from(catalogoHerramientas).orderBy(catalogoHerramientas.descripcion),
    db.select().from(catalogoPersonal).orderBy(catalogoPersonal.nombreCompleto),
    db.select().from(transacciones).orderBy(desc(transacciones.fechaSalida)).limit(500),
    db.select().from(movimientos).orderBy(desc(movimientos.fechaMovimiento)).limit(1000),
    db.select({ id: usuarios.id, nombre: usuarios.nombre, rol: usuarios.rol, estado: usuarios.estado }).from(usuarios).orderBy(usuarios.nombre),
  ]);
  const tools = herramientas.map((tool, index) => ({ id: index + 1, code: tool.idTag, name: tool.descripcion, brand: tool.marca, ubicacion: tool.ubicacion, quantity: tool.stock, availableQuantity: tool.stock, status: tool.estadoActivo ? (tool.stock > 0 ? "available" : "out_of_stock") : "retired", imageUrl: null, locationId: null, rotations: tx.filter((row) => row.idTag === tool.idTag).length, holder: null, holderCode: null, loanStorekeeper: null, daysOut: 0, notes: tool.motivoBaja }));
  const workers = personal.map((row, index) => ({ id: index + 1, code: row.codigoTrabajador, fullName: row.nombreCompleto, marcobre: row.marcobre, area: row.tipo, unitId: null }));
  const movements = tx.map((row) => ({ id: row.id, toolId: tools.find((tool) => tool.code === row.idTag)?.id ?? 0, workerId: workers.find((worker) => worker.code === row.codigoTrabajador)?.id ?? 0, storekeeperId: row.userEntrega, type: "dispatch" as const, quantity: row.cantidadPrestada ?? 1, occurredAt: row.fechaSalida, returnedAt: row.fechaRetorno, receiverId: row.userRecibe, note: row.fechaRetorno ? `Retornada el ${new Date(row.fechaRetorno).toLocaleString("es-PE", { timeZone: "America/Lima" })}` : null }));
  const storekeepers = userRows.map((row) => ({ id: row.id, code: `USR-${row.id}`, fullName: row.nombre, employeeId: null, phone: null }));
  return { units: [], locations: [], storekeepers, workers, tools, movements, movementLog: ledger, stats: { ...emptyStats(), totalStock: tools.reduce((sum, tool) => sum + tool.quantity, 0), totalAvailable: tools.reduce((sum, tool) => sum + tool.availableQuantity, 0), totalTools: tools.length, totalMovements: movements.length } };
}
export function emptyStats() { return { totalStock: 0, totalAvailable: 0, borrowed: 0, overdue: 0, totalTools: 0, totalMovements: 0 }; }
export async function getCounts() { const snapshot = await getCatalogSnapshot(); return snapshot.stats; }
export async function searchTools(query = "") {
  const db = await getDb();
  if (!db) return [];
  const normalized = query.trim();
  if (!normalized) return [];
  const pattern = `%${normalized}%`;
  return db.select().from(catalogoHerramientas).where(sql`(${catalogoHerramientas.idTag} LIKE ${pattern} OR ${catalogoHerramientas.descripcion} LIKE ${pattern}) AND ${catalogoHerramientas.estadoActivo} = 1`).orderBy(catalogoHerramientas.descripcion).limit(25);
}

// Compatibilidad de formularios heredados: estos catálogos ya no crean unidades/ubicaciones.
export async function createMiningUnit(_input: { code: string; name: string; marcobre?: string; site?: string }) { return { success: true } as const; }
export async function createLocation(_input: { code: string; name: string; zone?: string; description?: string; unitId?: number; photoUrl?: string; photoKey?: string }) { return { success: true } as const; }
export async function createStorekeeper(input: { code: string; fullName: string; employeeId?: string; phone?: string; password?: string }) { return createUser({ nombre: input.fullName, pin: input.password ?? "0000" }); }
export async function createWorker(input: { code: string; fullName: string; area?: string; marcobre?: string; unitId?: number }) { return createPersonal({ codigoTrabajador: input.code, nombreCompleto: input.fullName, marcobre: input.marcobre, tipo: input.area ?? "Almacen" }); }
export async function createTool(input: { code: string; name: string; brand?: string; notes?: string }) { return createToolRecord({ idTag: input.code, descripcion: input.name, marca: input.brand, motivoBaja: input.notes }); }

export async function createToolRecord(input: { idTag: string; descripcion: string; marca?: string; ubicacion?: string; estadoActivo?: number; motivoBaja?: string; stock?: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(catalogoHerramientas).values({ idTag: input.idTag.trim(), descripcion: input.descripcion.trim(), marca: input.marca, ubicacion: input.ubicacion, estadoActivo: input.estadoActivo ?? 1, motivoBaja: input.motivoBaja, stock: input.stock ?? 1 });
  return { success: true } as const;
}
export async function deleteToolSafely(idTag: string) {
  const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const active = await db.select({ id: transacciones.id }).from(transacciones).where(and(eq(transacciones.idTag, idTag), isNull(transacciones.fechaRetorno))).limit(1);
  if (active.length) throw new TRPCError({ code: "CONFLICT", message: "No se puede eliminar: la herramienta tiene préstamos activos." });
  await db.delete(catalogoHerramientas).where(eq(catalogoHerramientas.idTag, idTag));
  return { success: true } as const;
}
export async function deactivateTool(idTag: string, motivoBaja: string) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(catalogoHerramientas).set({ estadoActivo: 0, motivoBaja: motivoBaja.trim() }).where(eq(catalogoHerramientas.idTag, idTag));
  return { success: true } as const;
}
export async function createPersonal(input: { codigoTrabajador: string; nombreCompleto: string; marcobre?: string; tipo: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(catalogoPersonal).values({ codigoTrabajador: input.codigoTrabajador.trim(), nombreCompleto: input.nombreCompleto.trim(), marcobre: input.marcobre, tipo: input.tipo.trim() });
  return { success: true } as const;
}
export async function deactivatePersonal(codigoTrabajador: string) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.delete(catalogoPersonal).where(eq(catalogoPersonal.codigoTrabajador, codigoTrabajador));
  return { success: true } as const;
}

export async function recordMovement(input: { toolId: number; workerId: number; storekeeperId: number; type: "dispatch" | "return" | "transfer"; quantity: number; note?: string; destination?: string; condition?: string }) {
  const snapshot = await getCatalogSnapshot();
  const tool = snapshot.tools.find((row) => row.id === input.toolId);
  const worker = snapshot.workers.find((row) => row.id === input.workerId);
  if (!tool || !worker) throw new Error("Tool or worker not found");
  if (input.type === "return") return returnTransaction(tool.code, input.storekeeperId);
  return dispatchTransaction({ idTag: tool.code, codigoTrabajador: worker.code, userEntrega: input.storekeeperId });
}
// Unix timestamps are timezone-independent; the UI formats them with America/Lima (UTC-5).
function peruNow() { return Date.now(); }
export async function dispatchTransaction(input: { idTag: string; codigoTrabajador: string; userEntrega: number; cantidad?: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const cantidad = input.cantidad ?? 1;
  if (!Number.isInteger(cantidad) || cantidad < 1) throw new TRPCError({ code: "BAD_REQUEST", message: "La cantidad debe ser un entero mayor que cero." });
  return db.transaction(async (tx) => {
    const tool = (await tx.select().from(catalogoHerramientas).where(eq(catalogoHerramientas.idTag, input.idTag)).limit(1))[0];
    const worker = (await tx.select().from(catalogoPersonal).where(eq(catalogoPersonal.codigoTrabajador, input.codigoTrabajador)).limit(1))[0];
    if (!tool || !tool.estadoActivo) throw new TRPCError({ code: "NOT_FOUND", message: "Herramienta no encontrada o fuera de servicio." });
    if (cantidad > tool.stock) throw new TRPCError({ code: "BAD_REQUEST", message: `Stock insuficiente. Disponible: ${tool.stock}.` });
    if (!worker) throw new TRPCError({ code: "NOT_FOUND", message: "El trabajador no existe." });
    await tx.update(catalogoHerramientas).set({ stock: tool.stock - cantidad }).where(eq(catalogoHerramientas.idTag, input.idTag));
    const fecha = peruNow();
    const inserted = await tx.insert(transacciones).values({ idTag: tool.idTag, codigoTrabajador: worker.codigoTrabajador, userEntrega: input.userEntrega, fechaSalida: fecha, descripcionHerramienta: tool.descripcion, nombreTrabajador: worker.nombreCompleto, marcobreTrabajador: worker.marcobre, cantidadPrestada: cantidad, estado: "Prestada" });
    await tx.insert(movimientos).values({ tipo: "Salida", idTag: tool.idTag, codigoTrabajador: worker.codigoTrabajador, userId: input.userEntrega, cantidad, fechaMovimiento: fecha, transaccionId: Number(inserted[0].insertId), descripcionHerramienta: tool.descripcion, nombreTrabajador: worker.nombreCompleto, observacion: "Despacho de herramienta" });
    return { success: true } as const;
  });
}
export async function returnTransaction(idTag: string, userRecibe: number, movementId?: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.transaction(async (tx) => {
    const conditions = movementId ? eq(transacciones.id, movementId) : and(eq(transacciones.idTag, idTag), isNull(transacciones.fechaRetorno));
    const open = (await tx.select().from(transacciones).where(conditions).orderBy(desc(transacciones.fechaSalida)).limit(1))[0];
    if (!open || open.fechaRetorno) throw new TRPCError({ code: "NOT_FOUND", message: "No existe un préstamo activo seleccionado." });
    const tool = (await tx.select().from(catalogoHerramientas).where(eq(catalogoHerramientas.idTag, open.idTag)).limit(1))[0];
    if (!tool) throw new TRPCError({ code: "NOT_FOUND", message: "La herramienta ya no existe." });
    const fechaEntrada = peruNow();
    await tx.update(transacciones).set({ userRecibe, fechaRetorno: fechaEntrada, estado: "Devuelto" }).where(eq(transacciones.id, open.id));
    await tx.insert(movimientos).values({ tipo: "Entrada", idTag: open.idTag, codigoTrabajador: open.codigoTrabajador, userId: userRecibe, cantidad: open.cantidadPrestada ?? 1, fechaMovimiento: fechaEntrada, transaccionId: open.id, descripcionHerramienta: open.descripcionHerramienta, nombreTrabajador: open.nombreTrabajador, observacion: "Recepción de devolución" });
    await tx.update(catalogoHerramientas).set({ stock: tool.stock + (open.cantidadPrestada ?? 1), estadoActivo: 1 }).where(eq(catalogoHerramientas.idTag, open.idTag));
    return { success: true, movementId: open.id } as const;
  });
}


export type CsvImportResult = { herramientas: number; personal: number };
function parseCsv(text: string, expected: string[]) {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false;
  for (let i = 0; i < text.length; i++) { const char = text[i]; const next = text[i + 1]; if (char === '"' && quoted && next === '"') { cell += '"'; i++; } else if (char === '"') quoted = !quoted; else if (char === "," && !quoted) { row.push(cell); cell = ""; } else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && next === "\n") i++; row.push(cell); if (row.some((value) => value.trim() !== "")) rows.push(row.map((value) => value.trim())); row = []; cell = ""; } else cell += char; }
  if (cell || row.length) { row.push(cell); rows.push(row.map((value) => value.trim())); }
  if (!rows.length || rows[0].join(",") !== expected.join(",")) throw new TRPCError({ code: "BAD_REQUEST", message: `Encabezados inválidos. Se esperaba: ${expected.join(",")}` });
  return rows.slice(1).map((values) => Object.fromEntries(expected.map((key, index) => [key, values[index] ?? ""])));
}
export async function importCsvCatalog(input: { herramientasCsv: string; personalCsv: string }): Promise<CsvImportResult> {
  const herramientas = parseCsv(input.herramientasCsv, ["ID_Tag", "Descripcion", "Marca", "Estado_Activo", "Ubicacion"]);
  const personal = parseCsv(input.personalCsv, ["Codigo_Trabajador", "Nombre_Completo", "Marcobre", "Tipo"]);
  const ids = new Set<string>(); for (const row of herramientas) { if (!row.ID_Tag || ids.has(row.ID_Tag)) throw new Error(`ID_Tag duplicado o vacío: ${row.ID_Tag}`); ids.add(row.ID_Tag); }
  const codes = new Set<string>(); for (const row of personal) { if (!row.Codigo_Trabajador || codes.has(row.Codigo_Trabajador)) throw new Error(`Codigo_Trabajador duplicado o vacío: ${row.Codigo_Trabajador}`); codes.add(row.Codigo_Trabajador); }
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const [existingTools, existingPeople] = await Promise.all([db.select({ idTag: catalogoHerramientas.idTag }).from(catalogoHerramientas), db.select({ codigoTrabajador: catalogoPersonal.codigoTrabajador }).from(catalogoPersonal)]);
  for (const row of herramientas) if (existingTools.some((item) => item.idTag === row.ID_Tag)) throw new Error(`ID_Tag ya existe: ${row.ID_Tag}`);
  for (const row of personal) if (existingPeople.some((item) => item.codigoTrabajador === row.Codigo_Trabajador)) throw new Error(`Codigo_Trabajador ya existe: ${row.Codigo_Trabajador}`);
  await db.transaction(async (tx) => {
    if (herramientas.length) await tx.insert(catalogoHerramientas).values(herramientas.map((row) => ({ idTag: row.ID_Tag, descripcion: row.Descripcion, marca: row.Marca || undefined, ubicacion: row.Ubicacion || undefined, estadoActivo: row.Estado_Activo === "0" ? 0 : 1 })));
    if (personal.length) await tx.insert(catalogoPersonal).values(personal.map((row) => ({ codigoTrabajador: row.Codigo_Trabajador, nombreCompleto: row.Nombre_Completo, marcobre: row.Marcobre || undefined, tipo: row.Tipo })));
  });
  return { herramientas: herramientas.length, personal: personal.length };
}

export async function importToolsCsv(text: string) {
  const herramientas = parseCsv(text, ["ID_Tag", "Descripcion", "Marca", "Estado_Activo", "Ubicacion", "Cantidad"]);
  const ids = new Set<string>();
  for (const row of herramientas) { row.ID_Tag = row.ID_Tag.trim(); if (!row.ID_Tag) continue; if (!row.Descripcion.trim()) throw new TRPCError({ code: "BAD_REQUEST", message: "Cada herramienta debe incluir Descripcion." }); if (ids.has(row.ID_Tag)) throw new TRPCError({ code: "CONFLICT", message: `ID_Tag duplicado dentro del archivo: ${row.ID_Tag}` }); ids.add(row.ID_Tag); }
  const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La base de datos no está disponible." });
  for (const row of herramientas) { if (!row.ID_Tag) continue; const cantidad = Number(row.Cantidad || "1"); if (!Number.isInteger(cantidad) || cantidad < 1) throw new TRPCError({ code: "BAD_REQUEST", message: `Cantidad inválida para ${row.ID_Tag}.` }); const existing = (await db.select().from(catalogoHerramientas).where(eq(catalogoHerramientas.idTag, row.ID_Tag)).limit(1))[0]; if (existing) await db.update(catalogoHerramientas).set({ descripcion: row.Descripcion.trim(), marca: row.Marca.trim() || undefined, ubicacion: row.Ubicacion.trim() || undefined }).where(eq(catalogoHerramientas.idTag, row.ID_Tag)); else await db.insert(catalogoHerramientas).values({ idTag: row.ID_Tag, descripcion: row.Descripcion.trim(), marca: row.Marca.trim() || undefined, ubicacion: row.Ubicacion.trim() || undefined, estadoActivo: row.Estado_Activo.trim() === "0" ? 0 : 1, stock: cantidad }); }
  return { herramientas: herramientas.filter((row) => row.ID_Tag).length } as const;
}

export async function importPersonalCsv(text: string) {
  const personal = parseCsv(text, ["Codigo_Trabajador", "Nombre_Completo", "Marcobre", "Tipo"]);
  const codes = new Set<string>();
  for (const row of personal) {
    if (!row.Codigo_Trabajador || !row.Nombre_Completo || !row.Tipo) throw new TRPCError({ code: "BAD_REQUEST", message: "Cada persona debe incluir Codigo_Trabajador, Nombre_Completo y Tipo." });
    if (codes.has(row.Codigo_Trabajador)) throw new TRPCError({ code: "CONFLICT", message: `Código duplicado dentro del archivo: ${row.Codigo_Trabajador}` });
    codes.add(row.Codigo_Trabajador);
  }
  const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La base de datos no está disponible." });
  const existing = await db.select({ codigoTrabajador: catalogoPersonal.codigoTrabajador }).from(catalogoPersonal);
  for (const row of personal) if (existing.some((item) => item.codigoTrabajador === row.Codigo_Trabajador)) throw new TRPCError({ code: "CONFLICT", message: `Código ya existe: ${row.Codigo_Trabajador}` });
  if (personal.length) await db.insert(catalogoPersonal).values(personal.map((row) => ({ codigoTrabajador: row.Codigo_Trabajador, nombreCompleto: row.Nombre_Completo, marcobre: row.Marcobre || undefined, tipo: row.Tipo })));
  return { personal: personal.length } as const;
}
