from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s=p.read_text()
s=s.replace('const [modalTool, setModalTool] = useState<Tool | null>(null); const [retireReason, setRetireReason] = useState("");','const [modalTool, setModalTool] = useState<Tool | null>(null); const [retireReason, setRetireReason] = useState(""); const [reportPreviewOpen, setReportPreviewOpen] = useState(false);')
s=s.replace('const [inventorySearch, setInventorySearch] = useState(""); const [inventoryState', 'const [inventorySearch, setInventorySearch] = useState(""); const [retiredSearch, setRetiredSearch] = useState(""); const [inventoryState')
s=s.replace('const retiredTools = useMemo(() => tools.filter((tool) => tool.status === "retired"), [tools]);', 'const retiredTools = useMemo(() => { const q=retiredSearch.trim().toLowerCase(); return tools.filter((tool) => tool.status === "retired" && (!q || `${tool.code} ${tool.name} ${tool.brand ?? ""} ${tool.ubicacion ?? ""} ${tool.notes ?? ""} ${tool.retirementWorker ?? ""}`.toLowerCase().includes(q))); }, [tools, retiredSearch]);')
old='''  const saveRetire = async () => { if (!modalTool || !retireReason.trim() || !incidentDate || !supervisorCode) return notify("Completa motivo, fecha y supervisor responsable."); setReportPending(true);'''
new='''  const openRetirementPreview = () => { if (!modalTool || !retireReason.trim() || !incidentDate || !supervisorCode) return notify("Completa motivo, fecha y supervisor responsable."); setReportPreviewOpen(true); };
  const saveRetire = async () => { if (!modalTool || !retireReason.trim() || !incidentDate || !supervisorCode) return notify("Completa motivo, fecha y supervisor responsable."); setReportPending(true);'''
if old not in s: raise SystemExit('saveRetire marker not found')
s=s.replace(old,new)
s=s.replace('setModalTool(null); setRetireReason(""); setIncidentDate(""); setSupervisorCode(""); setRetirementPhotos([]); notify("Baja registrada', 'setModalTool(null); setReportPreviewOpen(false); setRetireReason(""); setIncidentDate(""); setSupervisorCode(""); setRetirementPhotos([]); notify("Baja registrada')
# PDF data
s=s.replace('''["Herramienta", tool.descripcion], ["Código", tool.idTag],
      ["Fecha/Hora",''','''["Herramienta", tool.descripcion], ["Código Tag", tool.idTag], ["Marca", tool.marca ?? "No registrada"], ["Ubicación", tool.ubicacion ?? "No registrada"],
      ["Fecha/Hora",''')
# replace retired section opening with filter toolbar
old='<PageTitle title="Fuera de servicio" subtitle="Historial de bajas lógicas. No se eliminan registros." /><div className="tool-grid">{retiredTools.map'
new='<PageTitle title="Fuera de servicio" subtitle="Historial de bajas lógicas. No se eliminan registros." /><div className="retired-filter"><Search size={18} /><input aria-label="Filtrar fuera de servicio" placeholder="Filtrar por código, descripción, marca, ubicación o motivo…" value={retiredSearch} onChange={(e)=>setRetiredSearch(e.target.value)} /><span>{retiredTools.length} resultado(s)</span></div><div className="tool-grid">{retiredTools.map'
if old not in s: raise SystemExit('retired section marker not found')
s=s.replace(old,new)
# modal primary button and insert preview modal before closing app, after existing modal.
old='<button className="pos-danger" disabled={retireReason.trim().length < 3 || !supervisorCode || !incidentDate || reportPending} onClick={() => void saveRetire()}>{reportPending ? "Generando PDF…" : "Confirmar baja y descargar PDF"}</button>'
new='<button className="pos-danger" disabled={retireReason.trim().length < 3 || !supervisorCode || !incidentDate || reportPending} onClick={openRetirementPreview}>{reportPending ? "Preparando…" : "Vista previa del reporte"}</button>'
if old not in s: raise SystemExit('modal button marker not found')
s=s.replace(old,new)
old='</div></div>}</div>;\n}\nfunction LoginScreen'
preview='''</div></div>}{reportPreviewOpen && modalTool && <div className="pos-modal-backdrop"><div className="pos-modal report-preview-modal"><button className="modal-x" onClick={() => setReportPreviewOpen(false)}><X size={18} /></button><div className="modal-kicker"><FileText size={17} />VISTA PREVIA</div><h2>Revisar reporte antes de guardar</h2><p>Verifica los datos. La baja y los archivos PDF/XLSX se generarán solo al confirmar.</p><div className="report-preview-head"><b>{modalTool.code} · {modalTool.name}</b><span>Marca: {modalTool.brand || "No registrada"} · Ubicación: {modalTool.ubicacion || "No registrada"}</span></div><div className="report-preview-event"><strong>Descripción del evento</strong><p>{retireReason}</p></div>{retirementPhotos.length > 0 && <div className="report-preview-photos">{retirementPhotos.map((photo,index)=><figure key={`${photo.name}-${index}`}><img src={URL.createObjectURL(photo)} alt={`Evidencia ${index + 1}`} /><figcaption>Evidencia {index + 1}</figcaption></figure>)}</div>}<div className="modal-actions"><button className="pos-secondary" onClick={() => setReportPreviewOpen(false)}>Volver a editar</button><button className="pos-danger" disabled={reportPending} onClick={() => void saveRetire()}>{reportPending ? "Generando reportes…" : "Confirmar y descargar PDF"}</button></div></div></div>}</div>;\n}\nfunction LoginScreen'''
if old not in s: raise SystemExit('app close marker not found')
s=s.replace(old,preview)
p.write_text(s)
