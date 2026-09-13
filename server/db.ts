import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { TRPCError } from "@trpc/server";
import { bajasHerramientas, catalogoHerramientas, catalogoPersonal, InsertUser, movimientos, transacciones, usuarios } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { hashPin } from "./pinAuth";
import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

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
export async function deleteUserSafely(id: number, actingUserId: number) {
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
export async function deactivateUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(usuarios).set({ estado: 0 }).where(eq(usuarios.id, id));
  return { success: true } as const;
}

export async function getCatalogSnapshot() {
  const db = await getDb();
  if (!db) return { units: [], locations: [], storekeepers: [], workers: [], tools: [], movements: [], stats: emptyStats() };
  const [herramientas, personal, tx, ledger, userRows, bajas] = await Promise.all([
    db.select().from(catalogoHerramientas).orderBy(catalogoHerramientas.descripcion),
    db.select().from(catalogoPersonal).orderBy(catalogoPersonal.nombreCompleto),
    db.select().from(transacciones).orderBy(desc(transacciones.fechaSalida)).limit(500),
    db.select().from(movimientos).orderBy(desc(movimientos.fechaMovimiento)).limit(1000),
    db.select({ id: usuarios.id, nombre: usuarios.nombre, rol: usuarios.rol, estado: usuarios.estado }).from(usuarios).orderBy(usuarios.nombre),
    db.select().from(bajasHerramientas).orderBy(desc(bajasHerramientas.fechaIncidente)),
  ]);
  const tools = herramientas.map((tool, index) => ({ id: index + 1, code: tool.idTag, name: tool.descripcion, brand: tool.marca, ubicacion: tool.ubicacion, status: tool.estadoActivo ? "available" : "retired", imageUrl: null, locationId: null, rotations: tx.filter((row) => row.idTag === tool.idTag).length, holder: null, holderCode: null, loanStorekeeper: null, daysOut: 0, notes: bajas.find((item) => item.idTag === tool.idTag)?.motivo ?? null, incidentDate: bajas.find((item) => item.idTag === tool.idTag)?.fechaIncidente ?? null, retirementWorker: bajas.find((item) => item.idTag === tool.idTag)?.trabajadorResponsable ?? null, reportPdfName: bajas.find((item) => item.idTag === tool.idTag)?.pdfNombre ?? null }));
  const workers = personal.map((row, index) => ({ id: index + 1, code: row.codigoTrabajador, fullName: row.nombreCompleto, marcobre: row.marcobre, area: row.tipo, unitId: null }));
  const movements = tx.map((row) => ({ id: row.id, toolId: tools.find((tool) => tool.code === row.idTag)?.id ?? 0, workerId: workers.find((worker) => worker.code === row.codigoTrabajador)?.id ?? 0, storekeeperId: row.userEntrega, type: "dispatch" as const, occurredAt: row.fechaSalida, returnedAt: row.fechaRetorno, receiverId: row.userRecibe, note: row.fechaRetorno ? `Retornada el ${new Date(row.fechaRetorno).toLocaleString("es-PE", { timeZone: "America/Lima" })}` : null }));
  const storekeepers = userRows.map((row) => ({ id: row.id, code: `USR-${row.id}`, fullName: row.nombre, employeeId: null, phone: null }));
  return { units: [], locations: [], storekeepers, workers, tools, movements, movementLog: ledger, stats: { ...emptyStats(), totalTools: tools.length, totalMovements: movements.length } };
}
export function emptyStats() { return { borrowed: 0, overdue: 0, totalTools: 0, totalMovements: 0 }; }
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

export async function createToolRecord(input: { idTag: string; descripcion: string; marca?: string; ubicacion?: string; estadoActivo?: number; motivoBaja?: string;  }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(catalogoHerramientas).values({ idTag: input.idTag.trim(), descripcion: input.descripcion.trim(), marca: input.marca, ubicacion: input.ubicacion, estadoActivo: input.estadoActivo ?? 1 });
  return { success: true } as const;
}
export async function deleteToolSafely(idTag: string) {
  const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const active = await db.select({ id: transacciones.id }).from(transacciones).where(and(eq(transacciones.idTag, idTag), isNull(transacciones.fechaRetorno))).limit(1);
  if (active.length) throw new TRPCError({ code: "CONFLICT", message: "No se puede eliminar: la herramienta tiene préstamos activos." });
  await db.delete(catalogoHerramientas).where(eq(catalogoHerramientas.idTag, idTag));
  return { success: true } as const;
}
export async function deactivateTool(idTag: string, motivoBaja: string, fechaIncidente: number, trabajadorResponsable: string, usuarioBaja: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(catalogoHerramientas).set({ estadoActivo: 0 }).where(eq(catalogoHerramientas.idTag, idTag));
  await db.insert(bajasHerramientas).values({ idTag, motivo: motivoBaja.trim(), fechaIncidente, trabajadorResponsable: trabajadorResponsable.trim(), usuarioBaja });
  return { success: true } as const;
}
export type RetirementReportInput = { idTag: string; motivo: string; fechaIncidente: number; supervisorCodigo: string; usuarioBaja: number; photos: Array<{ buffer: Buffer; originalname: string; mimetype: string }> };

function safeFilePart(value: string) { return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80); }

export async function createRetirementReport(input: RetirementReportInput, persist = true) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const tool = (await db.select().from(catalogoHerramientas).where(eq(catalogoHerramientas.idTag, input.idTag)).limit(1))[0];
  const supervisor = (await db.select().from(catalogoPersonal).where(eq(catalogoPersonal.codigoTrabajador, input.supervisorCodigo)).limit(1))[0];
  const user = (await db.select().from(usuarios).where(eq(usuarios.id, input.usuarioBaja)).limit(1))[0];
  if (!tool) throw new TRPCError({ code: "NOT_FOUND", message: "La herramienta no existe." });
  if (!supervisor) throw new TRPCError({ code: "BAD_REQUEST", message: "Selecciona un supervisor válido." });
  if (!input.motivo.trim()) throw new TRPCError({ code: "BAD_REQUEST", message: "El motivo es obligatorio." });
  const now = input.fechaIncidente || Date.now();
  const baseDir = path.join(process.cwd(), "storage", "bajas", safeFilePart(input.idTag));
  await fs.mkdir(baseDir, { recursive: true });
  const photoPaths: string[] = [];
  for (let i = 0; i < Math.min(input.photos.length, 5); i++) {
    const photo = input.photos[i];
    const ext = path.extname(photo.originalname).toLowerCase() || ".jpg";
    const target = path.join(baseDir, `${i + 1}${ext}`);
    await fs.writeFile(target, photo.buffer);
    photoPaths.push(target);
  }
  const datePart = new Date(now).toISOString().slice(0, 10).replace(/-/g, "");
  const pdfNombre = `Reporte_FS_${safeFilePart(input.idTag)}_${datePart}.pdf`;
  const pdfPath = path.join(baseDir, pdfNombre);
  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const out = createWriteStream(pdfPath);
    doc.pipe(out);
    doc.fontSize(16).font("Helvetica-Bold").text("REPORTE DE HERRAMIENTA FUERA DE SERVICIO", { align: "center" });
    doc.moveDown(1.5).fontSize(10).font("Helvetica");
    const lines = [
      ["Herramienta", tool.descripcion], ["Código", tool.idTag],
      ["Fecha/Hora", new Date(now).toLocaleString("es-PE", { timeZone: "America/Lima" })],
      ["Almacenero Responsable", user?.nombre ?? `Usuario #${input.usuarioBaja}`],
      ["Supervisor Responsable", `${supervisor.nombreCompleto} (${supervisor.codigoTrabajador})`],
      ["Descripción del Evento", input.motivo.trim()],
    ];
    for (const [label, value] of lines) { doc.font("Helvetica-Bold").text(`${label}:`, { continued: true }); doc.font("Helvetica").text(` ${value}`); doc.moveDown(.45); }
    if (photoPaths.length) {
      doc.moveDown(.8).font("Helvetica-Bold").text("Evidencias fotográficas").moveDown(.5);
      let x = 48; let y = doc.y;
      for (const photoPath of photoPaths) {
        try { doc.image(photoPath, x, y, { fit: [235, 155], align: "center", valign: "center" }); } catch {}
        x += 250;
        if (x > 300) { x = 48; y += 175; if (y > 650) { doc.addPage(); y = 48; } }
      }
    }
    doc.end(); out.on("finish", () => resolve()); out.on("error", reject);
  });
  if (persist) {
    await db.transaction(async (tx) => {
      await tx.update(catalogoHerramientas).set({ estadoActivo: 0 }).where(eq(catalogoHerramientas.idTag, input.idTag));
      await tx.insert(bajasHerramientas).values({ idTag: input.idTag, motivo: input.motivo.trim(), fechaIncidente: now, trabajadorResponsable: supervisor.nombreCompleto, usuarioBaja: input.usuarioBaja, supervisorCodigo: supervisor.codigoTrabajador, pdfNombre });
    });
  }
  return { pdfPath, pdfNombre, tool: input.idTag };
}

async function getLatestRetirement(idTag: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const tool = (await db.select().from(catalogoHerramientas).where(eq(catalogoHerramientas.idTag, idTag)).limit(1))[0];
  const retirement = (await db.select().from(bajasHerramientas).where(eq(bajasHerramientas.idTag, idTag)).orderBy(desc(bajasHerramientas.fechaIncidente)).limit(1))[0];
  if (!tool || !retirement) throw new TRPCError({ code: "NOT_FOUND", message: "No existe un reporte de baja para esta herramienta." });
  const supervisor = (retirement.supervisorCodigo ? (await db.select().from(catalogoPersonal).where(eq(catalogoPersonal.codigoTrabajador, retirement.supervisorCodigo)).limit(1))[0] : undefined) ?? { nombreCompleto: retirement.trabajadorResponsable, codigoTrabajador: "-" };
  const user = (await db.select().from(usuarios).where(eq(usuarios.id, retirement.usuarioBaja)).limit(1))[0];
  return { db, tool, retirement, supervisor, user };
}

export async function createRetirementXlsx(idTag: string) {
  const { tool, retirement, supervisor, user } = await getLatestRetirement(idTag);
  const template = path.join(process.cwd(), "server", "templates", "formato-herramienta-danada.xlsx");
  const baseDir = path.join(process.cwd(), "storage", "bajas", safeFilePart(idTag));
  await fs.mkdir(baseDir, { recursive: true });
  const date = new Date(retirement.fechaIncidente);
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, "");
  const xlsxNombre = `Reporte_FS_${safeFilePart(idTag)}_${datePart}.xlsx`;
  const xlsxPath = path.join(baseDir, xlsxNombre);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(template);
  const ws = workbook.worksheets[0];
  const dateText = date.toLocaleString("es-PE", { timeZone: "America/Lima" });
  const put = (cell: string, value: string) => { ws.getCell(cell).value = value; };
  put("C4", `FECHA DE ELABORACIÓN : ${dateText}`);
  put("C5", `${supervisor.nombreCompleto} (${supervisor.codigoTrabajador})`);
  put("C6", user?.nombre ?? `Usuario #${retirement.usuarioBaja}`);
  put("C7", "HERRAMIENTA DAÑADA / INOPERATIVA");
  put("C8", dateText);
  put("C10", tool.descripcion);
  put("C11", tool.marca ?? "");
  put("C12", "");
  put("C13", "");
  put("C14", tool.idTag);
  put("C15", `Ubicación: ${tool.ubicacion ?? "No registrada"}`);
  put("A16", "2.DESCRIPCIÓN DEL EVENTO Y EVIDENCIAS FOTOGRÁFICAS :");
  put("A17", retirement.motivo);

  const photoNames = (await fs.readdir(baseDir)).filter((name) => /\.(jpe?g|png)$/i.test(name)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).slice(0, 5);
  if (photoNames.length) {
    put("E16", "EVIDENCIAS");
    for (let index = 0; index < photoNames.length; index++) {
      const photoName = photoNames[index];
      const photoPath = path.join(baseDir, photoName);
      const extension = /\.png$/i.test(photoName) ? "png" : "jpeg";
      const imageId = workbook.addImage({ filename: photoPath, extension });
      const col = index % 2 === 0 ? 4 : 6;
      const row = 16 + Math.floor(index / 2) * 8;
      ws.addImage(imageId, { tl: { col, row }, ext: { width: 210, height: 132 } });
    }
  }
  await workbook.xlsx.writeFile(xlsxPath);
  return { xlsxPath, xlsxNombre, tool: idTag };
}

export async function regenerateRetirementReport(idTag: string, format: "pdf" | "xlsx") {
  const { retirement, supervisor, user } = await getLatestRetirement(idTag);
  if (format === "xlsx") return createRetirementXlsx(idTag);
  return createRetirementReport({ idTag, motivo: retirement.motivo, fechaIncidente: retirement.fechaIncidente, supervisorCodigo: supervisor.codigoTrabajador, usuarioBaja: retirement.usuarioBaja, photos: [] }, false);
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

export async function recordMovement(input: { toolId: number; workerId: number; storekeeperId: number; type: "dispatch" | "return" | "transfer"; note?: string; destination?: string; condition?: string }) {
  const snapshot = await getCatalogSnapshot();
  const tool = snapshot.tools.find((row) => row.id === input.toolId);
  const worker = snapshot.workers.find((row) => row.id === input.workerId);
  if (!tool || !worker) throw new Error("Tool or worker not found");
  if (input.type === "return") return returnTransaction(tool.code, input.storekeeperId);
  return dispatchTransaction({ idTag: tool.code, codigoTrabajador: worker.code, userEntrega: input.storekeeperId });
}
// Unix timestamps are timezone-independent; the UI formats them with America/Lima (UTC-5).
function peruNow() { return Date.now(); }
export async function dispatchTransaction(input: { idTag: string; codigoTrabajador: string; userEntrega: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.transaction(async (tx) => {
    const tool = (await tx.select().from(catalogoHerramientas).where(eq(catalogoHerramientas.idTag, input.idTag)).limit(1))[0];
    const worker = (await tx.select().from(catalogoPersonal).where(eq(catalogoPersonal.codigoTrabajador, input.codigoTrabajador)).limit(1))[0];
    if (!tool || !tool.estadoActivo) throw new TRPCError({ code: "NOT_FOUND", message: "Herramienta no encontrada o fuera de servicio." });
    const activeLoan = (await tx.select({ codigoTrabajador: transacciones.codigoTrabajador, nombreTrabajador: transacciones.nombreTrabajador }).from(transacciones).where(and(eq(transacciones.idTag, input.idTag), isNull(transacciones.fechaRetorno))).limit(1))[0];
    if (activeLoan) throw new TRPCError({ code: "CONFLICT", message: `Error: Esta herramienta no está disponible. Actualmente está prestada a ${activeLoan.nombreTrabajador || activeLoan.codigoTrabajador}` });
    if (!worker) throw new TRPCError({ code: "NOT_FOUND", message: "El trabajador no existe." });
    const fecha = peruNow();
    const inserted = await tx.insert(transacciones).values({ idTag: tool.idTag, codigoTrabajador: worker.codigoTrabajador, userEntrega: input.userEntrega, fechaSalida: fecha, descripcionHerramienta: tool.descripcion, nombreTrabajador: worker.nombreCompleto, marcobreTrabajador: worker.marcobre, estado: "Prestada" });
    await tx.insert(movimientos).values({ tipo: "Salida", idTag: tool.idTag, codigoTrabajador: worker.codigoTrabajador, userId: input.userEntrega, fechaMovimiento: fecha, transaccionId: Number(inserted[0].insertId), descripcionHerramienta: tool.descripcion, nombreTrabajador: worker.nombreCompleto, observacion: "Despacho de herramienta" });
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
    await tx.insert(movimientos).values({ tipo: "Entrada", idTag: open.idTag, codigoTrabajador: open.codigoTrabajador, userId: userRecibe, fechaMovimiento: fechaEntrada, transaccionId: open.id, descripcionHerramienta: open.descripcionHerramienta, nombreTrabajador: open.nombreTrabajador, observacion: "Recepción de devolución" });
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
  const herramientas = parseCsv(text, ["ID_Tag", "Descripcion", "Marca", "Estado_Activo", "Ubicacion"]);
  const ids = new Set<string>();
  for (const row of herramientas) { row.ID_Tag = row.ID_Tag.trim(); if (!row.ID_Tag) continue; if (!row.Descripcion.trim()) throw new TRPCError({ code: "BAD_REQUEST", message: "Cada herramienta debe incluir Descripcion." }); if (ids.has(row.ID_Tag)) throw new TRPCError({ code: "CONFLICT", message: `ID_Tag duplicado dentro del archivo: ${row.ID_Tag}` }); ids.add(row.ID_Tag); }
  const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La base de datos no está disponible." });
  for (const row of herramientas) { if (!row.ID_Tag) continue; const existing = (await db.select().from(catalogoHerramientas).where(eq(catalogoHerramientas.idTag, row.ID_Tag)).limit(1))[0]; if (existing) await db.update(catalogoHerramientas).set({ descripcion: row.Descripcion.trim(), marca: row.Marca.trim() || undefined, ubicacion: row.Ubicacion.trim() || undefined }).where(eq(catalogoHerramientas.idTag, row.ID_Tag)); else await db.insert(catalogoHerramientas).values({ idTag: row.ID_Tag, descripcion: row.Descripcion.trim(), marca: row.Marca.trim() || undefined, ubicacion: row.Ubicacion.trim() || undefined, estadoActivo: row.Estado_Activo.trim() === "0" ? 0 : 1 }); }
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
