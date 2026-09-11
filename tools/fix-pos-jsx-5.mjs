import fs from 'node:fs';
const p='/home/ubuntu/control-herramientas/client/src/pages/Home.tsx'; let s=fs.readFileSync(p,'utf8');
s=s.replace('</button></div></div>}</section>}{tab === "retired"','</button></div></div></div>}</section>}{tab === "retired"');
fs.writeFileSync(p,s);
