import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

const user = { id: 1, nombre: "Administrador", rol: "Admin" as const, estado: 1 };
const ctx = {
  user,
  req: { headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
};
const caller = appRouter.createCaller(ctx);

for (const query of ["", "T-", "martillo"]) {
  const result = await caller.catalog.searchTools({ query });
  console.log(JSON.stringify({ query, count: result.length, sample: result.slice(0, 3).map((row) => ({ idTag: row.idTag, descripcion: row.descripcion })) }));
}
