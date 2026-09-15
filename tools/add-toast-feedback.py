from pathlib import Path

p = Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s = p.read_text()
s = s.replace(
    'import { trpc } from "@/lib/trpc";',
    'import { trpc } from "@/lib/trpc";\nimport { toast } from "sonner";',
    1,
)
s = s.replace(
    ' const [newTool, setNewTool] = useState({ idTag: "", descripcion: "", marca: "", ubicacion: "" }); const [newPerson, setNewPerson] = useState({ codigoTrabajador: "", nombreCompleto: "", marcobre: "", tipo: "Marcobre" }); const [message, setMessage] = useState("");',
    ' const [newTool, setNewTool] = useState({ idTag: "", descripcion: "", marca: "", ubicacion: "" }); const [newPerson, setNewPerson] = useState({ codigoTrabajador: "", nombreCompleto: "", marcobre: "", tipo: "Marcobre" });',
    1,
)
s = s.replace(
    'const notify = (text: string) => { setMessage(text); window.setTimeout(() => setMessage(""), 3500); };',
    '''const notify = (text: string) => {
    const isError = /error|no se pudo|incorrecto|obligatori|selecciona|describe|no existe|no disponible|no se puede|debe ser|fuera de servicio/i.test(text);
    (isError ? toast.error : toast.success)(text, { duration: isError ? 5000 : 3500 });
  };''',
    1,
)
p.write_text(s)
