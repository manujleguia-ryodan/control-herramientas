from pathlib import Path

# Backend: one transaction, one update and ledger entry per selected loan.
p = Path('/home/ubuntu/control-herramientas/server/db.ts')
s = p.read_text()
marker = '''export async function returnTransaction(idTag: string, userRecibe: number, movementId?: number) {'''
insert = '''export type BulkReturnItem = { movementId: number; idTag: string };

export async function returnTransactionsBulk(items: BulkReturnItem[], userRecibe: number) {
  if (!items.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Selecciona al menos una herramienta para devolver." });
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.transaction(async (tx) => {
    const fechaEntrada = peruNow();
    const returned: number[] = [];
    for (const item of items) {
      const open = (await tx.select().from(transacciones).where(and(eq(transacciones.id, item.movementId), eq(transacciones.idTag, item.idTag), isNull(transacciones.fechaRetorno))).limit(1))[0];
      if (!open) throw new TRPCError({ code: "CONFLICT", message: `El préstamo de ${item.idTag} ya no está activo o cambió mientras se procesaba.` });
      await tx.update(transacciones).set({ userRecibe, fechaRetorno: fechaEntrada, estado: "Devuelto" }).where(eq(transacciones.id, open.id));
      await tx.insert(movimientos).values({ tipo: "Entrada", idTag: open.idTag, codigoTrabajador: open.codigoTrabajador, userId: userRecibe, fechaMovimiento: fechaEntrada, transaccionId: open.id, descripcionHerramienta: open.descripcionHerramienta, nombreTrabajador: open.nombreTrabajador, observacion: "Recepción masiva: completa y operativa" });
      returned.push(open.id);
    }
    return { success: true, count: returned.length, movementIds: returned } as const;
  });
}

'''
if marker not in s: raise SystemExit('backend marker missing')
s = s.replace(marker, insert + marker, 1)
p.write_text(s)

p = Path('/home/ubuntu/control-herramientas/server/routers.ts')
s = p.read_text()
s = s.replace('dispatchTransaction, getCatalogSnapshot,', 'dispatchTransaction, getCatalogSnapshot,', 1)
s = s.replace('returnTransaction, searchTools }', 'returnTransaction, returnTransactionsBulk, searchTools }', 1)
old = '''return: protectedProcedure.input(z.object({ idTag: z.string(), userRecibe: z.number().int().positive(), movementId: z.number().int().positive().optional() })).mutation(({ input }) => returnTransaction(input.idTag, input.userRecibe, input.movementId)) })'''
new = '''return: protectedProcedure.input(z.object({ idTag: z.string(), userRecibe: z.number().int().positive(), movementId: z.number().int().positive().optional() })).mutation(({ input }) => returnTransaction(input.idTag, input.userRecibe, input.movementId)), returnBulk: protectedProcedure.input(z.object({ userRecibe: z.number().int().positive(), items: z.array(z.object({ movementId: z.number().int().positive(), idTag: z.string().trim().min(1) })).min(1).max(100) })).mutation(({ input }) => returnTransactionsBulk(input.items, input.userRecibe)) })'''
if old not in s: raise SystemExit('router marker missing')
s = s.replace(old, new, 1)
p.write_text(s)

# Frontend: state, mutation, handler, and active-loans panel.
p = Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s = p.read_text()
s = s.replace('const returnMutation = trpc.movements.return.useMutation({ onSuccess: () => void utils.catalog.snapshot.invalidate() });', 'const returnMutation = trpc.movements.return.useMutation({ onSuccess: () => void utils.catalog.snapshot.invalidate() });\n  const bulkReturnMutation = trpc.movements.returnBulk.useMutation({ onSuccess: () => void utils.catalog.snapshot.invalidate() });', 1)
s = s.replace('const [modalTool, setModalTool] = useState<Tool | null>(null);', 'const [modalTool, setModalTool] = useState<Tool | null>(null);\n  const [bulkSelectedLoans, setBulkSelectedLoans] = useState<number[]>([]);\n  const [bulkMode, setBulkMode] = useState<"quick" | "review" | null>(null);', 1)
needle = 'const doDispatch = async () => {'
handler = '''const doBulkReturn = async () => {
    const selected = activeLoans.filter((loan) => bulkSelectedLoans.includes(loan.id)).map((loan) => ({ movementId: loan.id, idTag: tools.find((tool) => tool.id === loan.toolId)?.code ?? "" })).filter((item) => item.idTag);
    if (!selected.length) return notify("Selecciona al menos una herramienta para devolver.");
    if (bulkMode === "review") return notify("Revisa cada herramienta seleccionada y confirma que todas llegaron completas y operativas.");
    try { await bulkReturnMutation.mutateAsync({ userRecibe: me.data!.id, items: selected }); setBulkSelectedLoans([]); setBulkMode(null); notify(`${selected.length} devolución(es) registrada(s) correctamente`); } catch (error) { notify(error instanceof Error ? error.message : "No se pudo registrar la devolución masiva."); }
  };
  '''
if needle not in s: raise SystemExit('frontend handler marker missing')
s = s.replace(needle, handler + needle, 1)
old_block = '''{tab === "active" && <section><PageTitle title="Préstamos activos" subtitle="Las transacciones sin fecha de retorno se muestran en rojo." /><div className="pos-card table-wrap"><table><thead><tr><th>Herramienta</th><th>Personal</th><th>Fecha de salida</th><th>Entrega</th><th>Acción</th></tr></thead><tbody>{activeLoans.length ? activeLoans.map((loan) => { const tool = tools.find((item) => item.id === loan.toolId); const person = people.find((item) => item.id === loan.workerId); return <tr className="loan-open" key={loan.id}><td><b>{tool?.code}</b><span>{tool?.name}</span></td><td>{person?.fullName}<small>{person?.code}</small></td><td>{new Date(loan.occurredAt).toLocaleString("es-PE", { timeZone: "America/Lima" })}</td><td>{snapshot.storekeepers.find((user) => user.id === loan.storekeeperId)?.fullName ?? "—"}</td><td><button className="pos-small" onClick={() => returnMutation.mutate({ idTag: tool?.code ?? "", userRecibe: me.data!.id, movementId: loan.id })}><ArrowDownToLine size={14} />Recibir</button></td></tr>; }) : <EmptyRow text="No hay préstamos activos." />}</tbody></table></div></section>}'''
new_block = '''{tab === "active" && <section><PageTitle title="Préstamos activos" subtitle="Selecciona una o varias herramientas para registrar su devolución." />{activeLoans.length > 0 && <div className="bulk-return-toolbar"><label className="bulk-check-all"><input type="checkbox" checked={bulkSelectedLoans.length === activeLoans.length} onChange={(e) => setBulkSelectedLoans(e.target.checked ? activeLoans.map((loan) => loan.id) : [])} /> Seleccionar todo</label><span>{bulkSelectedLoans.length} seleccionada(s)</span><button className="pos-secondary" disabled={!bulkSelectedLoans.length} onClick={() => { setBulkMode("quick"); void doBulkReturn(); }}><ArrowDownToLine size={15} />Devolución rápida</button><button className="pos-primary" disabled={!bulkSelectedLoans.length} onClick={() => setBulkMode("review")}><Check size={15} />Devolución con revisión</button></div>}{bulkMode === "review" && <div className="bulk-review-panel"><strong>Revisión antes de devolver</strong><p>Confirma que cada herramienta seleccionada llegó completa y operativa. El sistema registrará una entrada independiente por cada ID_Tag.</p><div className="bulk-review-list">{activeLoans.filter((loan) => bulkSelectedLoans.includes(loan.id)).map((loan) => { const tool = tools.find((item) => item.id === loan.toolId); const person = people.find((item) => item.id === loan.workerId); return <label key={loan.id}><input type="checkbox" checked readOnly /><span><b>{tool?.code}</b> · {tool?.name} · {person?.fullName}</span></label>; })}</div><div className="modal-actions"><button className="pos-secondary" onClick={() => setBulkMode(null)}>Cancelar</button><button className="pos-primary" disabled={bulkReturnMutation.isPending} onClick={() => void doBulkReturn()}>{bulkReturnMutation.isPending ? "Registrando…" : "Confirmar devolución revisada"}</button></div></div>}<div className="pos-card table-wrap"><table><thead><tr><th></th><th>Herramienta</th><th>Personal</th><th>Fecha de salida</th><th>Entrega</th><th>Acción</th></tr></thead><tbody>{activeLoans.length ? activeLoans.map((loan) => { const tool = tools.find((item) => item.id === loan.toolId); const person = people.find((item) => item.id === loan.workerId); return <tr className="loan-open" key={loan.id}><td><input type="checkbox" aria-label={`Seleccionar ${tool?.code ?? "herramienta"}`} checked={bulkSelectedLoans.includes(loan.id)} onChange={(e) => setBulkSelectedLoans((current) => e.target.checked ? [...current, loan.id] : current.filter((id) => id !== loan.id))} /></td><td><b>{tool?.code}</b><span>{tool?.name}</span></td><td>{person?.fullName}<small>{person?.code}</small></td><td>{new Date(loan.occurredAt).toLocaleString("es-PE", { timeZone: "America/Lima" })}</td><td>{snapshot.storekeepers.find((user) => user.id === loan.storekeeperId)?.fullName ?? "—"}</td><td><button className="pos-small" disabled={returnMutation.isPending} onClick={() => returnMutation.mutate({ idTag: tool?.code ?? "", userRecibe: me.data!.id, movementId: loan.id })}><ArrowDownToLine size={14} />Recibir</button></td></tr>; }) : <EmptyRow span={6} text="No hay préstamos activos." />}</tbody></table></div></section>}'''
if old_block not in s: raise SystemExit('active JSX block missing')
s = s.replace(old_block, new_block, 1)
p.write_text(s)

# Styling for the toolbar/review panel.
p = Path('/home/ubuntu/control-herramientas/client/src/index.css')
s = p.read_text()
s += '''\n.bulk-return-toolbar { display:flex; align-items:center; gap:12px; flex-wrap:wrap; padding:14px 16px; margin-bottom:14px; background:#fff7f2; border:1px solid #f3d8cb; border-radius:12px; }\n.bulk-return-toolbar span { margin-right:auto; color:var(--ink-soft); font-size:12px; font-weight:700; }\n.bulk-check-all { display:flex; align-items:center; gap:7px; color:var(--ink); font-size:12px; font-weight:750; }\n.bulk-review-panel { padding:18px 20px; margin-bottom:14px; background:#fff; border:1px solid #f3d8cb; border-left:4px solid var(--orange); border-radius:12px; box-shadow:var(--shadow); }\n.bulk-review-panel strong { color:var(--ink); font-size:15px; }\n.bulk-review-panel p { margin-top:6px; color:var(--ink-soft); font-size:12px; }\n.bulk-review-list { display:grid; gap:7px; margin-top:13px; }\n.bulk-review-list label { display:flex; align-items:center; gap:8px; padding:9px 10px; background:#fafafa; border:1px solid var(--line); border-radius:8px; font-size:12px; }\n'''
p.write_text(s)
