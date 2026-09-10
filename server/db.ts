import { desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  miningUnits,
  movements,
  storekeepers,
  tools,
  users,
  warehouseLocations,
  workers,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined || user.openId === ENV.ownerOpenId) {
    values.role = user.role ?? "admin";
    updateSet.role = values.role;
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getCatalogSnapshot() {
  const db = await getDb();
  if (!db) return { units: [], locations: [], storekeepers: [], workers: [], tools: [], movements: [], stats: emptyStats() };
  const [units, locations, storekeepersRows, workersRows, toolsRows, movementRows] = await Promise.all([
    db.select().from(miningUnits).orderBy(miningUnits.name),
    db.select().from(warehouseLocations).orderBy(warehouseLocations.name),
    db.select().from(storekeepers).orderBy(storekeepers.fullName),
    db.select().from(workers).orderBy(workers.fullName),
    db.select().from(tools).orderBy(tools.name),
    db.select().from(movements).orderBy(desc(movements.occurredAt)).limit(500),
  ]);
  const toolRotation = new Map<number, number>();
  const openLoan = new Map<number, { workerId: number; storekeeperId: number; occurredAt: number }>();
  for (const movement of [...movementRows].reverse()) {
    if (movement.type === "dispatch") {
      toolRotation.set(movement.toolId, (toolRotation.get(movement.toolId) ?? 0) + movement.quantity);
      openLoan.set(movement.toolId, { workerId: movement.workerId, storekeeperId: movement.storekeeperId, occurredAt: movement.occurredAt });
    } else if (movement.type === "return") {
      openLoan.delete(movement.toolId);
    }
  }
  const workerById = new Map(workersRows.map((row) => [row.id, row]));
  const storekeeperById = new Map(storekeepersRows.map((row) => [row.id, row]));
  const enrichedTools = toolsRows.map((tool) => {
    const loan = openLoan.get(tool.id);
    const worker = loan ? workerById.get(loan.workerId) : undefined;
    const storekeeper = loan ? storekeeperById.get(loan.storekeeperId) : undefined;
    return { ...tool, rotations: toolRotation.get(tool.id) ?? 0, holder: worker?.fullName ?? null, holderCode: worker?.code ?? null, loanStorekeeper: storekeeper?.fullName ?? null, daysOut: loan ? Math.max(0, Math.floor((Date.now() - loan.occurredAt) / 86_400_000)) : 0 };
  });
  const stats = {
    totalStock: toolsRows.reduce((sum, tool) => sum + tool.quantity, 0),
    totalAvailable: toolsRows.reduce((sum, tool) => sum + tool.availableQuantity, 0),
    borrowed: toolsRows.reduce((sum, tool) => sum + (tool.quantity - tool.availableQuantity), 0),
    overdue: enrichedTools.filter((tool) => tool.daysOut >= 7).length,
    totalTools: toolsRows.length,
    totalMovements: movementRows.length,
  };
  return { units, locations, storekeepers: storekeepersRows, workers: workersRows, tools: enrichedTools, movements: movementRows, stats };
}

export function emptyStats() { return { totalStock: 0, totalAvailable: 0, borrowed: 0, overdue: 0, totalTools: 0, totalMovements: 0 }; }

export async function createMiningUnit(input: { code: string; name: string; company?: string; site?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(miningUnits).values(input);
  return { success: true } as const;
}
export async function createLocation(input: { code: string; name: string; zone?: string; description?: string; unitId?: number; photoUrl?: string; photoKey?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(warehouseLocations).values(input);
  return { success: true } as const;
}
export async function createStorekeeper(input: { code: string; fullName: string; employeeId?: string; phone?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(storekeepers).values(input);
  return { success: true } as const;
}
export async function createWorker(input: { code: string; fullName: string; area?: string; company?: string; unitId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(workers).values(input);
  return { success: true } as const;
}
export async function createTool(input: { code: string; name: string; category?: string; brand?: string; model?: string; serialNumber?: string; quantity?: number; unitId?: number; locationId?: number; imageUrl?: string; imageKey?: string; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const quantity = Math.max(1, input.quantity ?? 1);
  await db.insert(tools).values({ ...input, quantity, availableQuantity: quantity });
  return { success: true } as const;
}

export async function recordMovement(input: { toolId: number; workerId: number; storekeeperId: number; type: "dispatch" | "return" | "transfer"; quantity: number; unitId?: number; destination?: string; condition?: string; note?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const tool = (await db.select().from(tools).where(eq(tools.id, input.toolId)).limit(1))[0];
  if (!tool) throw new Error("Tool not found");
  if (input.quantity < 1) throw new Error("Quantity must be positive");
  const nextAvailable = input.type === "dispatch" ? tool.availableQuantity - input.quantity : input.type === "return" ? tool.availableQuantity + input.quantity : tool.availableQuantity;
  if (nextAvailable < 0) throw new Error("Not enough available quantity");
  if (nextAvailable > tool.quantity) throw new Error("Returned quantity exceeds stock");
  const nextStatus = input.type === "dispatch" && nextAvailable === 0 ? "borrowed" : input.type === "return" ? "available" : tool.status;
  await db.transaction(async (tx) => {
    await tx.insert(movements).values({ ...input, occurredAt: Date.now(), unitId: input.unitId ?? tool.unitId ?? undefined });
    await tx.update(tools).set({ availableQuantity: nextAvailable, status: nextStatus }).where(eq(tools.id, input.toolId));
  });
  return { success: true } as const;
}

export async function importCatalog(input: { units: Array<{ code: string; name: string; company?: string; site?: string }>; locations: Array<{ code: string; name: string; zone?: string; description?: string; unitCode?: string; photoUrl?: string }>; storekeepers: Array<{ code: string; fullName: string; employeeId?: string; phone?: string }>; workers: Array<{ code: string; fullName: string; area?: string; company?: string; unitCode?: string }>; tools: Array<{ code: string; name: string; category?: string; brand?: string; model?: string; serialNumber?: string; quantity?: number; unitCode?: string; locationCode?: string; imageUrl?: string; notes?: string }> }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async (tx) => {
    for (const row of input.units) if (row.code && row.name) await tx.insert(miningUnits).values({ code: row.code.trim(), name: row.name.trim(), company: row.company, site: row.site }).onDuplicateKeyUpdate({ set: { name: row.name.trim(), company: row.company, site: row.site } });
    const units = await tx.select().from(miningUnits);
    const unitIdByCode = new Map(units.map((unit) => [unit.code, unit.id]));
    for (const row of input.locations) if (row.code && row.name) await tx.insert(warehouseLocations).values({ code: row.code.trim(), name: row.name.trim(), zone: row.zone, description: row.description, unitId: row.unitCode ? unitIdByCode.get(row.unitCode) : undefined, photoUrl: row.photoUrl }).onDuplicateKeyUpdate({ set: { name: row.name.trim(), zone: row.zone, description: row.description, unitId: row.unitCode ? unitIdByCode.get(row.unitCode) : undefined, photoUrl: row.photoUrl } });
    for (const row of input.storekeepers) if (row.code && row.fullName) await tx.insert(storekeepers).values({ code: row.code.trim(), fullName: row.fullName.trim(), employeeId: row.employeeId, phone: row.phone }).onDuplicateKeyUpdate({ set: { fullName: row.fullName.trim(), employeeId: row.employeeId, phone: row.phone } });
    for (const row of input.workers) if (row.code && row.fullName) await tx.insert(workers).values({ code: row.code.trim(), fullName: row.fullName.trim(), area: row.area, company: row.company, unitId: row.unitCode ? unitIdByCode.get(row.unitCode) : undefined }).onDuplicateKeyUpdate({ set: { fullName: row.fullName.trim(), area: row.area, company: row.company, unitId: row.unitCode ? unitIdByCode.get(row.unitCode) : undefined } });
    const locations = await tx.select().from(warehouseLocations);
    const locationIdByCode = new Map(locations.map((location) => [location.code, location.id]));
    for (const row of input.tools) if (row.code && row.name) { const quantity = Math.max(1, Number(row.quantity ?? 1)); await tx.insert(tools).values({ code: row.code.trim(), name: row.name.trim(), category: row.category, brand: row.brand, model: row.model, serialNumber: row.serialNumber, quantity, availableQuantity: quantity, unitId: row.unitCode ? unitIdByCode.get(row.unitCode) : undefined, locationId: row.locationCode ? locationIdByCode.get(row.locationCode) : undefined, imageUrl: row.imageUrl, notes: row.notes }).onDuplicateKeyUpdate({ set: { name: row.name.trim(), category: row.category, brand: row.brand, model: row.model, serialNumber: row.serialNumber, quantity, availableQuantity: quantity, unitId: row.unitCode ? unitIdByCode.get(row.unitCode) : undefined, locationId: row.locationCode ? locationIdByCode.get(row.locationCode) : undefined, imageUrl: row.imageUrl, notes: row.notes } }); }
    return { success: true } as const;
  });
}

export async function getCounts() {
  const db = await getDb();
  if (!db) return emptyStats();
  const [toolCount, unitCount, workerCount, storekeeperCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(tools), db.select({ count: sql<number>`count(*)` }).from(miningUnits), db.select({ count: sql<number>`count(*)` }).from(workers), db.select({ count: sql<number>`count(*)` }).from(storekeepers),
  ]);
  return { ...emptyStats(), totalTools: Number(toolCount[0]?.count ?? 0), units: Number(unitCount[0]?.count ?? 0), workers: Number(workerCount[0]?.count ?? 0), storekeepers: Number(storekeeperCount[0]?.count ?? 0) };
}
