import fs from 'node:fs';
const p='/home/ubuntu/control-herramientas/client/src/pages/Home.tsx'; let s=fs.readFileSync(p,'utf8');
s=s.replace('{me.data!.role === "admin" && <form className="pos-card add-form" onSubmit={addTool}>','{me.data!.role === "admin" && <div>');
s=s.replace('</div></form>}</section>}{tab === "retired"','</div>}</section>}{tab === "retired"');
fs.writeFileSync(p,s);
