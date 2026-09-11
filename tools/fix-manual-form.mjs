import fs from 'node:fs';
const p='/home/ubuntu/control-herramientas/client/src/pages/Home.tsx'; let s=fs.readFileSync(p,'utf8');
s=s.replace('<div><h3><Plus size={17} />Agregar herramienta</h3>', '<div className="pos-card add-form"><h3><Plus size={17} />Agregar herramienta</h3>');
s=s.replace('<button className="pos-primary" disabled={addToolMutation.isPending}>Guardar herramienta</button>', '<button type="button" className="pos-primary" disabled={addToolMutation.isPending} onClick={(event) => void addTool(event as unknown as React.FormEvent)}>{addToolMutation.isPending ? "Guardando…" : "Guardar herramienta"}</button>');
s=s.replace('<div className="brand-mark"><Wrench size={22} /></div>', '<div className="brand-mark"><img src="/icon-inventory.svg" alt="" /></div>');
fs.writeFileSync(p,s);
