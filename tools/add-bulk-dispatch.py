from pathlib import Path

# Backend bulk dispatch, atomic and independently logged per ID_Tag.
p=Path('/home/ubuntu/control-herramientas/server/db.ts')
s=p.read_text()
marker='export type BulkReturnItem = { movementId: number; idTag: string };'
insert='''export async function dispatchTransactionsBulk(idTags: string[], codigoTrabajador: string, userEntrega: number) {
  if (!idTags.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Selecciona al menos una herramienta para prestar." });
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.transaction(async (tx) => {
    const worker = (await tx.select().from(catalogoPersonal).where(eq(catalogoPersonal.codigoTrabajador, codigoTrabajador)).limit(1))[0];
    if (!worker) throw new TRPCError({ code: "NOT_FOUND", message: "El trabajador no existe." });
    const fecha = peruNow(); const transactionIds: number[] = [];
    for (const idTag of [...new Set(idTags)]) {
      const tool = (await tx.select().from(catalogoHerramientas).where(eq(catalogoHerramientas.idTag, idTag)).limit(1))[0];
      if (!tool || !tool.estadoActivo) throw new TRPCError({ code: "NOT_FOUND", message: `Herramienta no encontrada o fuera de servicio: ${idTag}` });
      const activeLoan = (await tx.select({ codigoTrabajador: transacciones.codigoTrabajador, nombreTrabajador: transacciones.nombreTrabajador }).from(transacciones).where(and(eq(transacciones.idTag, idTag), isNull(transacciones.fechaRetorno))).limit(1))[0];
      if (activeLoan) throw new TRPCError({ code: "CONFLICT", message: `La herramienta ${idTag} no está disponible. Actualmente está prestada a ${activeLoan.nombreTrabajador || activeLoan.codigoTrabajador}` });
      const inserted = await tx.insert(transacciones).values({ idTag: tool.idTag, codigoTrabajador: worker.codigoTrabajador, userEntrega, fechaSalida: fecha, descripcionHerramienta: tool.descripcion, nombreTrabajador: worker.nombreCompleto, marcobreTrabajador: worker.marcobre, estado: "Prestada" });
      const transactionId = Number(inserted[0].insertId); transactionIds.push(transactionId);
      await tx.insert(movimientos).values({ tipo: "Salida", idTag: tool.idTag, codigoTrabajador: worker.codigoTrabajador, userId: userEntrega, fechaMovimiento: fecha, transaccionId: transactionId, descripcionHerramienta: tool.descripcion, nombreTrabajador: worker.nombreCompleto, observacion: "Despacho masivo de herramienta" });
    }
    return { success: true, count: transactionIds.length, transactionIds } as const;
  });
}

'''
if marker not in s: raise SystemExit('db marker missing')
s=s.replace(marker,insert+marker,1)
p.write_text(s)

p=Path('/home/ubuntu/control-herramientas/server/routers.ts')
s=p.read_text()
s=s.replace('dispatchTransaction, getCatalogSnapshot,', 'dispatchTransaction, dispatchTransactionsBulk, getCatalogSnapshot,',1)
old='''dispatch: protectedProcedure.input(z.object({ idTag: z.string(), codigoTrabajador: z.string(), userEntrega: z.number().int().positive(), })).mutation(({ input }) => dispatchTransaction(input)), return:''' 
new='''dispatch: protectedProcedure.input(z.object({ idTag: z.string(), codigoTrabajador: z.string(), userEntrega: z.number().int().positive(), })).mutation(({ input }) => dispatchTransaction(input)), dispatchBulk: protectedProcedure.input(z.object({ idTags: z.array(z.string().trim().min(1)).min(1).max(100), codigoTrabajador: z.string().trim().min(1), userEntrega: z.number().int().positive() })).mutation(({ input }) => dispatchTransactionsBulk(input.idTags, input.codigoTrabajador, input.userEntrega)), return:'''
if old not in s: raise SystemExit('router marker missing')
s=s.replace(old,new,1)
p.write_text(s)

p=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s=p.read_text()
s=s.replace('const dispatchMutation = trpc.movements.dispatch.useMutation({ onSuccess: () => void utils.catalog.snapshot.invalidate() });','const dispatchMutation = trpc.movements.dispatch.useMutation({ onSuccess: () => void utils.catalog.snapshot.invalidate() });\n  const bulkDispatchMutation = trpc.movements.dispatchBulk.useMutation({ onSuccess: () => void utils.catalog.snapshot.invalidate() });',1)
s=s.replace('const [toolQuery, setToolQuery] = useState(""); const [personQuery, setPersonQuery] = useState(""); const [toolId, setToolId] = useState(""); const [personCode, setPersonCode] = useState("");','const [toolQuery, setToolQuery] = useState(""); const [personQuery, setPersonQuery] = useState(""); const [toolId, setToolId] = useState(""); const [selectedToolCodes, setSelectedToolCodes] = useState<string[]>([]); const [personCode, setPersonCode] = useState("");',1)
s=s.replace('const selectedTool = availableTools.find((tool) => tool.code === toolId); const selectedPerson = people.find((person) => person.code === personCode); const selectedToolUnavailable = Boolean(selectedTool && loanedCodes.has(selectedTool.code)); const unavailableHolder = selectedTool ? people.find((person) => person.id === activeLoans.find((row) => tools.find((item) => item.id === row.toolId)?.code === selectedTool.code)?.workerId)?.fullName ?? "un trabajador" : "un trabajador";','const selectedTool = availableTools.find((tool) => tool.code === toolId); const selectedTools = availableTools.filter((tool) => selectedToolCodes.includes(tool.code)); const selectedPerson = people.find((person) => person.code === personCode);',1)
old='''const doDispatch = async () => { if (!selectedTool || !selectedPerson) return notify("Selecciona una herramienta y una persona de las sugerencias."); try { await dispatchMutation.mutateAsync({ idTag: selectedTool.code, codigoTrabajador: selectedPerson.code, userEntrega: me.data!.id }); setToolQuery(""); setPersonQuery(""); setToolId(""); setPersonCode(""); notify("Despacho registrado correctamente"); } catch (error) { notify(error instanceof Error ? error.message : "No se pudo registrar el despacho."); } };'''
new='''const doDispatch = async () => { if (!selectedPerson || !selectedToolCodes.length) return notify("Selecciona primero el trabajador y al menos una herramienta."); try { await bulkDispatchMutation.mutateAsync({ idTags: selectedToolCodes, codigoTrabajador: selectedPerson.code, userEntrega: me.data!.id }); setToolQuery(""); setPersonQuery(""); setToolId(""); setSelectedToolCodes([]); setPersonCode(""); notify(`${selectedToolCodes.length} herramienta(s) prestada(s) correctamente`); } catch (error) { notify(error instanceof Error ? error.message : "No se pudo registrar el despacho masivo."); } };'''
if old not in s: raise SystemExit('dispatch handler missing')
s=s.replace(old,new,1)
start=s.find('{tab === "dispatch"')
end=s.find('{tab === "active"',start)
if start<0 or end<0: raise SystemExit('dispatch JSX boundaries missing')
new_jsx='''{tab === "dispatch" && <section><PageTitle title="Despacho rápido" subtitle="Selecciona primero al trabajador y luego una o varias herramientas." /><div className="pos-card dispatch-card"><Typeahead label="1. Trabajador que recibe" placeholder="Buscar por código o nombre" value={personQuery} setValue={setPersonQuery} selected={selectedPerson ? `${selectedPerson.code} · ${selectedPerson.fullName}` : ""} onClear={() => { setPersonCode(""); setPersonQuery(""); setSelectedToolCodes([]); setToolQuery(""); }} suggestions={personMatches.map((person) => ({ key: person.code, label: `${person.code} · ${person.fullName}`, sub: `${person.marcobre ?? "Sin entidad"} · ${person.area ?? "Sin tipo"}`, onPick: () => { setPersonCode(person.code); setPersonQuery(`${person.code} · ${person.fullName}`); setSelectedToolCodes([]); setToolQuery(""); } }))} />{selectedPerson && <div className="bulk-dispatch-tools"><label className="bulk-tool-label">2. Herramientas a prestar</label><div className="search-box"><Search size={17} /><input value={toolQuery} placeholder="Buscar código o nombre de herramienta" onChange={(e) => setToolQuery(e.target.value)} /><button type="button" onClick={() => setToolQuery("")}><X size={15} /></button></div>{toolQuery && <div className="suggestions">{toolMatches.length ? toolMatches.map((tool) => { const alreadySelected = selectedToolCodes.includes(tool.code); const unavailable = loanedCodes.has(tool.code); return <button type="button" key={tool.code} disabled={unavailable || alreadySelected} onClick={() => { setSelectedToolCodes((current) => [...current, tool.code]); setToolQuery(""); }}><b>{tool.code} · {tool.name}</b><small>{unavailable ? "No disponible · Prestada" : alreadySelected ? "Ya seleccionada" : (tool.brand ?? "Sin marca")}</small></button>; }) : <span>No hay coincidencias</span>}</div>}<div className="selected-tool-list">{selectedTools.map((tool) => <div className="selected-tool-chip" key={tool.code}><span><b>{tool.code}</b> · {tool.name}</span><button type="button" aria-label={`Quitar ${tool.code}`} onClick={() => setSelectedToolCodes((current) => current.filter((code) => code !== tool.code))}><X size={14} /></button></div>)}</div><div className="serial-notice"><Check size={16} /><span>{selectedToolCodes.length ? `${selectedToolCodes.length} unidad(es) seleccionada(s). Cada ID_Tag se registrará por separado.` : "Puedes seleccionar varias herramientas para el mismo trabajador."}</span></div></div>}<div className="dispatch-summary"><Check size={18} /><span>Entrega realizada por <b>{me.data!.name}</b></span></div><button className="pos-primary" disabled={!selectedPerson || !selectedToolCodes.length || bulkDispatchMutation.isPending} onClick={() => void doDispatch()}><ArrowUpFromLine size={18} />{bulkDispatchMutation.isPending ? "Registrando…" : "Confirmar despacho"}</button></div></section>}'''
s=s[:start]+new_jsx+s[end:]
p.write_text(s)

p=Path('/home/ubuntu/control-herramientas/client/src/index.css')
s=p.read_text()+'''\n.bulk-dispatch-tools { padding:15px; margin-top:14px; background:#fafafa; border:1px solid var(--line); border-radius:11px; }\n.bulk-tool-label { display:block; margin-bottom:8px; color:var(--ink); font-size:12px; font-weight:800; }\n.selected-tool-list { display:grid; gap:7px; margin-top:10px; }\n.selected-tool-chip { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:9px 10px; color:#126b65; background:#e5f6f3; border:1px solid #b9e4df; border-radius:8px; font-size:12px; }\n.selected-tool-chip button { display:grid; place-items:center; color:#126b65; background:transparent; }\n'''
p.write_text(s)
