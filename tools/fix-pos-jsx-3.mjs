import fs from 'node:fs';
const p='/home/ubuntu/control-herramientas/client/src/pages/Home.tsx'; let s=fs.readFileSync(p,'utf8');
s=s.replace('</button></form><div className="pos-card bulk-card">','</button></div><div className="pos-card bulk-card">');
fs.writeFileSync(p,s);
