import ExcelJS from 'exceljs';
const template='server/templates/formato-herramienta-danada.xlsx';
const output='/tmp/reporte-formato-exacto.xlsx';
const wb=new ExcelJS.Workbook(); await wb.xlsx.readFile(template);
const ws=wb.worksheets[0];
ws.unMergeCells('A17:I30'); ws.mergeCells('A17:D30'); ws.mergeCells('E17:I30');
ws.getCell('A16').value='2.DESCRIPCIÓN DEL EVENTO :';
ws.getCell('A17').value='Descripción exacta ingresada por el almacenero: equipo dañado durante la operación.';
ws.getCell('E16').value='EVIDENCIAS FOTOGRÁFICAS';
for (let i=0;i<3;i++) { const id=wb.addImage({filename:'server/templates/logo-marcobre.png',extension:'png'}); ws.addImage(id,{tl:{col:i%2===0?4:6,row:16+Math.floor(i/2)*7},ext:{width:125,height:82}}); }
await wb.xlsx.writeFile(output);
const check=new ExcelJS.Workbook(); await check.xlsx.readFile(output);
const merges=check.worksheets[0].model.merges;
if (!merges.includes('A17:D30') || !merges.includes('E17:I30')) throw new Error('No se conservaron las áreas izquierda/derecha');
if (check.worksheets[0].getCell('A17').value !== 'Descripción exacta ingresada por el almacenero: equipo dañado durante la operación.') throw new Error('Descripción no conservada');
console.log(`OK: formato exacto; fotos embebidas=${check.media.length}; bloques=${merges.filter(x=>x==='A17:D30'||x==='E17:I30').join(',')}`);
