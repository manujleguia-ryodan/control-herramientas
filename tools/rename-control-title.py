from pathlib import Path
p = Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s = p.read_text()
s = s.replace('CONTROL POS INTERNO', 'CONTROL DE ALMACÉN')
s = s.replace('CONTROL INTERNO', 'CONTROL DE ALMACÉN')
p.write_text(s)

html = Path('/home/ubuntu/control-herramientas/client/index.html')
if html.exists():
    h = html.read_text().replace('CONTROL POS INTERNO', 'CONTROL DE ALMACÉN')
    html.write_text(h)
