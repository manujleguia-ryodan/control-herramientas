from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s=p.read_text()
old='''<article className="tool-card" key={tool.code}><div className="tool-icon"><Wrench size={22} /></div><div><b>{tool.name}</b><span>{tool.code}{tool.brand ? ` · ${tool.brand}` : ""}</span><span className="tool-location">Ubicación: {tool.ubicacion || "Sin ubicación"}</span>{tool.observacionActiva && <small className="tool-active-observation">⚠️ {tool.observacionActiva}</small>}</div><em>{loanedCodes.has(tool.code) ? "No disponible · Prestada" : (tool.observacionActiva ? "Disponible con observación" : "Disponible")}</em>'''
new='''<article className={`tool-card ${tool.observacionActiva ? "tool-card-has-observation" : ""}`} key={tool.code}><div className="tool-icon"><Wrench size={22} /></div><div className="tool-card-main"><b>{tool.name}</b><span>{tool.code}{tool.brand ? ` · ${tool.brand}` : ""}</span><span className="tool-location">Ubicación: {tool.ubicacion || "Sin ubicación"}</span>{tool.observacionActiva && <div className="tool-observation-detail" role="status"><span className="observation-dot" aria-label="Tiene observación activa" /><div><strong>Con observación activa</strong><small>{tool.observacionActiva}</small></div></div>}</div><em className={tool.observacionActiva ? "tool-status-observed" : ""}>{loanedCodes.has(tool.code) ? "No disponible · Prestada" : (tool.observacionActiva ? "Disponible con observación" : "Disponible")}</em>'''
if old not in s:
 raise SystemExit('inventory card marker not found')
s=s.replace(old,new,1)
p.write_text(s)

p=Path('/home/ubuntu/control-herramientas/client/src/index.css')
s=p.read_text()
s += '''\n/* Indicador de observación activa en inventario */\n.tool-card-has-observation{border:2px solid #f59e0b!important;background:linear-gradient(135deg,#fff 0%,#fffbeb 100%);box-shadow:0 8px 22px rgba(245,158,11,.16)}\n.tool-card-main{min-width:0}.tool-observation-detail{display:flex;align-items:flex-start;gap:8px;margin-top:10px;padding:9px 10px;background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;color:#92400e}.tool-observation-detail strong{display:block;font-size:13px;font-weight:800}.tool-observation-detail small{display:block;margin-top:3px;font-size:13px;line-height:1.35;color:#78350f;white-space:normal}.observation-dot{width:12px;height:12px;flex:none;margin-top:3px;border-radius:999px;background:#f59e0b;box-shadow:0 0 0 4px #fde68a}.tool-status-observed{color:#b45309!important}\n'''
p.write_text(s)
