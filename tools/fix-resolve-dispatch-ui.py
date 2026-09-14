from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s=p.read_text()
old='''const selectedTool = availableTools.find((tool) => tool.code === toolId); const selectedPerson = people.find((person) => person.code === personCode); const selectedToolObservations = useMemo(() => { if (!selectedTool) return []; return snapshot.movementLog.filter((row) => row.idTag === selectedTool.code && row.observacion && row.observacion !== "Despacho de herramienta" && row.observacion !== "Recepción de devolución").slice(0, 3); }, [selectedTool, snapshot.movementLog]); const selectedToolUnavailable'''
new='''const selectedTool = availableTools.find((tool) => tool.code === toolId); const selectedPerson = people.find((person) => person.code === personCode); const selectedToolObservations = useMemo(() => selectedTool?.observacionActiva ? [{ observacion: selectedTool.observacionActiva }] : [], [selectedTool]); const selectedToolUnavailable'''
if old not in s: raise SystemExit('selected observation marker not found')
s=s.replace(old,new,1)
s=s.replace('''onClear={() => { setToolId(""); setToolQuery(""); setPersonCode(""); setPersonQuery(""); }}''','''onClear={() => { setToolId(""); setToolQuery(""); setPersonCode(""); setPersonQuery(""); setResolutionComment(""); }}''',1)
s=s.replace('''onPick: () => { setToolId(tool.code); setToolQuery(`${tool.code} · ${tool.name}`); setPersonCode(""); setPersonQuery(""); }''','''onPick: () => { setToolId(tool.code); setToolQuery(`${tool.code} · ${tool.name}`); setPersonCode(""); setPersonQuery(""); setResolutionComment(""); }''',1)
p.write_text(s)
