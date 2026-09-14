from pathlib import Path
s=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx').read_text()
for marker in ['<label>Condición de entrada','<div className="condition-grid">']:
 i=s.find(marker)
 print('MARKER',marker,'INDEX',i)
 print(repr(s[i:i+900]))
 print()
