import ts from 'typescript';
import fs from 'node:fs';
const p='client/src/pages/Home.tsx'; const s=fs.readFileSync(p,'utf8'); const f=ts.createSourceFile(p,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
for(const d of f.parseDiagnostics){ const pos=d.start??0; console.log(d.code, d.messageText, pos, s.slice(Math.max(0,pos-220),pos+420)); }
