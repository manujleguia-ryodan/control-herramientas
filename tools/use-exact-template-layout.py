from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/server/db.ts')
s=p.read_text()
start=s.find('export async function createRetirementXlsx(idTag: string) {')
end=s.find('export async function regenerateRetirementReport', start)
if start < 0 or end < 0: raise SystemExit('xlsx function boundaries not found')
fn=r'''export async function createRetirementXlsx(idTag: string) {
  const { tool, retirement, supervisor, user } = await getLatestRetirement(idTag);
  const template = path.join(process.cwd(), "server", "templates", "formato-herramienta-danada.xlsx");
  const baseDir = path.join(process.cwd(), "storage", "bajas", safeFilePart(idTag));
  await fs.mkdir(baseDir, { recursive: true });
  const date = new Date(retirement.fechaIncidente);
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, "");
  const xlsxNombre = `Reporte_FS_${safeFilePart(idTag)}_${datePart}.xlsx`;
  const xlsxPath = path.join(baseDir, xlsxNombre);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(template);
  const ws = workbook.worksheets[0];
  const dateText = date.toLocaleString("es-PE", { timeZone: "America/Lima" });
  const put = (cell: string, value: string) => { ws.getCell(cell).value = value; };
  // Mantener el formato recibido: solo se completan los campos vacíos de la plantilla.
  put("C4", `FECHA DE ELABORACIÓN : ${dateText}`);
  put("C5", `${supervisor.nombreCompleto} (${supervisor.codigoTrabajador})`);
  put("C6", user?.nombre ?? `Usuario #${retirement.usuarioBaja}`);
  put("C7", "HERRAMIENTA DAÑADA / INOPERATIVA");
  put("C8", dateText);
  put("C10", tool.descripcion);
  put("C11", tool.marca ?? "");
  put("C12", "");
  put("C13", "");
  put("C14", tool.idTag);
  put("C15", `Ubicación: ${tool.ubicacion ?? "No registrada"}`);

  const photoNames = (await fs.readdir(baseDir)).filter((name) => /\.(jpe?g|png)$/i.test(name)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).slice(0, 5);
  // En el formato recibido, la descripción queda en el bloque izquierdo y las fotos al lado derecho.
  try { ws.unMergeCells("A17:I30"); } catch {}
  ws.mergeCells("A17:D30");
  ws.mergeCells("E17:I30");
  put("A16", "2.DESCRIPCIÓN DEL EVENTO :");
  put("A17", retirement.motivo); // texto exacto ingresado en el modal de baja
  put("E16", photoNames.length ? "EVIDENCIAS FOTOGRÁFICAS" : "");
  for (let index = 0; index < photoNames.length; index++) {
    const photoName = photoNames[index];
    const photoPath = path.join(baseDir, photoName);
    const extension = /\.png$/i.test(photoName) ? "png" : "jpeg";
    const imageId = workbook.addImage({ filename: photoPath, extension });
    const col = index % 2 === 0 ? 4 : 6;
    const row = 16 + Math.floor(index / 2) * 7;
    ws.addImage(imageId, { tl: { col, row }, ext: { width: 125, height: 82 } });
  }
  await workbook.xlsx.writeFile(xlsxPath);
  return { xlsxPath, xlsxNombre, tool: idTag };
}

'''
p.write_text(s[:start]+fn+s[end:])
