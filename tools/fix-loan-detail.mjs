import fs from 'node:fs';
const p='/home/ubuntu/control-herramientas/client/src/pages/Home.tsx'; let s=fs.readFileSync(p,'utf8');
const fn='  const getLoanDetail = (code: string) => { const loan = activeLoans.find((row) => tools.find((item) => item.id === row.toolId)?.code === code); return loan ? { worker: people.find((person) => person.id === loan.workerId)?.fullName, storekeeper: snapshot.storekeepers.find((user) => user.id === loan.storekeeperId)?.fullName } : null; };\n';
s=s.replace('  const notify = (text: string) =>', fn+'  const notify = (text: string) =>');
const re=/<em>\{loanedCodes\.has\(tool\.code\) \? "No disponible · Prestada" : "Disponible"\}<\/em>\{loanedCodes\.has\(tool\.code\) && <small className="loan-detail">[\s\S]*?<\/small>\}/;
const replacement='<em>{loanedCodes.has(tool.code) ? "No disponible · Prestada" : "Disponible"}</em>{loanedCodes.has(tool.code) && <small className="loan-detail">Trabajador: {getLoanDetail(tool.code)?.worker ?? "—"}<br />Usuario de almacén: {getLoanDetail(tool.code)?.storekeeper ?? "—"}</small>}';
if(!re.test(s)) throw new Error('No se encontró el detalle de préstamo');
s=s.replace(re,replacement);
fs.writeFileSync(p,s);
