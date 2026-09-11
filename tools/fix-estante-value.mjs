import fs from 'node:fs';
const path='/home/ubuntu/control-herramientas/client/src/pages/Home.tsx';
let s=fs.readFileSync(path,'utf8');
const start=s.indexOf('value={newTool.ubicacion.match(/Estante');
if(start<0) throw new Error('estante expression not found');
const end=s.indexOf('}', start);
if(end<0) throw new Error('estante expression end not found');
s=s.slice(0,start)+'value={newTool.ubicacion.match(/Estante ([A-L])/)?.[1] ?? ""}'+s.slice(end+1);
fs.writeFileSync(path,s);
