from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/server/db.ts')
s=p.read_text()
# Replace PDF header and evidence block.
old='''    doc.fontSize(16).font("Helvetica-Bold").text("REPORTE DE HERRAMIENTA FUERA DE SERVICIO", { align: "center" });
    doc.moveDown(1.5).fontSize(10).font("Helvetica");'''
new='''    const logoPath = path.join(process.cwd(), "server", "templates", "logo-marcobre.png");
    try { doc.image(logoPath, 48, 38, { fit: [170, 34] }); } catch {}
    doc.y = 88;
    doc.fontSize(16).font("Helvetica-Bold").text("REPORTE DE HERRAMIENTA FUERA DE SERVICIO", { align: "center" });
    doc.moveDown(1.5).fontSize(10).font("Helvetica");'''
if old not in s: raise SystemExit('pdf header not found')
s=s.replace(old,new)
old='''      doc.moveDown(.8).font("Helvetica-Bold").text("Evidencias fotográficas").moveDown(.5);
      let x = 48; let y = doc.y;
      for (const photoPath of photoPaths) {
        try { doc.image(photoPath, x, y, { fit: [235, 155], align: "center", valign: "center" }); } catch {}
        x += 250;
        if (x > 300) { x = 48; y += 175; if (y > 650) { doc.addPage(); y = 48; } }
      }'''
new='''      doc.moveDown(.8).font("Helvetica-Bold").text("Evidencias fotográficas").moveDown(.5);
      let x = 48; let y = doc.y;
      let evidenceIndex = 0;
      for (const photoPath of photoPaths) {
        evidenceIndex += 1;
        try { doc.image(photoPath, x, y, { fit: [235, 135], align: "center", valign: "center" }); } catch {}
        doc.font("Helvetica").fontSize(8).text(`Evidencia ${evidenceIndex} – Estado de la herramienta al momento de la baja.`, x, y + 140, { width: 235, align: "center" });
        x += 250;
        if (x > 300) { x = 48; y += 175; if (y > 650) { doc.addPage(); y = 48; } }
      }'''
if old not in s: raise SystemExit('pdf evidence block not found')
s=s.replace(old,new)
# Replace XLSX section inside function.
old='''  const ws = workbook.worksheets[0];
  const dateText = date.toLocaleString("es-PE", { timeZone: "America/Lima" });'''
new='''  const ws = workbook.worksheets[0];
  const logoPath = path.join(process.cwd(), "server", "templates", "logo-marcobre.png");
  try {
    const logoId = workbook.addImage({ filename: logoPath, extension: "png" });
    ws.addImage(logoId, { tl: { col: 7, row: 0 }, ext: { width: 245, height: 48 } });
  } catch {}
  const dateText = date.toLocaleString("es-PE", { timeZone: "America/Lima" });'''
if old not in s: raise SystemExit('xlsx ws block not found')
s=s.replace(old,new)
old='''  put("A16", "2.DESCRIPCIÓN DEL EVENTO Y EVIDENCIAS FOTOGRÁFICAS :");
  put("A17", retirement.motivo);

  const photoNames = (await fs.readdir(baseDir)).filter((name) => /\\.(jpe?g|png)$/i.test(name)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).slice(0, 5);
  if (photoNames.length) {
    put("E16", "EVIDENCIAS");
    for (let index = 0; index < photoNames.length; index++) {
      const photoName = photoNames[index];
      const photoPath = path.join(baseDir, photoName);
      const extension = /\\.png$/i.test(photoName) ? "png" : "jpeg";
      const imageId = workbook.addImage({ filename: photoPath, extension });
      const col = index % 2 === 0 ? 4 : 6;
      const row = 16 + Math.floor(index / 2) * 8;
      ws.addImage(imageId, { tl: { col, row }, ext: { width: 210, height: 132 } });
    }
  }'''
new='''  // La plantilla trae la descripción como un bloque combinado; se divide para reservar espacio a las evidencias.
  try { ws.unMergeCells("A17:I30"); } catch {}
  ws.mergeCells("A17:I19");
  put("A16", "2.DESCRIPCIÓN DEL EVENTO Y EVIDENCIAS FOTOGRÁFICAS :");
  put("A17", retirement.motivo);

  const photoNames = (await fs.readdir(baseDir)).filter((name) => /\\.(jpe?g|png)$/i.test(name)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).slice(0, 5);
  if (photoNames.length) {
    put("E16", "EVIDENCIAS");
    for (let index = 0; index < photoNames.length; index++) {
      const photoName = photoNames[index];
      const photoPath = path.join(baseDir, photoName);
      const extension = /\\.png$/i.test(photoName) ? "png" : "jpeg";
      const imageId = workbook.addImage({ filename: photoPath, extension });
      const col = index % 2 === 0 ? 1 : 5;
      const row = 20 + Math.floor(index / 2) * 8;
      ws.addImage(imageId, { tl: { col, row }, ext: { width: 190, height: 112 } });
      const captionCell = index % 2 === 0 ? `B${row + 6}` : `F${row + 6}`;
      put(captionCell, `Evidencia ${index + 1} – Estado de la herramienta al momento de la baja.`);
    }
  }'''
if old not in s: raise SystemExit('xlsx evidence block not found')
s=s.replace(old,new)
p.write_text(s)
