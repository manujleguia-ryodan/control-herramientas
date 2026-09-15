from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s=p.read_text()
s=s.replace(' const [newTool, setNewTool] = useState({ idTag: "", descripcion: "", marca: "", ubicacion: "" }); const [newPerson, setNewPerson] = useState({ codigoTrabajador: "", nombreCompleto: "", marcobre: "", tipo: "Marcobre" });', ' const [newTool, setNewTool] = useState({ idTag: "", descripcion: "", marca: "", ubicacion: "" }); const [newPerson, setNewPerson] = useState({ codigoTrabajador: "", nombreCompleto: "", marcobre: "", tipo: "Marcobre" }); const [message, setMessage] = useState("");', 1)
s=s.replace('''const notify = (text: string) => {
    const isError = /error|no se pudo|incorrecto|obligatori|selecciona|describe|no existe|no disponible|no se puede|debe ser|fuera de servicio/i.test(text);
    (isError ? toast.error : toast.success)(text, { duration: isError ? 5000 : 3500 });
  };''','''const notify = (text: string) => {
    const isError = /error|no se pudo|incorrecto|obligatori|selecciona|describe|no existe|no disponible|no se puede|debe ser|fuera de servicio/i.test(text);
    setMessage(text);
    window.setTimeout(() => setMessage(""), isError ? 5000 : 3500);
    (isError ? toast.error : toast.success)(text, { duration: isError ? 5000 : 3500 });
  };''',1)
s=s.replace('return <div className="pos-app"><header', 'return <div className="pos-app">{message && <div className="toast-fallback" role="status">{message}</div>}<header',1)
p.write_text(s)

p=Path('/home/ubuntu/control-herramientas/client/src/index.css')
s=p.read_text()
s += '''\n.toast-fallback { position: fixed; z-index: 100; top: 20px; right: 22px; max-width: min(420px, calc(100vw - 44px)); padding: 13px 17px; color: #126b65; background: #e5f6f3; border: 1px solid #b9e4df; border-left: 4px solid var(--teal); border-radius: 10px; box-shadow: 0 10px 28px rgba(32,42,56,.16); font-size: 13px; font-weight: 700; animation: toast-in .18s ease-out; }\n@keyframes toast-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }\n'''
p.write_text(s)
PY
cd /home/ubuntu/control-herramientas && python3 tools/add-toast-fallback.py && pnpm exec tsc --noEmit
