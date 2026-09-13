from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/client/src/index.css')
s=p.read_text()
css='''\n.retired-report-actions{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}.retired-report-actions .pos-secondary{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:42px;padding:9px 12px;font-size:14px}@media(max-width:760px){.retired-report-actions{display:grid}.retired-report-actions .pos-secondary{width:100%}}\n'''
if '.retired-report-actions' not in s: s += css
p.write_text(s)
