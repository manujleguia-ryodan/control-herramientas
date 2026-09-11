import fs from 'node:fs';
import * as XLSX from 'xlsx';
const home='/home/ubuntu/control-herramientas/client/src/pages/Home.tsx';
let h=fs.readFileSync(home,'utf8');
if (!h.includes('Eliminar repuesto')) {
  const start=h.indexOf('{tab === "retired"');
  const end=h.indexOf('{tab === "people"', start);
  if (start < 0 || end < 0) throw new Error('No se encontró la sección Fuera de servicio');
  const section=h.slice(start,end);
  const updated=section.replace('</p></article>)}', '</p>{me.data!.role === "admin" && <button className="pos-danger" disabled={deleteToolMutation.isPending} onClick={() => void deleteTool(tool)}><Trash2 size={15} />Eliminar repuesto</button>}</article>)}');
  if (updated === section) throw new Error('No se encontró el cierre de las tarjetas');
  h=h.slice(0,start)+updated+h.slice(end);
  fs.writeFileSync(home,h);
}
const out='/home/ubuntu/control-herramientas';
const toolsHeaders=['ID_Tag','Descripcion','Marca','Estado_Activo','Ubicacion','Cantidad'];
const peopleHeaders=['Codigo_Trabajador','Nombre_Completo','Marcobre','Tipo'];
function make(name, headers) {
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet([headers]);
  ws['!cols']=headers.map((x)=>({wch:Math.max(18,x.length+3)}));
  XLSX.utils.book_append_sheet(wb,ws,name);
  XLSX.writeFile(wb,`${out}/modelo_${name}.xlsx`);
}
make('herramientas',toolsHeaders);
make('personal',peopleHeaders);
console.log('xlsx models created');
