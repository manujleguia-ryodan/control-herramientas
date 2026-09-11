import fs from 'node:fs';
const p='/home/ubuntu/control-herramientas/server/db.ts'; let s=fs.readFileSync(p,'utf8');
s=s.replace('stats: { ...emptyStats(), totalStock: totalTools: tools.length, totalMovements: movements.length }','stats: { ...emptyStats(), totalTools: tools.length, totalMovements: movements.length }');
fs.writeFileSync(p,s);
