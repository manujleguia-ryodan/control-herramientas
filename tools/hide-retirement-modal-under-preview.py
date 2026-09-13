from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s=p.read_text()
s=s.replace('{modalTool && <div className="pos-modal-backdrop"><div className="pos-modal">','{modalTool && !reportPreviewOpen && <div className="pos-modal-backdrop"><div className="pos-modal">')
p.write_text(s)
