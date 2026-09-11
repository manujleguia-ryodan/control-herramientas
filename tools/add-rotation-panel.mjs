import fs from 'node:fs';
const p='/home/ubuntu/control-herramientas/client/src/pages/Home.tsx'; let s=fs.readFileSync(p,'utf8');
s=s.replace('  const filteredMovements = useMemo(() =>', '  const rotationRanking = useMemo(() => [...activeTools].sort((a,b)=>b.rotations-a.rotations).slice(0,5), [activeTools]);\n  const filteredMovements = useMemo(() =>');
s=s.replace('<PageTitle title="Inventario activo" subtitle="Activos serializados: 1 Tag representa una unidad física." /><div className="inventory-toolbar">', '<PageTitle title="Inventario activo" subtitle="Activos serializados: 1 Tag representa una unidad física." /><div className="rotation-panel"><div><b>Mayor rotación</b><span>Préstamos acumulados por herramienta</span></div>{rotationRanking.length ? rotationRanking.map((tool)=><span key={tool.code}><strong>{tool.rotations}</strong> {tool.name}</span>) : <em>Aún no hay movimientos.</em>}</div><div className="inventory-toolbar">');
fs.writeFileSync(p,s);
