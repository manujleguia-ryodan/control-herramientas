from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s=p.read_text()
needle='const downloadMovementPdf = () => { const pdf=new jsPDF({orientation:"landscape"}); pdf.setFontSize(16); pdf.text("Almacén+ · Registro de movimientos", 14, 16); pdf.setFontSize(9); pdf.text(`Rango: ${movementFrom || "inicio"} a ${movementTo || "hoy"}`, 14, 23); let y=32; pdf.setFont("helvetica","bold"); pdf.text("Fecha / Movimiento / Herramienta / Trabajador / Cant. / Responsable", 14, y); pdf.setFont("helvetica","normal"); y+=7; filteredMovements.forEach((row)=>{ const user=snapshot.storekeepers.find((u)=>u.id===row.userId)?.fullName ?? `Usuario #${row.userId}`; const line=`${new Date(row.fechaMovimiento).toLocaleString("es-PE",{timeZone:"America/Lima"})} | ${row.tipo} | ${row.idTag} ${row.descripcionHerramienta ?? ""} | ${row.nombreTrabajador ?? row.codigoTrabajador ?? "-"} | ${user}`; const lines=pdf.splitTextToSize(line,270); if(y>190){pdf.addPage();y=16;} pdf.text(lines,14,y); y+=Math.max(6,lines.length*4); }); pdf.save("reporte-movimientos.pdf"); };'
if needle not in s: raise SystemExit('pdf function exact marker not found')
addition='''\n  const downloadMovementXlsx = async () => { try { const params = new URLSearchParams({ search: movementSearch, from: movementFrom, to: movementTo }); const response = await fetch(`/api/movements/report.xlsx?${params.toString()}`, { credentials: "include" }); if (!response.ok) { const payload = await response.json().catch(() => ({})); throw new Error(payload.message || `Error ${response.status} al generar XLSX.`); } const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "Reporte_Movimientos.xlsx"; link.click(); URL.revokeObjectURL(url); notify("Reporte de movimientos XLSX descargado correctamente"); } catch (error) { notify(error instanceof Error ? error.message : "No se pudo generar el reporte XLSX."); } };'''
s=s.replace(needle,needle+addition)
old='<button className="pos-primary" onClick={downloadMovementPdf}><Download size={15}/>Descargar Reporte (PDF)</button>'
new='<div className="movement-report-actions"><button className="pos-primary" onClick={downloadMovementPdf}><FileText size={15}/>Descargar Reporte (PDF)</button><button className="pos-secondary" onClick={() => void downloadMovementXlsx()}><Download size={15}/>Descargar Reporte (Excel XLSX)</button></div>'
if old not in s: raise SystemExit('toolbar button marker not found')
s=s.replace(old,new)
p.write_text(s)

p=Path('/home/ubuntu/control-herramientas/client/src/index.css')
s=p.read_text()
if '.movement-report-actions{' not in s: s += '\n.movement-report-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.movement-report-actions .button{white-space:nowrap}@media(max-width:700px){.movement-report-actions{width:100%;flex-direction:column}.movement-report-actions button{width:100%}}\n'
p.write_text(s)
