from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/server/db.ts')
s=p.read_text()
old='  const supervisor = retirement.supervisorCodigo ? (await db.select().from(catalogoPersonal).where(eq(catalogoPersonal.codigoTrabajador, retirement.supervisorCodigo)).limit(1))[0] : undefined;\n  const user = (await db.select().from(usuarios).where(eq(usuarios.id, retirement.usuarioBaja)).limit(1))[0];\n  if (!supervisor) throw new TRPCError({ code: "BAD_REQUEST", message: "El supervisor del reporte ya no está disponible." });\n  return { db, tool, retirement, supervisor, user };'
new='  const supervisor = (retirement.supervisorCodigo ? (await db.select().from(catalogoPersonal).where(eq(catalogoPersonal.codigoTrabajador, retirement.supervisorCodigo)).limit(1))[0] : undefined) ?? { nombreCompleto: retirement.trabajadorResponsable, codigoTrabajador: "-" };\n  const user = (await db.select().from(usuarios).where(eq(usuarios.id, retirement.usuarioBaja)).limit(1))[0];\n  return { db, tool, retirement, supervisor, user };'
if old not in s: raise SystemExit('legacy retirement block not found')
p.write_text(s.replace(old,new))
