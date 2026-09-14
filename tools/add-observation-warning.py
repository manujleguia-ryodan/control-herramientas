from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s=p.read_text()
# Add derived observation summary for the currently selected tool.
needle='''  const selectedTool = availableTools.find((tool) => tool.code === toolId); const selectedPerson = people.find((person) => person.code === personCode); const selectedToolUnavailable = Boolean(selectedTool && loanedCodes.has(selectedTool.code));'''
replacement='''  const selectedTool = availableTools.find((tool) => tool.code === toolId); const selectedPerson = people.find((person) => person.code === personCode); const selectedToolObservations = useMemo(() => { if (!selectedTool) return []; return snapshot.movementLog.filter((row) => row.idTag === selectedTool.code && row.observacion && row.observacion !== "Despacho de herramienta" && row.observacion !== "Recepción de devolución").slice(0, 3); }, [selectedTool, snapshot.movementLog]); const selectedToolUnavailable = Boolean(selectedTool && loanedCodes.has(selectedTool.code));'''
if needle not in s: raise SystemExit('selected tool marker not found')
s=s.replace(needle,replacement)
# Make search text include observations.
s=s.replace('''${row.nombreTrabajador ?? ""} ${row.codigoTrabajador ?? ""} ${user}`.toLowerCase()''','''${row.nombreTrabajador ?? ""} ${row.codigoTrabajador ?? ""} ${row.condicion ?? ""} ${row.observacion ?? ""} ${user}`.toLowerCase()''')
# Movement table: separate observation column.
old='''<th>Fecha</th><th>Movimiento</th><th>Herramienta</th><th>Trabajador</th><th>Responsable</th>'''
new='''<th>Fecha</th><th>Movimiento</th><th>Herramienta</th><th>Trabajador</th><th>Responsable</th><th>Observaciones</th>'''
if old not in s: raise SystemExit('movement header not found')
s=s.replace(old,new,1)
old='''<td>{snapshot.storekeepers.find((user) => user.id === row.userId)?.fullName || `Usuario #${row.userId}`}</td></tr>'''
new='''<td>{snapshot.storekeepers.find((user) => user.id === row.userId)?.fullName || `Usuario #${row.userId}`}</td><td><span className="movement-condition">{row.condicion || "Completa y operativa"}</span><small className="movement-observation">{row.observacion || "Sin observaciones"}</small></td></tr>'''
if old not in s: raise SystemExit('movement row not found')
s=s.replace(old,new,1)
# Warning under tool search, before unavailable alert.
old='''{selectedToolUnavailable && <div className="dispatch-unavailable">⚠️ NO DISPONIBLE: Actualmente en custodia de {unavailableHolder}</div>}<Typeahead disabled={selectedToolUnavailable}'''
new='''{selectedToolObservations.length > 0 && <div className="dispatch-observation-warning"><AlertTriangle size={20} /><div><strong>Esta herramienta tiene observaciones</strong><span>{selectedToolObservations[0]?.observacion}</span><small>Revisa el historial antes de realizar el préstamo.</small></div></div>}{selectedToolUnavailable && <div className="dispatch-unavailable">⚠️ NO DISPONIBLE: Actualmente en custodia de {unavailableHolder}</div>}<Typeahead disabled={selectedToolUnavailable}'''
if old not in s: raise SystemExit('dispatch alert marker not found')
s=s.replace(old,new,1)
# EmptyRow accepts a span so movements align.
s=s.replace('''function EmptyRow({ text }: { text: string }) { return <tr><td colSpan={5}><div className="empty-state">{text}</div></td></tr>; }''','''function EmptyRow({ text, span = 5 }: { text: string; span?: number }) { return <tr><td colSpan={span}><div className="empty-state">{text}</div></td></tr>; }''')
s=s.replace('''<EmptyRow text="Todavía no hay movimientos registrados." />''','''<EmptyRow span={6} text="Todavía no hay movimientos registrados." />''',1)
p.write_text(s)

p=Path('/home/ubuntu/control-herramientas/client/src/index.css')
s=p.read_text()
if '.dispatch-observation-warning{' not in s:
 s += '''\n.dispatch-observation-warning{display:flex;align-items:flex-start;gap:12px;padding:14px 16px;margin:14px 0;background:#fff7ed;border:1px solid #fdba74;border-left:4px solid #f97316;border-radius:10px;color:#9a3412}.dispatch-observation-warning>svg{flex:none;margin-top:1px;color:#ea580c}.dispatch-observation-warning div{display:flex;flex-direction:column;gap:4px}.dispatch-observation-warning strong{font-size:1.05rem;font-weight:800}.dispatch-observation-warning span{font-size:1rem;line-height:1.4}.dispatch-observation-warning small{font-size:.84rem;color:#b45309}.movement-observation{display:block;margin-top:4px;color:#64748b;line-height:1.35;white-space:normal}.movement-condition{display:block;color:#334155;font-weight:700}.table-wrap th:last-child,.table-wrap td:last-child{min-width:220px}@media(max-width:700px){.dispatch-observation-warning strong{font-size:1rem}.dispatch-observation-warning span{font-size:.95rem}}\n'''
 p.write_text(s)
