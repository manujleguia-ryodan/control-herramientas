import * as XLSX from 'xlsx';
const sheets = {
  unidades: ['codigo', 'nombre', 'empresa', 'sitio'],
  ubicaciones: ['codigo', 'nombre', 'zona', 'descripcion', 'codigo_unidad', 'foto_url'],
  almaceneros: ['codigo', 'nombre_completo', 'documento', 'telefono', 'contrasena'],
  trabajadores: ['codigo', 'nombre_completo', 'area', 'empresa', 'codigo_unidad'],
  herramientas: ['codigo', 'nombre', 'categoria', 'marca', 'modelo', 'numero_serie', 'cantidad', 'codigo_unidad', 'codigo_ubicacion', 'imagen_url', 'observaciones'],
};
const workbook = XLSX.utils.book_new();
for (const [name, headers] of Object.entries(sheets)) XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([headers]), name);
XLSX.writeFile(workbook, '/home/ubuntu/control-herramientas/plantilla_control_herramientas.xlsx');
console.log('template created');
