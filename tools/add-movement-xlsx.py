from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/server/db.ts')
s=p.read_text()
marker='export async function searchTools(query = "") {'
fn='''export async function createMovementsXlsx(filters: { search?: string; from?: string; to?: string } = {}) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const [ledger, userRows, people, tools] = await Promise.all([
    db.select().from(movimientos).orderBy(movimientos.fechaMovimiento),
    db.select({ id: usuarios.id, nombre: usuarios.nombre }).from(usuarios),
    db.select().from(catalogoPersonal),
    db.select().from(catalogoHerramientas),
  ]);
  const query = (filters.search ?? "").trim().toLowerCase();
  const from = filters.from ? new Date(`${filters.from}T00:00:00`).getTime() : 0;
  const to = filters.to ? new Date(`${filters.to}T23:59:59`).getTime() : Number.MAX_SAFE_INTEGER;
  const rows = ledger.filter((row) => {
    const user = userRows.find((item) => item.id === row.userId)?.nombre ?? `Usuario #${row.userId}`;
    const person = people.find((item) => item.codigoTrabajador === row.codigoTrabajador);
    const tool = tools.find((item) => item.idTag === row.idTag);
    const haystack = `${row.fechaMovimiento} ${row.tipo} ${row.idTag} ${tool?.descripcion ?? ""} ${row.codigoTrabajador ?? ""} ${person?.nombreCompleto ?? ""} ${user} ${row.observacion ?? ""}`.toLowerCase();
    return row.fechaMovimiento >= from && row.fechaMovimiento <= to && (!query || haystack.includes(query));
  });
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Almacén+";
  workbook.created = new Date();
  const ws = workbook.addWorksheet("Reporte de movimientos", { views: [{ showGridLines: false }] });
  ws.columns = [
    { header: "Fecha y hora", key: "fecha", width: 23 }, { header: "Movimiento", key: "tipo", width: 15 },
    { header: "ID_Tag", key: "idTag", width: 18 }, { header: "Herramienta", key: "herramienta", width: 32 },
    { header: "Código trabajador", key: "codigo", width: 21 }, { header: "Trabajador", key: "trabajador", width: 30 },
    { header: "Usuario de almacén", key: "usuario", width: 25 }, { header: "Observación", key: "observacion", width: 38 },
  ];
  ws.mergeCells("A1:H2");
  const logoPath = path.join(process.cwd(), "server", "templates", "logo-marcobre.png");
  try { const logoId = workbook.addImage({ filename: logoPath, extension: "png" }); ws.addImage(logoId, { tl: { col: 0.15, row: 0.15 }, ext: { width: 220, height: 44 } }); } catch {}
  ws.mergeCells("A3:H3"); ws.getCell("A3").value = "REPORTE DE MOVIMIENTOS";
  ws.getCell("A3").font = { name: "Arial", size: 18, bold: true, color: { argb: "FF1E293B" } };
  ws.getCell("A3").alignment = { horizontal: "center", vertical: "middle" }; ws.getRow(3).height = 28;
  ws.mergeCells("A4:H4"); ws.getCell("A4").value = `Generado: ${new Date().toLocaleString("es-PE", { timeZone: "America/Lima" })} · Filtros: ${filters.from || "inicio"} a ${filters.to || "hoy"}${query ? ` · ${filters.search}` : ""}`;
  ws.getCell("A4").font = { name: "Arial", size: 10, italic: true, color: { argb: "FF64748B" } }; ws.getCell("A4").alignment = { horizontal: "center" };
  const headerRow = ws.getRow(6); headerRow.values = ["Fecha y hora", "Movimiento", "ID_Tag", "Herramienta", "Código trabajador", "Trabajador", "Usuario de almacén", "Observación"];
  headerRow.height = 24; headerRow.eachCell((cell) => { cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } }; cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }; });
  rows.forEach((row) => { const person = people.find((item) => item.codigoTrabajador === row.codigoTrabajador); const tool = tools.find((item) => item.idTag === row.idTag); const user = userRows.find((item) => item.id === row.userId)?.nombre ?? `Usuario #${row.userId}`; const excelRow = ws.addRow([new Date(row.fechaMovimiento).toLocaleString("es-PE", { timeZone: "America/Lima" }), row.tipo, row.idTag, tool?.descripcion ?? "", row.codigoTrabajador ?? "", person?.nombreCompleto ?? "", user, row.observacion ?? ""]); excelRow.eachCell((cell) => { cell.font = { name: "Arial", size: 10, color: { argb: "FF334155" } }; cell.alignment = { vertical: "middle", wrapText: true }; cell.border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } }; }); const typeCell = excelRow.getCell(2); typeCell.font = { name: "Arial", size: 10, bold: true, color: { argb: row.tipo === "Salida" ? "FFEA580C" : "FF0F766E" } }; });
  ws.autoFilter = { from: "A6", to: "H6" }; ws.freezePanes = { xSplit: 0, ySplit: 6 };
  const baseDir = path.join(process.cwd(), "storage", "reportes"); await fs.mkdir(baseDir, { recursive: true }); const output = path.join(baseDir, `Reporte_Movimientos_${new Date().toISOString().slice(0,10).replace(/-/g,"")}.xlsx`); await workbook.xlsx.writeFile(output); return { xlsxPath: output, xlsxNombre: path.basename(output) };
}

'''
if marker not in s: raise SystemExit('db marker not found')
s=s.replace(marker,fn+marker)
p.write_text(s)

p=Path('/home/ubuntu/control-herramientas/server/_core/index.ts')
s=p.read_text().replace('createRetirementReport, importPersonalCsv, importToolsCsv, regenerateRetirementReport','createMovementsXlsx, createRetirementReport, importPersonalCsv, importToolsCsv, regenerateRetirementReport')
marker='  app.get("/api/retirements/report/:idTag",'
route='''  app.get("/api/movements/report.xlsx", async (req: express.Request, res: express.Response) => {
    try {
      const user = await getSessionUser(req);
      if (!user) return res.status(401).json({ ok: false, message: "Debes iniciar sesión." });
      const result = await createMovementsXlsx({ search: String(req.query.search ?? ""), from: String(req.query.from ?? ""), to: String(req.query.to ?? "") });
      return res.download(result.xlsxPath, result.xlsxNombre);
    } catch (error) { const message = error instanceof Error ? error.message : "No se pudo generar el reporte XLSX."; return res.status(400).json({ ok: false, message }); }
  });
'''
if marker not in s: raise SystemExit('route marker not found')
s=s.replace(marker,route+marker)
p.write_text(s)
