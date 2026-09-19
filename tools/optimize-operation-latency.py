from pathlib import Path

p=Path('/home/ubuntu/control-herramientas/server/db.ts')
s=p.read_text()
old='''  const tools = herramientas.map((tool, index) => ({ id: index + 1, code: tool.idTag, name: tool.descripcion, brand: tool.marca, ubicacion: tool.ubicacion, status: tool.estadoActivo ? "available" : "retired", imageUrl: null, locationId: null, rotations: tx.filter((row) => row.idTag === tool.idTag).length, holder: null, holderCode: null, loanStorekeeper: null, daysOut: 0, notes: bajas.find((item) => item.idTag === tool.idTag)?.motivo ?? null, incidentDate: bajas.find((item) => item.idTag === tool.idTag)?.fechaIncidente ?? null, retirementWorker: bajas.find((item) => item.idTag === tool.idTag)?.trabajadorResponsable ?? null, reportPdfName: bajas.find((item) => item.idTag === tool.idTag)?.pdfNombre ?? null }));
  const workers = personal.map((row, index) => ({ id: index + 1, code: row.codigoTrabajador, fullName: row.nombreCompleto, marcobre: row.marcobre, area: row.tipo, unitId: null }));
  const movements = tx.map((row) => ({ id: row.id, toolId: tools.find((tool) => tool.code === row.idTag)?.id ?? 0, workerId: workers.find((worker) => worker.code === row.codigoTrabajador)?.id ?? 0, storekeeperId: row.userEntrega, type: "dispatch" as const, occurredAt: row.fechaSalida, returnedAt: row.fechaRetorno, receiverId: row.userRecibe, note: row.fechaRetorno ? `Retornada el ${new Date(row.fechaRetorno).toLocaleString("es-PE", { timeZone: "America/Lima" })}` : null }));'''
new='''  const txByTag = new Map<string, number>(); for (const row of tx) txByTag.set(row.idTag, (txByTag.get(row.idTag) ?? 0) + 1);
  const bajaByTag = new Map<string, typeof bajas[number]>(); for (const row of bajas) if (!bajaByTag.has(row.idTag)) bajaByTag.set(row.idTag, row);
  const tools = herramientas.map((tool, index) => { const baja = bajaByTag.get(tool.idTag); return { id: index + 1, code: tool.idTag, name: tool.descripcion, brand: tool.marca, ubicacion: tool.ubicacion, status: tool.estadoActivo ? "available" : "retired", imageUrl: null, locationId: null, rotations: txByTag.get(tool.idTag) ?? 0, holder: null, holderCode: null, loanStorekeeper: null, daysOut: 0, notes: baja?.motivo ?? null, incidentDate: baja?.fechaIncidente ?? null, retirementWorker: baja?.trabajadorResponsable ?? null, reportPdfName: baja?.pdfNombre ?? null }; });
  const workers = personal.map((row, index) => ({ id: index + 1, code: row.codigoTrabajador, fullName: row.nombreCompleto, marcobre: row.marcobre, area: row.tipo, unitId: null }));
  const toolIdByCode = new Map(tools.map((tool) => [tool.code, tool.id])); const workerIdByCode = new Map(workers.map((worker) => [worker.code, worker.id]));
  const movements = tx.map((row) => ({ id: row.id, toolId: toolIdByCode.get(row.idTag) ?? 0, workerId: workerIdByCode.get(row.codigoTrabajador) ?? 0, storekeeperId: row.userEntrega, type: "dispatch" as const, occurredAt: row.fechaSalida, returnedAt: row.fechaRetorno, receiverId: row.userRecibe, note: row.fechaRetorno ? `Retornada el ${new Date(row.fechaRetorno).toLocaleString("es-PE", { timeZone: "America/Lima" })}` : null }));'''
if old not in s: raise SystemExit('snapshot block missing')
s=s.replace(old,new,1)
p.write_text(s)

p=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s=p.read_text()
s=s.replace('const snapshotQuery = trpc.catalog.snapshot.useQuery(undefined, { enabled: Boolean(me.data), retry: false });','const snapshotQuery = trpc.catalog.snapshot.useQuery(undefined, { enabled: Boolean(me.data), retry: false, staleTime: 15000, refetchOnWindowFocus: false });',1)
s=s.replace('const toolSearchQuery = trpc.catalog.searchTools.useQuery({ query: debouncedToolQuery }, { enabled: Boolean(me.data) && Boolean(debouncedToolQuery), retry: false });','const toolSearchQuery = trpc.catalog.searchTools.useQuery({ query: debouncedToolQuery }, { enabled: Boolean(me.data) && debouncedToolQuery.length >= 2, retry: false, staleTime: 30000, refetchOnWindowFocus: false, placeholderData: (previous) => previous });',1)
s=s.replace('setTimeout(() => setDebouncedToolQuery(toolQuery.trim()), 300)','setTimeout(() => setDebouncedToolQuery(toolQuery.trim()), 150)',1)
p.write_text(s)
