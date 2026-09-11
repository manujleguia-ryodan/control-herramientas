import fs from 'node:fs';
const p='/home/ubuntu/control-herramientas/client/src/pages/Home.tsx'; let s=fs.readFileSync(p,'utf8');
const a='  const loanedCodes = useMemo(() => new Set(activeLoans.map((loan) => tools.find((tool) => tool.id === loan.toolId)?.code).filter(Boolean)), [activeLoans, tools]);';
const b='  const activeLoans = useMemo(() => snapshot.movements.filter((row) => !row.returnedAt), [snapshot.movements]);';
s=s.replace(a+'\n'+b, b+'\n'+a);
s=s.replace('  const activeLoans = useMemo(() => snapshot.movements.filter((row) => !row.returnedAt), [snapshot.movements]);\n  const selectedTool', '  const selectedTool');
fs.writeFileSync(p,s);
