from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s=p.read_text()
old='const [dispatchCondition, setDispatchCondition] = useState("Completa y operativa"); const [dispatchObservation, setDispatchObservation] = useState(""); const [returnModalLoan, setReturnModalLoan] = useState<{ loan: Movement; tool: Tool | null; person: Worker | null } | null>(null); const [returnCondition, setReturnCondition] = useState("Completa y operativa"); const [returnObservation, setReturnObservation] = useState("");'
new='const [dispatchCondition, setDispatchCondition] = useState("Completa y operativa"); const [dispatchObservation, setDispatchObservation] = useState(""); const [returnModalLoan, setReturnModalLoan] = useState<{ loan: Movement; tool: Tool | null; person: Worker | null } | null>(null); const [returnIssueDetected, setReturnIssueDetected] = useState(false); const [returnCondition, setReturnCondition] = useState("Completa y operativa"); const [returnObservation, setReturnObservation] = useState("");'
if old not in s: raise SystemExit('state marker not found')
s=s.replace(old,new,1)
old='const doReturn = async () => { if (!returnModalLoan || (conditionNeedsObservation(returnCondition) && !returnObservation.trim())) return notify("Registra una observación para la condición seleccionada.");'
new='const doReturn = async () => { const effectiveReturnCondition = returnIssueDetected ? returnCondition : "Completa y operativa"; if (!returnModalLoan || (returnIssueDetected && !returnObservation.trim())) return notify("Registra una observación para la condición seleccionada.");'
if old not in s: raise SystemExit('doReturn marker not found')
s=s.replace(old,new,1)
s=s.replace('condicionEntrada: returnCondition as any, observacionEntrada: returnObservation.trim() || undefined','condicionEntrada: effectiveReturnCondition as any, observacionEntrada: returnIssueDetected ? returnObservation.trim() : undefined',1)
s=s.replace('setReturnModalLoan(null); setReturnCondition("Completa y operativa"); setReturnObservation(""); notify("Recepción registrada correctamente")','setReturnModalLoan(null); setReturnIssueDetected(false); setReturnCondition("Completa y operativa"); setReturnObservation(""); notify("Recepción registrada correctamente")',1)
# Hide dispatch details unless a selected tool has an existing observation.
start=s.find('<div className="condition-grid">')
if start < 0: raise SystemExit('dispatch grid start not found')
end=s.find('</div><div className="serial-notice">', start)
if end < 0: raise SystemExit('dispatch grid end not found')
dispatch='''{selectedToolObservations.length > 0 && <div className="condition-grid condition-grid-alert"><label>Condición de salida<select value={dispatchCondition} onChange={(e)=>setDispatchCondition(e.target.value)}><option>Completa y operativa</option><option>Incompleta</option><option>Con pieza faltante</option><option>Con pieza rota</option><option>Dañada</option><option>Requiere revisión</option><option>Otro</option></select></label><label>Observación<textarea rows={2} placeholder="Confirma o amplía la novedad…" value={dispatchObservation} onChange={(e)=>setDispatchObservation(e.target.value)} /></label></div>}'''
s=s[:start]+dispatch+s[end+6:]
# Replace return condition block between its first label and modal actions.
start=s.find('<label>Condición de entrada')
if start < 0: raise SystemExit('return block start not found')
end=s.find('<div className="modal-actions">', start)
if end < 0: raise SystemExit('return block end not found')
return_block='''<label>¿Se recibió incompleta o dañada?<select value={returnIssueDetected ? "si" : "no"} onChange={(e)=>{ const issue=e.target.value === "si"; setReturnIssueDetected(issue); if (!issue) { setReturnCondition("Completa y operativa"); setReturnObservation(""); } }}><option value="no">No, completa y operativa</option><option value="si">Sí, tiene una novedad</option></select></label>{returnIssueDetected && <div className="condition-grid condition-grid-alert"><label>Condición de entrada<select value={returnCondition} onChange={(e)=>setReturnCondition(e.target.value)}><option>Incompleta</option><option>Con pieza faltante</option><option>Con pieza rota</option><option>Dañada</option><option>Requiere revisión</option><option>Otro</option></select></label><label>Observación obligatoria<textarea autoFocus rows={4} required placeholder="Describe la falta, daño o diferencia…" value={returnObservation} onChange={(e)=>setReturnObservation(e.target.value)} /></label></div>}'''
s=s[:start]+return_block+s[end:]
s=s.replace('disabled={returnMutation.isPending || (conditionNeedsObservation(returnCondition) && !returnObservation.trim())}','disabled={returnMutation.isPending || (returnIssueDetected && !returnObservation.trim())}',1)
p.write_text(s)

p=Path('/home/ubuntu/control-herramientas/client/src/index.css')
s=p.read_text()
if '.condition-grid-alert' not in s:
 s += '\n.condition-grid-alert{padding:12px;background:#fff7ed;border:1px solid #fdba74;border-radius:10px}.condition-grid-alert label{color:#9a3412}.condition-grid-alert textarea{min-height:72px}\n'
 p.write_text(s)
