import fs from 'node:fs';
const path = '/home/ubuntu/control-herramientas/client/src/pages/Home.tsx';
let s = fs.readFileSync(path, 'utf8').replaceAll('me.data.id', 'me.data!.id').replaceAll('me.data.name', 'me.data!.name');
fs.writeFileSync(path, s);
