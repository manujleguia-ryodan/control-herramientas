from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/server/db.ts')
s=p.read_text()
old='observacion: activeObservation ? `Resolución: ${input.comentarioResolucion!.trim()} · ${observacionSalida}` : observacionSalida'
new='observacion: activeObservation ? `Resolución: ${input.comentarioResolucion!.trim()}${observacionSalida ? ` · ${observacionSalida}` : ""}` : observacionSalida'
if old not in s: raise SystemExit('resolution note marker not found')
p.write_text(s.replace(old,new,1))
