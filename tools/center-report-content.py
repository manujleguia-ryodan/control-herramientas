from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/server/db.ts')
s=p.read_text()
# Centered event description in the merged left block.
old='''  put("A16", "2.DESCRIPCIÓN DEL EVENTO :");
  put("A17", retirement.motivo); // texto exacto ingresado en el modal de baja
  put("E16", photoNames.length ? "EVIDENCIAS FOTOGRÁFICAS" : "");
  for (let index = 0; index < photoNames.length; index++) {
    const photoName = photoNames[index];
    const photoPath = path.join(baseDir, photoName);
    const extension = /\\.png$/i.test(photoName) ? "png" : "jpeg";
    const imageId = workbook.addImage({ filename: photoPath, extension });
    const col = index % 2 === 0 ? 4 : 6;
    const row = 16 + Math.floor(index / 2) * 7;
    ws.addImage(imageId, { tl: { col, row }, ext: { width: 125, height: 82 } });
  }'''
new='''  put("A16", "2.DESCRIPCIÓN DEL EVENTO :");
  put("A17", retirement.motivo); // texto exacto ingresado en el modal de baja
  ws.getCell("A17").alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  ws.getCell("A17").font = { name: "Arial", size: 11, bold: true, color: { argb: "FF1F2937" } };
  ws.getCell("A16").alignment = { horizontal: "center", vertical: "middle" };
  put("E16", photoNames.length ? "EVIDENCIAS FOTOGRÁFICAS" : "");
  ws.getCell("E16").alignment = { horizontal: "center", vertical: "middle" };
  for (let index = 0; index < photoNames.length; index++) {
    const photoName = photoNames[index];
    const photoPath = path.join(baseDir, photoName);
    const extension = /\\.png$/i.test(photoName) ? "png" : "jpeg";
    const imageId = workbook.addImage({ filename: photoPath, extension });
    // E:I es el bloque derecho de la plantilla; cada foto se centra y se apila para no desplazarla.
    const row = 17 + index * 5;
    ws.addImage(imageId, { tl: { col: 5.15, row }, ext: { width: 165, height: 88 } });
  }'''
if old not in s: raise SystemExit('xlsx center block not found')
s=s.replace(old,new)
# PDF: make event description a centered block instead of a left-aligned metadata line.
s=s.replace('''["Supervisor Responsable", `${supervisor.nombreCompleto} (${supervisor.codigoTrabajador})`],
      ["Descripción del Evento", input.motivo.trim()],''','''["Supervisor Responsable", `${supervisor.nombreCompleto} (${supervisor.codigoTrabajador})`],''')
old='''    for (const [label, value] of lines) { doc.font("Helvetica-Bold").text(`${label}:`, { continued: true }); doc.font("Helvetica").text(` ${value}`); doc.moveDown(.45); }
    if (photoPaths.length) {'''
new='''    for (const [label, value] of lines) { doc.font("Helvetica-Bold").text(`${label}:`, { continued: true }); doc.font("Helvetica").text(` ${value}`); doc.moveDown(.45); }
    doc.moveDown(.4).font("Helvetica-Bold").fontSize(11).text("Descripción del Evento", { align: "center" });
    doc.moveDown(.25).font("Helvetica").fontSize(10).text(input.motivo.trim(), { align: "center", width: 500 });
    if (photoPaths.length) {'''
if old not in s: raise SystemExit('pdf event block not found')
s=s.replace(old,new)
# PDF photos: center a single photo, and center the two-column group for multiple photos.
old='''      let x = 48; let y = doc.y;
      let evidenceIndex = 0;
      for (const photoPath of photoPaths) {
        evidenceIndex += 1;
        try { doc.image(photoPath, x, y, { fit: [235, 135], align: "center", valign: "center" }); } catch {}
        doc.font("Helvetica").fontSize(8).text(`Evidencia ${evidenceIndex} – Estado de la herramienta al momento de la baja.`, x, y + 140, { width: 235, align: "center" });
        x += 250;
        if (x > 300) { x = 48; y += 175; if (y > 650) { doc.addPage(); y = 48; } }
      }'''
new='''      let y = doc.y;
      let evidenceIndex = 0;
      for (const photoPath of photoPaths) {
        evidenceIndex += 1;
        const x = photoPaths.length === 1 ? 180 : (evidenceIndex % 2 === 1 ? 48 : 312);
        try { doc.image(photoPath, x, y, { fit: [235, 135], align: "center", valign: "center" }); } catch {}
        doc.font("Helvetica").fontSize(8).text(`Evidencia ${evidenceIndex} – Estado de la herramienta al momento de la baja.`, x, y + 140, { width: 235, align: "center" });
        if (photoPaths.length === 1 || evidenceIndex % 2 === 0) { y += 175; if (y > 650 && evidenceIndex < photoPaths.length) { doc.addPage(); y = 48; } }
      }'''
if old not in s: raise SystemExit('pdf photo block not found')
s=s.replace(old,new)
p.write_text(s)
