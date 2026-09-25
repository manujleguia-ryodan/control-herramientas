from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s=p.read_text()
# Add invalidate after creation so the PC itself immediately sees its pending state.
s=s.replace('const pendingCreateMutation = trpc.movements.pendingCreate.useMutation();', 'const pendingCreateMutation = trpc.movements.pendingCreate.useMutation({ onSuccess: () => void utils.movements.pendingLatest.invalidate() });', 1)
# Add visible diagnostic after dispatch action buttons.
old='<div className="dispatch-actions"><button className="pos-secondary" disabled={!selectedPerson || !selectedToolCodes.length || pendingCreateMutation.isPending} onClick={() => void sendDispatchToTablet}>{pendingCreateMutation.isPending ? "Enviando…" : "Enviar a tablet para firma"}</button><button className="pos-primary" disabled={!selectedPerson || !selectedToolCodes.length || bulkDispatchMutation.isPending} onClick={() => { setSignaturePoints([]); setDispatchSignatureOpen(true); }}><ArrowUpFromLine size={18} />{bulkDispatchMutation.isPending ? "Registrando…" : "Firmar aquí y confirmar"}</button></div>'
new='<div className="dispatch-actions"><button className="pos-secondary" disabled={!selectedPerson || !selectedToolCodes.length || pendingCreateMutation.isPending} onClick={() => void sendDispatchToTablet}>{pendingCreateMutation.isPending ? "Enviando…" : "Enviar a tablet para firma"}</button><button className="pos-primary" disabled={!selectedPerson || !selectedToolCodes.length || bulkDispatchMutation.isPending} onClick={() => { setSignaturePoints([]); setDispatchSignatureOpen(true); }}><ArrowUpFromLine size={18} />{bulkDispatchMutation.isPending ? "Registrando…" : "Firmar aquí y confirmar"}</button></div>{pendingCreateMutation.error && <div className="dispatch-error-detail">No se pudo enviar a la tablet: {pendingCreateMutation.error.message}</div>}'
if old not in s: raise SystemExit('dispatch actions anchor not found')
s=s.replace(old,new,1)
# Add manual refresh in tablet panel.
old2='<div className="pos-card tablet-dispatch-card">{pendingDispatchQuery.isLoading && <div className="tablet-waiting">Buscando el despacho pendiente…</div>}'
new2='<div className="pos-card tablet-dispatch-card"><div className="tablet-sync-row"><span>Sincronización automática activa</span><button type="button" className="pos-small" onClick={() => void pendingDispatchQuery.refetch()} disabled={pendingDispatchQuery.isFetching}>↻ Actualizar ahora</button></div>{pendingDispatchQuery.isLoading && <div className="tablet-waiting">Buscando el despacho pendiente…</div>}'
if old2 not in s: raise SystemExit('tablet panel anchor not found')
s=s.replace(old2,new2,1)
p.write_text(s)
PY
cd /home/ubuntu/control-herramientas && sed -i '/^PY$/d;/^cd \/home\/ubuntu\/control-herramientas &&/d' tools/add-dispatch-diagnostics.py && python3 tools/add-dispatch-diagnostics.py && cat >> client/src/index.css <<'EOF'
.dispatch-error-detail { margin-top:10px; padding:10px 12px; color:#991b1b; background:#fef2f2; border:1px solid #fecaca; border-radius:8px; font-size:11px; font-weight:700; }
.tablet-sync-row { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; color:var(--teal); font-size:11px; font-weight:800; }
@media (max-width:560px) { .tablet-sync-row { align-items:stretch; flex-direction:column; } }
EOF
rm -f tools/add-dispatch-diagnostics.py
pnpm exec tsc --noEmit