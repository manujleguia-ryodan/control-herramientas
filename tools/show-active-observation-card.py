from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s=p.read_text()
old='''<span className="tool-location">Ubicación: {tool.ubicacion || "Sin ubicación"}</span></div><em>{loanedCodes.has(tool.code) ? "No disponible · Prestada" : "Disponible"}</em>'''
new='''<span className="tool-location">Ubicación: {tool.ubicacion || "Sin ubicación"}</span>{tool.observacionActiva && <small className="tool-active-observation">⚠️ {tool.observacionActiva}</small>}</div><em>{loanedCodes.has(tool.code) ? "No disponible · Prestada" : (tool.observacionActiva ? "Disponible con observación" : "Disponible")}</em>'''
if old not in s: raise SystemExit('inventory card marker not found')
s=s.replace(old,new,1)
p.write_text(s)
