from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/server/db.ts')
s=p.read_text()
s=s.replace('''    { header: "Fecha y hora", key: "fecha", width: 23 }, { header: "Movimiento", key: "tipo", width: 15 },
    { header: "ID_Tag", key: "idTag", width: 18 }, { header: "Herramienta", key: "herramienta", width: 32 },''','''    { header: "Fecha y hora", key: "fecha", width: 23 }, { header: "Movimiento", key: "tipo", width: 15 }, { header: "Condición", key: "condicion", width: 24 },
    { header: "ID_Tag", key: "idTag", width: 18 }, { header: "Herramienta", key: "herramienta", width: 32 },''')
s=s.replace('ws.mergeCells("A1:H2")','ws.mergeCells("A1:I2")')
s=s.replace('ws.mergeCells("A3:H3")','ws.mergeCells("A3:I3")')
s=s.replace('ws.mergeCells("A4:H4")','ws.mergeCells("A4:I4")')
s=s.replace('''headerRow.values = ["Fecha y hora", "Movimiento", "ID_Tag", "Herramienta", "Código trabajador", "Trabajador", "Usuario de almacén", "Observación"];''','''headerRow.values = ["Fecha y hora", "Movimiento", "Condición", "ID_Tag", "Herramienta", "Código trabajador", "Trabajador", "Usuario de almacén", "Observación"];''')
s=s.replace('''new Date(row.fechaMovimiento).toLocaleString("es-PE", { timeZone: "America/Lima" }), row.tipo, row.idTag, tool?.descripcion ?? "", row.codigoTrabajador ?? "", person?.nombreCompleto ?? "", user, row.observacion ?? ""''','''new Date(row.fechaMovimiento).toLocaleString("es-PE", { timeZone: "America/Lima" }), row.tipo, row.condicion ?? "Completa y operativa", row.idTag, tool?.descripcion ?? "", row.codigoTrabajador ?? "", person?.nombreCompleto ?? "", user, row.observacion ?? ""''')
s=s.replace('ws.autoFilter = { from: "A6", to: "H6" };','ws.autoFilter = { from: "A6", to: "I6" };')
p.write_text(s)
