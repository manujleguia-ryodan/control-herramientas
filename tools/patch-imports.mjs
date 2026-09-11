import fs from 'node:fs';
const p='/home/ubuntu/control-herramientas/server/db.ts'; let s=fs.readFileSync(p,'utf8');
const a=s.indexOf('export async function importToolsCsv'); const b=s.indexOf('\nexport async function importPersonalCsv',a);
const fn=`export async function importToolsCsv(text: string) {
  const herramientas = parseCsv(text, ["ID_Tag", "Descripcion", "Marca", "Estado_Activo", "Ubicacion", "Cantidad"]);
  const ids = new Set<string>();
  for (const row of herramientas) { row.ID_Tag = row.ID_Tag.trim(); if (!row.ID_Tag) continue; if (!row.Descripcion.trim()) throw new TRPCError({ code: "BAD_REQUEST", message: "Cada herramienta debe incluir Descripcion." }); if (ids.has(row.ID_Tag)) throw new TRPCError({ code: "CONFLICT", message: \`ID_Tag duplicado dentro del archivo: \${row.ID_Tag}\` }); ids.add(row.ID_Tag); }
  const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La base de datos no está disponible." });
  for (const row of herramientas) { if (!row.ID_Tag) continue; const cantidad = Number(row.Cantidad || "1"); if (!Number.isInteger(cantidad) || cantidad < 1) throw new TRPCError({ code: "BAD_REQUEST", message: \`Cantidad inválida para \${row.ID_Tag}.\` }); const existing = (await db.select().from(catalogoHerramientas).where(eq(catalogoHerramientas.idTag, row.ID_Tag)).limit(1))[0]; if (existing) await db.update(catalogoHerramientas).set({ descripcion: row.Descripcion.trim(), marca: row.Marca.trim() || undefined, ubicacion: row.Ubicacion.trim() || undefined }).where(eq(catalogoHerramientas.idTag, row.ID_Tag)); else await db.insert(catalogoHerramientas).values({ idTag: row.ID_Tag, descripcion: row.Descripcion.trim(), marca: row.Marca.trim() || undefined, ubicacion: row.Ubicacion.trim() || undefined, estadoActivo: row.Estado_Activo.trim() === "0" ? 0 : 1, stock: cantidad }); }
  return { herramientas: herramientas.filter((row) => row.ID_Tag).length } as const;
}
`;
if(a<0||b<0) throw new Error('import tools not found'); s=s.slice(0,a)+fn+s.slice(b); fs.writeFileSync(p,s);
