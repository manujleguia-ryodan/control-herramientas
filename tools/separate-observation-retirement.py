from pathlib import Path

p=Path('/home/ubuntu/control-herramientas/server/db.ts')
s=p.read_text()
old='''  const tools = herramientas.map((tool, index) => ({ id: index + 1, code: tool.idTag, name: tool.descripcion, brand: tool.marca, ubicacion: tool.ubicacion, status: tool.estadoActivo ? (tool.estadoActual === "Disponible con observación" ? "available_observed" : "available") : "retired", estadoActual: tool.estadoActual, condicionActual: tool.condicionActual, observacionActiva: tool.observacionActiva, observacionFecha: tool.observacionFecha, observacionUsuario: tool.observacionUsuario, imageUrl: null, locationId: null, rotations: tx.filter((row) => row.idTag === tool.idTag).length, holder: null, holderCode: null, loanStorekeeper: null, daysOut: 0, notes: bajas.find((item) => item.idTag === tool.idTag)?.motivo ?? null, incidentDate: bajas.find((item) => item.idTag === tool.idTag)?.fechaIncidente ?? null, retirementWorker: bajas.find((item) => item.idTag === tool.idTag)?.trabajadorResponsable ?? null, reportPdfName: bajas.find((item) => item.idTag === tool.idTag)?.pdfNombre ?? null }));'''
new='''  const latestIssueByTag = new Map<string, { condicion: string; observacion: string; fecha: number; userId: number }>();
  for (const row of ledger) {
    if (row.tipo === "Entrada" && row.condicion && row.condicion !== "Completa y operativa" && row.observacion) {
      if (!latestIssueByTag.has(row.idTag)) latestIssueByTag.set(row.idTag, { condicion: row.condicion, observacion: row.observacion, fecha: row.fechaMovimiento, userId: row.userId });
    } else if (row.tipo === "Entrada" && row.condicion === "Completa y operativa") {
      latestIssueByTag.delete(row.idTag);
    }
  }
  const tools = herramientas.map((tool, index) => { const fallbackIssue = latestIssueByTag.get(tool.idTag); const activeObservation = tool.observacionActiva ?? fallbackIssue?.observacion ?? null; const currentCondition = tool.observacionActiva ? tool.condicionActual : (fallbackIssue?.condicion ?? tool.condicionActual); return { id: index + 1, code: tool.idTag, name: tool.descripcion, brand: tool.marca, ubicacion: tool.ubicacion, status: tool.estadoActivo ? (activeObservation ? "available_observed" : "available") : "retired", estadoActual: tool.estadoActivo ? (activeObservation ? "Disponible con observación" : tool.estadoActual) : "Fuera de servicio", condicionActual: currentCondition, observacionActiva: activeObservation, observacionFecha: tool.observacionFecha ?? fallbackIssue?.fecha ?? null, observacionUsuario: tool.observacionUsuario ?? fallbackIssue?.userId ?? null, imageUrl: null, locationId: null, rotations: tx.filter((row) => row.idTag === tool.idTag).length, holder: null, holderCode: null, loanStorekeeper: null, daysOut: 0, notes: bajas.find((item) => item.idTag === tool.idTag)?.motivo ?? null, incidentDate: bajas.find((item) => item.idTag === tool.idTag)?.fechaIncidente ?? null, retirementWorker: bajas.find((item) => item.idTag === tool.idTag)?.trabajadorResponsable ?? null, reportPdfName: bajas.find((item) => item.idTag === tool.idTag)?.pdfNombre ?? null }; });'''
if old not in s: raise SystemExit('snapshot tools marker not found')
s=s.replace(old,new,1)
p.write_text(s)

p=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s=p.read_text()
old='''<PageTitle title="Inventario" subtitle="Consulta ubicación, disponibilidad y rotación de cada herramienta." />'''
new='''<PageTitle title="Inventario" subtitle="Consulta ubicación, disponibilidad, observaciones activas y rotación. Las observaciones no dan de baja la herramienta." /><div className="inventory-status-guide"><span className="guide-observation"><i />Observación activa: la herramienta sigue en inventario, pero tiene una novedad registrada.</span><span className="guide-retired"><i />Fuera de servicio: la herramienta está retirada y no se puede prestar.</span></div>'''
if old not in s: raise SystemExit('inventory title marker not found')
s=s.replace(old,new,1)
old='''<em className={tool.observacionActiva ? "tool-status-observed" : ""}>{loanedCodes.has(tool.code) ? "No disponible · Prestada" : (tool.observacionActiva ? "Disponible con observación" : "Disponible")}</em>'''
new='''<em className={tool.observacionActiva ? "tool-status-observed" : ""}>{loanedCodes.has(tool.code) ? "No disponible · Prestada" : (tool.observacionActiva ? "OBSERVACIÓN ACTIVA" : "Disponible")}</em>'''
if old not in s: raise SystemExit('inventory status marker not found')
s=s.replace(old,new,1)
old='''<button className="retire-button" onClick={() => setModalTool(tool)}><ShieldAlert size={15} />Dar de baja</button>'''
new='''<button className="retire-button" onClick={() => setModalTool(tool)}><ShieldAlert size={15} />Dar de baja / Fuera de servicio</button>'''
if old not in s: raise SystemExit('retirement button marker not found')
s=s.replace(old,new,1)
p.write_text(s)

p=Path('/home/ubuntu/control-herramientas/client/src/index.css')
s=p.read_text()
s += '''\n.inventory-status-guide{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0 18px}.inventory-status-guide span{display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border-radius:8px;font-size:13px;font-weight:700}.inventory-status-guide i{display:inline-block;width:11px;height:11px;border-radius:50%}.guide-observation{background:#fef3c7;color:#92400e}.guide-observation i{background:#f59e0b;box-shadow:0 0 0 3px #fde68a}.guide-retired{background:#f1f5f9;color:#475569}.guide-retired i{background:#64748b}.tool-status-observed{background:#fef3c7!important;border:1px solid #f59e0b;padding:5px 8px;border-radius:6px}\n'''
p.write_text(s)
