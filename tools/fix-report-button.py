from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s=p.read_text()
s=s.replace('disabled={retireReason.trim().length < 3 || !supervisorCode || !incidentDate || retireMutation.isPending}', 'disabled={retireReason.trim().length < 3 || !supervisorCode || !incidentDate || reportPending}')
s=s.replace('{retireMutation.isPending ? "Guardando…" : "Confirmar baja"}', '{reportPending ? "Generando PDF…" : "Confirmar baja y descargar PDF"}')
p.write_text(s)
