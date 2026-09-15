from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s=p.read_text()
s=s.replace('    if (bulkMode === "review") return notify("Revisa cada herramienta seleccionada y confirma que todas llegaron completas y operativas.");\n','',1)
p.write_text(s)
