import fs from 'node:fs';
const p='/home/ubuntu/control-herramientas/client/src/pages/Home.tsx'; let s=fs.readFileSync(p,'utf8');
s=s.replace('</select></label><div className="modal-actions">', '</select></label><label>Usuario de Almacén que registra la baja<input value={me.data!.name ?? ""} readOnly /></label><div className="modal-actions">');
fs.writeFileSync(p,s);
