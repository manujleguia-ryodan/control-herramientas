import fs from 'node:fs';
const path='/home/ubuntu/control-herramientas/client/src/pages/Home.tsx';
let s=fs.readFileSync(path,'utf8');
s=s.replaceAll('placeholder="Marcobre o contratista"','placeholder="Empresa o contratista"');
s=s.replaceAll('<option>Marcobre</option>','<option value="Marcobre">Personal propio</option>');
s=s.replaceAll('<th>Marcobre</th>','<th>Entidad</th>');
s=s.replaceAll('Sin marcobre','Sin entidad');
fs.writeFileSync(path,s);
