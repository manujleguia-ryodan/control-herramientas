import fs from 'node:fs';
const p='/home/ubuntu/control-herramientas/client/src/pages/Home.tsx'; let s=fs.readFileSync(p,'utf8');
s=s.replaceAll('accept=".csv,text/csv"','accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"');
s=s.replaceAll('Importar Herramientas (CSV)','Importar Herramientas (CSV/XLSX)');
s=s.replaceAll('Importar Personal (CSV)','Importar Personal (CSV/XLSX)');
fs.writeFileSync(p,s);
