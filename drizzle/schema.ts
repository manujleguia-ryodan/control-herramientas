import { bigint, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const miningUnits = mysqlTable("mining_units", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  company: varchar("company", { length: 160 }),
  site: varchar("site", { length: 160 }),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const warehouseLocations = mysqlTable("warehouse_locations", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId"),
  code: varchar("code", { length: 60 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  zone: varchar("zone", { length: 120 }),
  description: text("description"),
  photoUrl: text("photoUrl"),
  photoKey: text("photoKey"),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const storekeepers = mysqlTable("storekeepers", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  fullName: varchar("fullName", { length: 160 }).notNull(),
  employeeId: varchar("employeeId", { length: 80 }),
  phone: varchar("phone", { length: 50 }),
  passwordHash: text("passwordHash"),
  role: mysqlEnum("role", ["admin", "operator"]).default("operator").notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const workers = mysqlTable("workers", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId"),
  code: varchar("code", { length: 40 }).notNull().unique(),
  fullName: varchar("fullName", { length: 160 }).notNull(),
  area: varchar("area", { length: 160 }),
  company: varchar("company", { length: 160 }),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const tools = mysqlTable("tools", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId"),
  locationId: int("locationId"),
  code: varchar("code", { length: 60 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  category: varchar("category", { length: 100 }),
  brand: varchar("brand", { length: 120 }),
  model: varchar("model", { length: 120 }),
  serialNumber: varchar("serialNumber", { length: 120 }),
  quantity: int("quantity").default(1).notNull(),
  availableQuantity: int("availableQuantity").default(1).notNull(),
  status: mysqlEnum("status", ["available", "borrowed", "maintenance", "lost", "retired"]).default("available").notNull(),
  imageUrl: text("imageUrl"),
  imageKey: text("imageKey"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const movements = mysqlTable("movements", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId"),
  toolId: int("toolId").notNull(),
  workerId: int("workerId").notNull(),
  storekeeperId: int("storekeeperId").notNull(),
  type: mysqlEnum("type", ["dispatch", "return", "transfer"]).notNull(),
  quantity: int("quantity").notNull(),
  occurredAt: bigint("occurredAt", { mode: "number" }).notNull(),
  destination: varchar("destination", { length: 160 }),
  condition: varchar("condition", { length: 120 }),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type MiningUnit = typeof miningUnits.$inferSelect;
export type WarehouseLocation = typeof warehouseLocations.$inferSelect;
export type Storekeeper = typeof storekeepers.$inferSelect;
export type Worker = typeof workers.$inferSelect;
export type Tool = typeof tools.$inferSelect;
export type Movement = typeof movements.$inferSelect;
