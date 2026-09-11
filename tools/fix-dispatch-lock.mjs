import fs from 'node:fs';
const p='/home/ubuntu/control-herramientas/server/db.ts'; let s=fs.readFileSync(p,'utf8');
s=s.replace('    if (cantidad > tool.stock) throw new TRPCError({ code: "BAD_REQUEST", message: `Stock insuficiente. Disponible: ${tool.stock}.` });\n','');
s=s.replace('    await tx.update(catalogoHerramientas).set({ stock: tool.stock - cantidad }).where(eq(catalogoHerramientas.idTag, input.idTag));\n','');
const marker='    if (!tool || !tool.estadoActivo) throw new TRPCError({ code: "NOT_FOUND", message: "Herramienta no encontrada o fuera de servicio." });\n';
const insert=marker+'    const activeLoan = (await tx.select({ codigoTrabajador: transacciones.codigoTrabajador, nombreTrabajador: transacciones.nombreTrabajador }).from(transacciones).where(and(eq(transacciones.idTag, input.idTag), isNull(transacciones.fechaRetorno))).limit(1))[0];\n    if (activeLoan) throw new TRPCError({ code: "CONFLICT", message: `Error: Esta herramienta no está disponible. Actualmente está prestada a ${activeLoan.nombreTrabajador || activeLoan.codigoTrabajador}` });\n';
s=s.replace(marker,insert);
fs.writeFileSync(p,s);
