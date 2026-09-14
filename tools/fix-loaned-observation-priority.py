from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s=p.read_text()
old='''const selectedTool = availableTools.find((tool) => tool.code === toolId); const selectedPerson = people.find((person) => person.code === personCode); const selectedToolObservations = useMemo(() => selectedTool?.observacionActiva ? [{ observacion: selectedTool.observacionActiva }] : [], [selectedTool]); const selectedToolUnavailable = Boolean(selectedTool && loanedCodes.has(selectedTool.code)); const unavailableHolder'''
new='''const selectedTool = availableTools.find((tool) => tool.code === toolId); const selectedPerson = people.find((person) => person.code === personCode); const selectedToolUnavailable = Boolean(selectedTool && loanedCodes.has(selectedTool.code)); const selectedToolObservations = useMemo(() => selectedTool && !selectedToolUnavailable && selectedTool.observacionActiva ? [{ observacion: selectedTool.observacionActiva }] : [], [selectedTool, selectedToolUnavailable]); const unavailableHolder'''
if old not in s: raise SystemExit('selected tool state marker not found')
s=s.replace(old,new,1)
# Suppress observation details/status when the item is in custody; custody always has priority.
s=s.replace('''{tool.observacionActiva && <div className="tool-observation-detail"''','''{tool.observacionActiva && !loanedCodes.has(tool.code) && <div className="tool-observation-detail"''',1)
s=s.replace('''(tool.observacionActiva ? "OBSERVACIÓN ACTIVA" : "Disponible")''','''(!loanedCodes.has(tool.code) && tool.observacionActiva ? "OBSERVACIÓN ACTIVA" : "Disponible")''',1)
# Resolution and condition controls are not relevant while the tool is already loaned.
s=s.replace('''{selectedTool?.observacionActiva && <div className="resolve-observation-box">''','''{selectedTool?.observacionActiva && !selectedToolUnavailable && <div className="resolve-observation-box">''',1)
s=s.replace('''{selectedToolObservations.length > 0 && <div className="condition-grid condition-grid-alert">''','''{selectedToolObservations.length > 0 && !selectedToolUnavailable && <div className="condition-grid condition-grid-alert">''',1)
s=s.replace('''(selectedTool?.observacionActiva ? "Resolver observación y entregar" : "Confirmar despacho")''','''(selectedTool?.observacionActiva && !selectedToolUnavailable ? "Resolver observación y entregar" : "Confirmar despacho")''',1)
p.write_text(s)

p=Path('/home/ubuntu/control-herramientas/server/db.ts')
s=p.read_text()
# Keep the active observation in storage for audit, but make the snapshot's user-facing state explicit.
old='''status: tool.estadoActivo ? (activeObservation ? "available_observed" : "available") : "retired", estadoActual: tool.estadoActivo ? (activeObservation ? "Disponible con observación" : tool.estadoActual) : "Fuera de servicio"'''
new='''status: tool.estadoActivo ? (activeObservation ? "available_observed" : "available") : "retired", estadoActual: tool.estadoActivo ? (activeObservation ? "Disponible con observación" : tool.estadoActual) : "Fuera de servicio"'''
# no-op marker intentionally validates expected current schema shape
if old not in s: raise SystemExit('snapshot state marker not found')
p.write_text(s)
