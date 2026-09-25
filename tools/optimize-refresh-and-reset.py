from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s=p.read_text()
s=s.replace('const dispatchMutation = trpc.movements.dispatch.useMutation({ onSuccess: () => void utils.catalog.snapshot.invalidate() });', 'const dispatchMutation = trpc.movements.dispatch.useMutation({ onSuccess: async () => { await snapshotQuery.refetch(); } });', 1)
s=s.replace('const bulkDispatchMutation = trpc.movements.dispatchBulk.useMutation({ onSuccess: () => void utils.catalog.snapshot.invalidate() });', 'const bulkDispatchMutation = trpc.movements.dispatchBulk.useMutation({ onSuccess: async () => { await snapshotQuery.refetch(); } });', 1)
s=s.replace('const pendingSignMutation = trpc.movements.pendingSignLatest.useMutation({ onSuccess: () => { void utils.catalog.snapshot.invalidate(); void utils.movements.pendingLatest.invalidate(); } });', 'const pendingSignMutation = trpc.movements.pendingSignLatest.useMutation({ onSuccess: async () => { await snapshotQuery.refetch(); void utils.movements.pendingLatest.invalidate(); } });', 1)
s=s.replace('const pendingConfirmMutation = trpc.movements.pendingConfirmLatest.useMutation({ onSuccess: () => void utils.catalog.snapshot.invalidate() });', 'const pendingConfirmMutation = trpc.movements.pendingConfirmLatest.useMutation({ onSuccess: async () => { await snapshotQuery.refetch(); } });', 1)
s=s.replace('const returnMutation = trpc.movements.return.useMutation({ onSuccess: () => void utils.catalog.snapshot.invalidate() });', 'const returnMutation = trpc.movements.return.useMutation({ onSuccess: async () => { await snapshotQuery.refetch(); } });', 1)
s=s.replace('const bulkReturnMutation = trpc.movements.returnBulk.useMutation({ onSuccess: () => void utils.catalog.snapshot.invalidate() });', 'const bulkReturnMutation = trpc.movements.returnBulk.useMutation({ onSuccess: async () => { await snapshotQuery.refetch(); } });', 1)
old='''  useEffect(() => { if (pendingCode && pendingDispatchQuery.isError && pendingDispatchQuery.error?.message.includes("No hay un despacho pendiente")) { setPendingCode(""); void snapshotQuery.refetch(); } }, [pendingCode, pendingDispatchQuery.isError, pendingDispatchQuery.error, snapshotQuery]);'''
new='''  useEffect(() => {
    if (!pendingCode) return;
    const refresh = window.setInterval(() => void snapshotQuery.refetch(), 2000);
    return () => window.clearInterval(refresh);
  }, [pendingCode, snapshotQuery.refetch]);
  useEffect(() => {
    if (pendingCode && pendingDispatchQuery.isError && pendingDispatchQuery.error?.message.includes("No hay un despacho pendiente")) {
      setPendingCode(""); setToolQuery(""); setPersonQuery(""); setToolId(""); setSelectedToolCodes([]); setPersonCode("");
      void snapshotQuery.refetch();
    }
  }, [pendingCode, pendingDispatchQuery.isError, pendingDispatchQuery.error, snapshotQuery.refetch]);'''
if old not in s: raise SystemExit('pending effect not found')
s=s.replace(old,new,1)
old2='''const signFromTablet = async () => { if (!pendingDispatchQuery.data || signaturePoints.length < 2) return notify("Dibuja la firma del trabajador antes de enviarla."); try { await pendingSignMutation.mutateAsync({ firmaTrabajador: JSON.stringify(signaturePoints) }); setTabletSignatureOpen(false); setSignaturePoints([]); notify("Firma validada. El despacho ya está registrado en Movimientos y Préstamos activos."); void pendingDispatchQuery.refetch(); } catch (error) { notify(error instanceof Error ? error.message : "No se pudo enviar la firma."); } };'''
new2='''const signFromTablet = async () => { if (!pendingDispatchQuery.data || signaturePoints.length < 2) return notify("Dibuja la firma del trabajador antes de enviarla."); try { await pendingSignMutation.mutateAsync({ firmaTrabajador: JSON.stringify(signaturePoints) }); setTabletSignatureOpen(false); setSignaturePoints([]); setPendingCode(""); setToolQuery(""); setPersonQuery(""); setToolId(""); setSelectedToolCodes([]); setPersonCode(""); notify("Firma validada. El despacho ya está registrado en Movimientos y Préstamos activos."); void pendingDispatchQuery.refetch(); void snapshotQuery.refetch(); } catch (error) { notify(error instanceof Error ? error.message : "No se pudo enviar la firma."); } };'''
if old2 not in s: raise SystemExit('sign handler not found')
s=s.replace(old2,new2,1)
p.write_text(s)
PY
cd /home/ubuntu/control-herramientas && python3 tools/optimize-refresh-and-reset.py && rm -f tools/optimize-refresh-and-reset.py && pnpm exec tsc --noEmit