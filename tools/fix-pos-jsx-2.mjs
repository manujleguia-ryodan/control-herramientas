import fs from 'node:fs';
const p='/home/ubuntu/control-herramientas/client/src/pages/Home.tsx'; let s=fs.readFileSync(p,'utf8');
const a='{me.data!.role === "admin" && <form className="pos-card add-form" onSubmit={addTool}>';
const b='{me.data!.role === "admin" && <div>';
console.log('opening', s.includes(a)); s=s.replace(a,b);
const c='</div></form>}</section>}{tab === "retired"';
const d='</div>}</section>}{tab === "retired"';
console.log('closing', s.includes(c)); s=s.replace(c,d);
fs.writeFileSync(p,s);
