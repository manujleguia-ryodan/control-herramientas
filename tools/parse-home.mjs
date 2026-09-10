import fs from 'node:fs';
import { parse } from '@babel/parser';
const code = fs.readFileSync('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx', 'utf8');
try {
  parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  console.log('parse ok');
} catch (error) {
  console.error(error.message);
  console.error(error.loc);
  const line = code.split('\n')[error.loc.line - 1] ?? '';
  console.error(line.slice(Math.max(0, error.loc.column - 120), error.loc.column + 160));
}
