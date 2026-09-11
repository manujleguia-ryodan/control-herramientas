import fs from 'node:fs';
const p='/home/ubuntu/control-herramientas/client/src/pages/Home.tsx'; let s=fs.readFileSync(p,'utf8');
s=s.replace('  const retiredTools = useMemo(() => tools.filter((tool) => tool.status === "retired"), [tools]);\n  const loanedCodes', '  const retiredTools = useMemo(() => tools.filter((tool) => tool.status === "retired"), [tools]);\n  const activeLoans = useMemo(() => snapshot.movements.filter((row) => !row.returnedAt), [snapshot.movements]);\n  const loanedCodes');
fs.writeFileSync(p,s);
