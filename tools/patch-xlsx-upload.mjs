import fs from 'node:fs';
const p='/home/ubuntu/control-herramientas/server/_core/index.ts'; let s=fs.readFileSync(p,'utf8');
s=s.replace('import multer from "multer";','import multer from "multer";\nimport * as XLSX from "xlsx";');
s=s.replace('const text = req.file.buffer.toString("utf8").replace(/^\\uFEFF/, "");\n      const result = kind === "tools" ? await importToolsCsv(text) : await importPersonalCsv(text);','const isExcel = /\\.xlsx?$/i.test(req.file.originalname) || /spreadsheet|excel/.test(req.file.mimetype);\n      const text = isExcel ? XLSX.utils.sheet_to_csv(XLSX.read(req.file.buffer, { type: "buffer", cellText: true, cellDates: false }).Sheets[XLSX.read(req.file.buffer, { type: "buffer" }).SheetNames[0]]) : req.file.buffer.toString("utf8").replace(/^\\uFEFF/, "");\n      const result = kind === "tools" ? await importToolsCsv(text) : await importPersonalCsv(text);');
s=s.replace('Adjunta un archivo CSV en el campo', 'Adjunta un archivo CSV o Excel (.xlsx) en el campo');
fs.writeFileSync(p,s);
