from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/server/db.ts')
s=p.read_text()
s=s.replace('import * as XLSX from "xlsx";','import * as XLSX from "xlsx";\nimport ExcelJS from "exceljs";')
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
  put("A16", "2.DESCRIPCIÓN DEL EVENTO Y EVIDENCIAS FOTOGRÁFICAS :");
  put("A17", retirement.motivo);

  const photoNames = (await fs.readdir(baseDir)).filter((name) => /\.(jpe?g|png)$/i.test(name)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).slice(0, 5);
  if (photoNames.length) {
    put("E16", "EVIDENCIAS");
    for (let index = 0; index < photoNames.length; index++) {
      const photoName = photoNames[index];
      const photoPath = path.join(baseDir, photoName);
      const extension = /\.png$/i.test(photoName) ? "png" : "jpeg";
      const imageId = workbook.addImage({ filename: photoPath, extension });
      const col = index % 2 === 0 ? 4 : 6;
      const row = 16 + Math.floor(index / 2) * 8;
      ws.addImage(imageId, { tl: { col, row }, ext: { width: 210, height: 132 } });
    }
  }
  await workbook.xlsx.writeFile(xlsxPath);
  return { xlsxPath, xlsxNombre, tool: idTag };
}

'''
s=s[:start]+fn+s[end:]
p.write_text(s)
