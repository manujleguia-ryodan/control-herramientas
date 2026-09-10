import ts from 'typescript';
import fs from 'node:fs';
const file = '/home/ubuntu/control-herramientas/client/src/pages/Home.tsx';
const code = fs.readFileSync(file, 'utf8');
const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
for (const diagnostic of source.parseDiagnostics) {
  const start = diagnostic.start ?? 0;
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
  console.log(message, `line ${source.getLineAndCharacterOfPosition(start).line + 1}`, `column ${source.getLineAndCharacterOfPosition(start).character + 1}`, JSON.stringify(code.slice(start, start + 80)));
}
