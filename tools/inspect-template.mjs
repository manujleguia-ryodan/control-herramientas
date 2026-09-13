import fs from 'node:fs';
import * as XLSX from 'xlsx';
const wb=XLSX.read(fs.readFileSync('server/templates/formato-herramienta-danada.xlsx'),{type:'buffer',cellStyles:true});
const ws=wb.Sheets[wb.SheetNames[0]];
for(const key of Object.keys(ws).filter(k=>!k.startsWith('!')).sort((a,b)=>{const na=Number(a.match(/\d+/)?.[0]||0),nb=Number(b.match(/\d+/)?.[0]||0);return na-nb||a.localeCompare(b)})) console.log(key, JSON.stringify(ws[key].v));
