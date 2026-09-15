import { bigint, int, mysqlEnum, mysqlTable, text, varchar } from "drizzle-orm/mysql-core";

/** Modelo interno sin correo: el acceso se realiza con ID de usuario y PIN de 4 dígitos. */
export const usuarios = mysqlTable("usuarios", {
  id: int("ID").autoincrement().primaryKey(),
  nombre: varchar("Nombre", { length: 160 }).notNull(),
  pinHash: varchar("PIN_Hash", { length: 255 }).notNull(),
  rol: mysqlEnum("Rol", ["Admin", "Almacen"]).default("Almacen").notNull(),
  estado: int("Estado").default(1).notNull(),
});

export const catalogoHerramientas = mysqlTable("catalogo_herramientas", {
  idTag: varchar("ID_Tag", { length: 100 }).primaryKey(),
  descripcion: text("Descripcion").notNull(),
  marca: varchar("Marca", { length: 120 }),
  ubicacion: varchar("Ubicacion", { length: 80 }),
  estadoActivo: int("Estado_Activo").default(1).notNull(),
});

export const catalogoPersonal = mysqlTable("catalogo_personal", {
  codigoTrabajador: varchar("Codigo_Trabajador", { length: 80 }).primaryKey(),
  nombreCompleto: varchar("Nombre_Completo", { length: 160 }).notNull(),
  marcobre: varchar("Marcobre", { length: 160 }),
  tipo: varchar("Tipo", { length: 40 }).notNull(),
});

export const transacciones = mysqlTable("transacciones", {
  id: int("ID").autoincrement().primaryKey(),
  idTag: varchar("ID_Tag", { length: 100 }).notNull(),
  codigoTrabajador: varchar("Codigo_Trabajador", { length: 80 }).notNull(),
  userEntrega: int("User_Entrega").notNull(),
  fechaSalida: bigint("Fecha_Salida", { mode: "number" }).notNull(),
  userRecibe: int("User_Recibe"),
  fechaRetorno: bigint("Fecha_Retorno", { mode: "number" }),
  descripcionHerramienta: text("Descripcion_Herramienta"),
  nombreTrabajador: varchar("Nombre_Trabajador", { length: 160 }),
  marcobreTrabajador: varchar("Marcobre_Trabajador", { length: 160 }),
  estado: varchar("Estado", { length: 30 }).default("Prestada").notNull(),
});

export const movimientos = mysqlTable("movimientos", {
  id: int("ID").autoincrement().primaryKey(),
  tipo: mysqlEnum("Tipo", ["Entrada", "Salida"]).notNull(),
  idTag: varchar("ID_Tag", { length: 100 }).notNull(),
  codigoTrabajador: varchar("Codigo_Trabajador", { length: 80 }),
  userId: int("User_ID").notNull(),
  fechaMovimiento: bigint("Fecha_Movimiento", { mode: "number" }).notNull(),
  transaccionId: int("Transaccion_ID"),
  descripcionHerramienta: text("Descripcion_Herramienta"),
  nombreTrabajador: varchar("Nombre_Trabajador", { length: 160 }),
  observacion: text("Observacion"),
});

/** Tipo de sesión interno. Se mantienen campos opcionales heredados para compatibilidad de compilación del shell. */
export type User = {
  id: number;
  nombre: string;
  pinHash?: string;
  rol: "Admin" | "Almacen";
  estado: number;
  name?: string | null;
  email?: string | null;
  openId?: string;
  loginMethod?: string | null;
  role?: "user" | "admin";
  createdAt?: Date;
  updatedAt?: Date;
  lastSignedIn?: Date;
};
export type InsertUser = { nombre: string; pinHash: string; rol?: "Admin" | "Almacen"; estado?: number };
export type Herramienta = typeof catalogoHerramientas.$inferSelect;
export type Personal = typeof catalogoPersonal.$inferSelect;
export type Transaccion = typeof transacciones.$inferSelect;

export const bajasHerramientas = mysqlTable("bajas_herramientas", {
  id: int("ID").autoincrement().primaryKey(),
  idTag: varchar("ID_Tag", { length: 100 }).notNull(),
  motivo: text("Motivo").notNull(),
  fechaIncidente: bigint("Fecha_Incidente", { mode: "number" }).notNull(),
  trabajadorResponsable: varchar("Trabajador_Responsable", { length: 160 }).notNull(),
  usuarioBaja: int("Usuario_Baja").notNull(),
  supervisorCodigo: varchar("Supervisor_Codigo", { length: 80 }),
  pdfNombre: varchar("PDF_Nombre", { length: 220 }),
});
