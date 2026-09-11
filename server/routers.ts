import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { clearSession, createSession, setSession } from "./internalSession";
import { verifyPin } from "./pinAuth";
import { createLocation, createMiningUnit, createPersonal, createStorekeeper, createTool, createToolRecord, createUser, createWorker, deactivatePersonal, deactivateTool, deleteToolSafely, deleteUserSafely, deactivateUser, dispatchTransaction, getCatalogSnapshot, getCounts, getUserById, getUserCount, getUsers, importCsvCatalog, importPersonalCsv, importToolsCsv, recordMovement, returnTransaction, searchTools } from "./db";
import { storagePut } from "./storage";

const optionalText = z.string().max(500).optional();
const oldImportSchema = z.object({
  units: z.array(z.object({ code: z.string(), name: z.string(), marcobre: optionalText, site: optionalText })),
  locations: z.array(z.object({ code: z.string(), name: z.string(), zone: optionalText, description: optionalText, unitCode: optionalText, photoUrl: optionalText })),
  storekeepers: z.array(z.object({ code: z.string(), fullName: z.string(), employeeId: optionalText, phone: optionalText })),
  workers: z.array(z.object({ code: z.string(), fullName: z.string(), area: optionalText, marcobre: optionalText, unitCode: optionalText })),
  tools: z.array(z.object({ code: z.string(), name: z.string(), category: optionalText, brand: optionalText, model: optionalText, serialNumber: optionalText, quantity: z.number().optional(), unitCode: optionalText, locationCode: optionalText, imageUrl: optionalText, notes: optionalText })),
});
const movementSchema = z.object({ toolId: z.number().int().positive(), workerId: z.number().int().positive(), storekeeperId: z.number().int().positive(), type: z.enum(["dispatch", "return", "transfer"]), quantity: z.number().int().positive(), note: optionalText, destination: optionalText, condition: optionalText });
const pinSchema = z.string().regex(/^\d{4}$/, "El PIN debe tener exactamente 4 dígitos");

function userView(user: { id: number; nombre: string; rol: "Admin" | "Almacen"; estado: number }) { return { id: user.id, name: user.nombre, nombre: user.nombre, role: user.rol === "Admin" ? "admin" as const : "user" as const, rol: user.rol, estado: user.estado, email: null }; }

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => ctx.user),
    status: publicProcedure.query(async () => ({ users: await getUserCount(), requiresFirstUser: (await getUserCount()) === 0 })),
    loginOptions: publicProcedure.query(async () => (await getUsers()).filter((user) => user.estado).map((user) => ({ id: user.id, nombre: user.nombre }))),
    registerFirst: publicProcedure.input(z.object({ nombre: z.string().trim().min(2).max(160), pin: pinSchema })).mutation(async ({ input, ctx }) => {
      if ((await getUserCount()) > 0) throw new TRPCError({ code: "CONFLICT", message: "Ya existe un usuario administrador." });
      const created = await createUser({ nombre: input.nombre, pin: input.pin, rol: "Admin" });
      const user = await getUserById(created.id); if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo crear el usuario." });
      setSession(ctx.res, await createSession({ id: user.id, nombre: user.nombre, rol: user.rol })); return userView(user);
    }),
    login: publicProcedure.input(z.object({ id: z.number().int().positive(), pin: pinSchema })).mutation(async ({ input, ctx }) => {
      const user = await getUserById(input.id);
      if (!user || !user.estado || !verifyPin(input.pin, user.pinHash)) throw new TRPCError({ code: "UNAUTHORIZED", message: "ID o PIN incorrectos." });
      setSession(ctx.res, await createSession({ id: user.id, nombre: user.nombre, rol: user.rol })); return userView(user);
    }),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie("app_session_id", { maxAge: -1, secure: true, sameSite: "none", httpOnly: true, path: "/" }); return { success: true } as const; }),
  }),
  catalog: router({
    snapshot: protectedProcedure.query(() => getCatalogSnapshot()),
    searchTools: protectedProcedure.input(z.object({ query: z.string().trim().max(120).optional().default("") })).query(({ input }) => searchTools(input.query)),
    counts: protectedProcedure.query(() => getCounts()),
    import: adminProcedure.input(oldImportSchema).mutation(() => ({ success: true } as const)),
    importCsv: adminProcedure.input(z.object({ herramientasCsv: z.string().min(1, "Adjunta herramientas.csv"), personalCsv: z.string().min(1, "Adjunta personal.csv") })).mutation(async ({ input }) => { try { return await importCsvCatalog(input); } catch (error) { if (error instanceof TRPCError) throw error; throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "No se pudo procesar el CSV." }); } }),
    users: adminProcedure.query(() => getUsers()),
    createUser: adminProcedure.input(z.object({ nombre: z.string().trim().min(2).max(160), pin: pinSchema, rol: z.enum(["Admin", "Almacen"]).default("Almacen") })).mutation(({ input }) => createUser(input)),
    deactivateUser: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deactivateUser(input.id)),
    deleteUserSafely: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input, ctx }) => deleteUserSafely(input.id, ctx.user.id)),
    createToolRecord: adminProcedure.input(z.object({ idTag: z.string().trim().min(1).max(100), descripcion: z.string().trim().min(1).max(2000), marca: optionalText, ubicacion: z.string().trim().max(80).optional(), stock: z.number().int().positive().default(1) })).mutation(({ input }) => createToolRecord(input)),
    deactivateTool: adminProcedure.input(z.object({ idTag: z.string().min(1), motivoBaja: z.string().trim().min(3).max(2000), fechaIncidente: z.number().int().positive(), trabajadorResponsable: z.string().trim().min(1).max(160), usuarioBaja: z.number().int().positive() })).mutation(({ input }) => deactivateTool(input.idTag, input.motivoBaja, input.fechaIncidente, input.trabajadorResponsable, input.usuarioBaja)),
    deleteToolSafely: adminProcedure.input(z.object({ idTag: z.string().min(1) })).mutation(({ input }) => deleteToolSafely(input.idTag)),
    createPersonal: protectedProcedure.input(z.object({ codigoTrabajador: z.string().trim().min(1).max(80), nombreCompleto: z.string().trim().min(2).max(160), marcobre: optionalText, tipo: z.string().trim().min(1).max(40) })).mutation(({ input }) => createPersonal(input)),
    deactivatePersonal: adminProcedure.input(z.object({ codigoTrabajador: z.string().min(1) })).mutation(({ input }) => deactivatePersonal(input.codigoTrabajador)),
    createUnit: adminProcedure.input(z.object({ code: z.string(), name: z.string(), marcobre: optionalText, site: optionalText })).mutation(({ input }) => createMiningUnit(input)),
    createLocation: adminProcedure.input(z.object({ code: z.string(), name: z.string(), zone: optionalText, description: optionalText, unitId: z.number().optional(), photoUrl: optionalText, photoKey: optionalText })).mutation(({ input }) => createLocation(input)),
    createStorekeeper: adminProcedure.input(z.object({ code: z.string(), fullName: z.string(), employeeId: optionalText, phone: optionalText, password: pinSchema.optional() })).mutation(({ input }) => createStorekeeper(input)),
    createWorker: adminProcedure.input(z.object({ code: z.string(), fullName: z.string(), area: optionalText, marcobre: optionalText, unitId: z.number().optional() })).mutation(({ input }) => createWorker(input)),
    createTool: adminProcedure.input(z.object({ code: z.string(), name: z.string(), brand: optionalText, notes: optionalText, category: optionalText, model: optionalText, serialNumber: optionalText, quantity: z.number().optional(), unitId: z.number().optional(), locationId: z.number().optional(), imageUrl: optionalText, imageKey: optionalText })).mutation(({ input }) => createTool(input)),
    uploadImage: protectedProcedure.input(z.object({ fileName: z.string(), contentType: z.string().regex(/^image\/(jpeg|png|webp|heic)$/), dataUrl: z.string().min(30) })).mutation(async ({ input, ctx }) => { const match = input.dataUrl.match(/^data:[^;]+;base64,(.+)$/); if (!match) throw new Error("Invalid image data"); return storagePut(`tools/${ctx.user.id}/${Date.now()}-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-")}`, Buffer.from(match[1], "base64"), input.contentType); }),
  }),
  movements: router({ create: protectedProcedure.input(movementSchema).mutation(({ input }) => recordMovement(input)), dispatch: protectedProcedure.input(z.object({ idTag: z.string(), codigoTrabajador: z.string(), userEntrega: z.number().int().positive(), cantidad: z.literal(1).default(1) })).mutation(({ input }) => dispatchTransaction(input)), return: protectedProcedure.input(z.object({ idTag: z.string(), userRecibe: z.number().int().positive(), movementId: z.number().int().positive().optional() })).mutation(({ input }) => returnTransaction(input.idTag, input.userRecibe, input.movementId)) }),
});

export type AppRouter = typeof appRouter;
