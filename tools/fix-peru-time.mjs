import fs from 'node:fs';
for (const p of ['/home/ubuntu/control-herramientas/client/src/pages/Home.tsx','/home/ubuntu/control-herramientas/server/db.ts']) {
  let s=fs.readFileSync(p,'utf8');
  s=s.replaceAll('toLocaleString("es-PE")','toLocaleString("es-PE", { timeZone: "America/Lima" })');
  fs.writeFileSync(p,s);
}
