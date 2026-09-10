import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { createInternalSession, setInternalSessionCookie } from "./internalAuth";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createLocation, createMiningUnit, createStorekeeper, createTool, createWorker, getCatalogSnapshot, getCounts, getStorekeeperByCode, getStorekeeperCount, importCatalog, recordMovement } from "./db";
import { verifyPassword } from "./passwords";
import { storagePut } from "./storage";

const optionalText = z.string().max(500).optional();
const credentials = z.object({ code: z.string().trim().min(1).max(40), password: z.string().min(6).max(100) });
const movementSchema = z.object({ toolId: z.number().int().positive(), workerId: z.number().int().positive(), storekeeperId: z.number().int().positive(), type: z.enum(["dispatch", "return", "transfer"]), quantity: z.number().int().positive(), unitId: z.number().int().positive().optional(), destination: z.string().max(160).optional(), condition: z.string().max(120).optional(), note: z.string().max(2000).optional() });
const importSchema = z.object({
  units: z.array(z.object({ code: z.string(), name: z.string(), company: optionalText, site: optionalText })),
  locations: z.array(z.object({ code: z.string(), name: z.string(), zone: optionalText, description: optionalText, unitCode: optionalText, photoUrl: optionalText })),
  storekeepers: z.array(z.object({ code: z.string(), fullName: z.string(), employeeId: optionalText, phone: optionalText, password: z.string().min(6).optional() })),
  workers: z.array(z.object({ code: z.string(), fullName: z.string(), area: optionalText, company: optionalText, unitCode: optionalText })),
  tools: z.array(z.object({ code: z.string(), name: z.string(), category: optionalText, brand: optionalText, model: optionalText, serialNumber: optionalText, quantity: z.number().optional(), unitCode: optionalText, locationCode: optionalText, imageUrl: optionalText, notes: optionalText })),
});

function publicUser(user: { id: number; code: string; fullName: string; role: "admin" | "operator" }) { return { id: user.id, code: user.code, name: user.fullName, role: user.role }; }

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    bootstrapStatus: publicProcedure.query(async () => ({ storekeeperCount: await getStorekeeperCount(), requiresFirstRegistration: (await getStorekeeperCount()) === 0 })),
    registerFirst: publicProcedure.input(z.object({ code: z.string().trim().min(1).max(40), fullName: z.string().trim().min(2).max(160), employeeId: optionalText, phone: optionalText, password: z.string().min(6).max(100) })).mutation(async ({ input, ctx }) => {
      if ((await getStorekeeperCount()) > 0) throw new TRPCError({ code: "CONFLICT", message: "Ya existe un almacenero. Ingresa con tu código y contraseña." });
      await createStorekeeper(input);
      const created = await getStorekeeperByCode(input.code);
      if (!created || !created.passwordHash) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo crear el almacenero." });
      const token = await createInternalSession({ id: created.id, code: created.code, fullName: created.fullName, role: created.role });
      setInternalSessionCookie(ctx.res, ctx.req, token);
      return publicUser({ id: created.id, code: created.code, fullName: created.fullName, role: created.role });
    }),
    login: publicProcedure.input(credentials).mutation(async ({ input, ctx }) => {
      if ((await getStorekeeperCount()) === 0) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Primero registra al primer almacenero." });
      const storekeeper = await getStorekeeperByCode(input.code);
      if (!storekeeper?.passwordHash || !storekeeper.active || !verifyPassword(input.password, storekeeper.passwordHash)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Código o contraseña incorrectos." });
      const token = await createInternalSession({ id: storekeeper.id, code: storekeeper.code, fullName: storekeeper.fullName, role: storekeeper.role });
      setInternalSessionCookie(ctx.res, ctx.req, token);
      return publicUser({ id: storekeeper.id, code: storekeeper.code, fullName: storekeeper.fullName, role: storekeeper.role });
    }),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  catalog: router({
    snapshot: protectedProcedure.query(() => getCatalogSnapshot()),
    counts: protectedProcedure.query(() => getCounts()),
    import: adminProcedure.input(importSchema).mutation(({ input }) => importCatalog(input)),
    createUnit: adminProcedure.input(z.object({ code: z.string().min(1).max(40), name: z.string().min(1).max(160), company: optionalText, site: optionalText })).mutation(({ input }) => createMiningUnit(input)),
    createLocation: adminProcedure.input(z.object({ code: z.string().min(1).max(60), name: z.string().min(1).max(160), zone: optionalText, description: optionalText, unitId: z.number().int().positive().optional(), photoUrl: optionalText, photoKey: optionalText })).mutation(({ input }) => createLocation(input)),
    createStorekeeper: adminProcedure.input(z.object({ code: z.string().min(1).max(40), fullName: z.string().min(1).max(160), employeeId: optionalText, phone: optionalText, password: z.string().min(6).max(100) })).mutation(({ input }) => createStorekeeper(input)),
    createWorker: adminProcedure.input(z.object({ code: z.string().min(1).max(40), fullName: z.string().min(1).max(160), area: optionalText, company: optionalText, unitId: z.number().int().positive().optional() })).mutation(({ input }) => createWorker(input)),
    createTool: adminProcedure.input(z.object({ code: z.string().min(1).max(60), name: z.string().min(1).max(180), category: optionalText, brand: optionalText, model: optionalText, serialNumber: optionalText, quantity: z.number().int().positive().optional(), unitId: z.number().int().positive().optional(), locationId: z.number().int().positive().optional(), imageUrl: optionalText, imageKey: optionalText, notes: optionalText })).mutation(({ input }) => createTool(input)),
    uploadImage: protectedProcedure.input(z.object({ fileName: z.string().max(160), contentType: z.string().regex(/^image\/(jpeg|png|webp|heic)$/), dataUrl: z.string().min(30) })).mutation(async ({ input, ctx }) => { const match = input.dataUrl.match(/^data:[^;]+;base64,(.+)$/); if (!match) throw new Error("Invalid image data"); const buffer = Buffer.from(match[1], "base64"); if (buffer.length > 8 * 1024 * 1024) throw new Error("Image exceeds 8 MB"); return storagePut(`tools/${ctx.user.id}/${Date.now()}-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-")}`, buffer, input.contentType); }),
  }),
  movements: router({ create: protectedProcedure.input(movementSchema).mutation(({ input }) => recordMovement(input)) }),
});

export type AppRouter = typeof appRouter;
