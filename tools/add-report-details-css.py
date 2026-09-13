from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/server/db.ts')
s=p.read_text()
old='''["Herramienta", tool.descripcion], ["Código", tool.idTag],
      ["Fecha/Hora",'''
new='''["Herramienta", tool.descripcion], ["Código Tag", tool.idTag], ["Marca", tool.marca ?? "No registrada"], ["Ubicación", tool.ubicacion ?? "No registrada"],
      ["Fecha/Hora",'''
if old not in s: raise SystemExit('PDF details marker not found')
p.write_text(s.replace(old,new))

p=Path('/home/ubuntu/control-herramientas/client/src/index.css')
s=p.read_text()
css='''\n.retired-filter{display:flex;align-items:center;gap:10px;padding:12px 14px;margin:0 0 16px;background:#fff;border:1px solid var(--line);border-radius:12px;color:var(--ink-muted)}.retired-filter input{flex:1;min-width:0;height:38px;padding:0 10px;color:var(--ink);background:#fafbfc;border:0;outline:0;font-size:14px}.retired-filter span{font-size:12px;white-space:nowrap}.report-preview-modal{width:min(760px,100%)}.report-preview-head{display:flex;flex-direction:column;gap:6px;padding:13px 15px;margin:16px 0;background:#fff8f4;border-left:3px solid var(--orange);border-radius:8px}.report-preview-head b{font-size:16px;color:var(--ink)}.report-preview-head span{font-size:13px;color:var(--ink-soft)}.report-preview-event{padding:15px;margin-bottom:16px;background:#fafbfc;border:1px solid var(--line);border-radius:9px}.report-preview-event strong{font-size:14px}.report-preview-event p{margin:8px 0 0;white-space:pre-wrap;color:var(--ink-soft);font-size:14px;line-height:1.55}.report-preview-photos{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:16px 0}.report-preview-photos figure{margin:0}.report-preview-photos img{display:block;width:100%;height:92px;object-fit:cover;border-radius:7px;border:1px solid var(--line)}.report-preview-photos figcaption{margin-top:5px;color:var(--ink-muted);font-size:11px;text-align:center}@media(max-width:700px){.report-preview-photos{grid-template-columns:repeat(2,minmax(0,1fr))}.retired-filter{align-items:stretch}.retired-filter input{font-size:13px}.retired-filter span{align-self:center}}\n'''
if '.retired-filter{' not in s: s+=css
p.write_text(s)
