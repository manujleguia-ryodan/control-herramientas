import fs from 'node:fs';
const p='/home/ubuntu/control-herramientas/server/routers.ts'; let s=fs.readFileSync(p,'utf8');
s=s.replace('dispatch: protectedProcedure.input(z.object({ idTag: z.string(), codigoTrabajador: z.string(), userEntrega: z.number().int().positive(), cantidad: z.number().int().positive().default(1) }))', 'dispatch: protectedProcedure.input(z.object({ idTag: z.string(), codigoTrabajador: z.string(), userEntrega: z.number().int().positive(), cantidad: z.literal(1).default(1) }))');
s=s.replace('createPersonal: adminProcedure.input(z.object({ codigoTrabajador:', 'createPersonal: protectedProcedure.input(z.object({ codigoTrabajador:');
fs.writeFileSync(p,s);
