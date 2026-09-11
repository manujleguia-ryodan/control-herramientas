import fs from 'node:fs';
const files = [
  'drizzle/schema.ts',
  'server/db.ts',
  'server/routers.ts',
  'client/src/pages/Home.tsx',
];
for (const file of files) {
  const path = `/home/ubuntu/control-herramientas/${file}`;
  let s = fs.readFileSync(path, 'utf8');
  s = s.replaceAll('Empresa', 'Marcobre').replaceAll('empresa', 'marcobre').replaceAll('Company', 'Marcobre').replaceAll('company', 'marcobre');
  fs.writeFileSync(path, s);
}
