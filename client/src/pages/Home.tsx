import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  Bell,
  Boxes,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Download,
  FileText,
  Hammer,
  HardHat,
  History,
  LayoutDashboard,
  MapPin,
  Menu,
  PackageCheck,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

type ToolStatus = "Disponible" | "Prestada" | "Mantenimiento" | "Baja";
type MovementType = "Despacho" | "Recepción" | "Traslado";
type ViewName = "dashboard" | "inventario" | "movimientos" | "personas" | "reportes";

type Tool = {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  location: string;
  image: string;
  status: ToolStatus;
  stock: number;
  available: number;
  rotations: number;
  lastMovement: string;
  serial?: string;
  daysOut?: number;
  holder?: string;
  holderCode?: string;
};

type Worker = {
  id: string;
  code: string;
  name: string;
  area: string;
  initials: string;
  active: boolean;
  currentTools: number;
};

type Movement = {
  id: number;
  type: MovementType;
  tool: string;
  toolCode: string;
  worker: string;
  workerCode: string;
  time: string;
  quantity: number;
  note?: string;
};

const toolImages = {
  drill: "/manus-storage/taladro_54d383a9.jpg",
  meter: "/manus-storage/multimetro_3b6f356b.jpg",
  keys: "/manus-storage/llaves_8949c6c9.jpg",
  kit: "/manus-storage/kit_843bac94.jpg",
};

const initialTools: Tool[] = [
  { id: "t1", code: "TAL-00245", name: "Taladro percutor 13 mm", category: "Eléctrica", brand: "Bosch GSB", location: "Estante 03 · A-12", image: toolImages.drill, status: "Prestada", stock: 4, available: 3, rotations: 86, lastMovement: "Hoy, 08:42", serial: "BSH-13-4492", daysOut: 9, holder: "Carlos Mendoza", holderCode: "TRB-1048" },
  { id: "t2", code: "MUL-00032", name: "Multímetro digital", category: "Medición", brand: "Fluke 87V", location: "Gabinete 02 · B-04", image: toolImages.meter, status: "Disponible", stock: 6, available: 6, rotations: 64, lastMovement: "Ayer, 16:18", serial: "FLK-87-2108" },
  { id: "t3", code: "LLV-00118", name: "Llave francesa 12”", category: "Manual", brand: "Bahco", location: "Panel 01 · C-08", image: toolImages.keys, status: "Prestada", stock: 12, available: 10, rotations: 48, lastMovement: "Hoy, 07:55", serial: "BHC-12-8841", daysOut: 14, holder: "Luis Paredes", holderCode: "TRB-1104" },
  { id: "t4", code: "KIT-00027", name: "Kit de herramientas", category: "Sets", brand: "Dewalt 223 pzs", location: "Estante 01 · A-03", image: toolImages.kit, status: "Mantenimiento", stock: 3, available: 2, rotations: 37, lastMovement: "08 sep, 12:20", serial: "DWT-223-0091", daysOut: 21, holder: "Jorge Salinas", holderCode: "TRB-1082" },
  { id: "t5", code: "MAR-00086", name: "Martillo de bola 2 lb", category: "Manual", brand: "Stanley", location: "Panel 02 · C-14", image: toolImages.keys, status: "Disponible", stock: 8, available: 8, rotations: 29, lastMovement: "07 sep, 17:02", serial: "STN-2LB-1024" },
  { id: "t6", code: "ESM-00041", name: "Esmeril angular 4 ½”", category: "Eléctrica", brand: "Makita", location: "Estante 04 · A-19", image: toolImages.drill, status: "Disponible", stock: 3, available: 3, rotations: 22, lastMovement: "05 sep, 09:34", serial: "MKT-115-7740" },
];

const initialWorkers: Worker[] = [
  { id: "w1", code: "TRB-1048", name: "Carlos Mendoza", area: "Mantenimiento mecánico", initials: "CM", active: true, currentTools: 3 },
  { id: "w2", code: "TRB-1082", name: "Jorge Salinas", area: "Operaciones mina", initials: "JS", active: true, currentTools: 1 },
  { id: "w3", code: "TRB-1026", name: "Ana Torres", area: "Instrumentación", initials: "AT", active: true, currentTools: 0 },
  { id: "w4", code: "TRB-1104", name: "Luis Paredes", area: "Planta chancado", initials: "LP", active: true, currentTools: 2 },
];

const initialMovements: Movement[] = [
  { id: 1, type: "Despacho", tool: "Taladro percutor 13 mm", toolCode: "TAL-00245", worker: "Carlos Mendoza", workerCode: "TRB-1048", time: "Hoy, 08:42", quantity: 1, note: "Mantenimiento bomba #04" },
  { id: 2, type: "Recepción", tool: "Multímetro digital", toolCode: "MUL-00032", worker: "Ana Torres", workerCode: "TRB-1026", time: "Hoy, 08:15", quantity: 1, note: "Sin observaciones" },
  { id: 3, type: "Despacho", tool: "Llave francesa 12”", toolCode: "LLV-00118", worker: "Luis Paredes", workerCode: "TRB-1104", time: "Hoy, 07:55", quantity: 1, note: "Frente de trabajo 2" },
  { id: 4, type: "Traslado", tool: "Kit de herramientas", toolCode: "KIT-00027", worker: "Jorge Salinas", workerCode: "TRB-1082", time: "Ayer, 16:18", quantity: 1, note: "A taller de mantenimiento" },
];

const navItems: { id: ViewName; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Resumen", icon: LayoutDashboard },
  { id: "inventario", label: "Inventario", icon: Boxes },
  { id: "movimientos", label: "Movimientos", icon: ClipboardList },
  { id: "personas", label: "Trabajadores", icon: UsersRound },
  { id: "reportes", label: "Rotación", icon: BarChart3 },
];

function formatDate() {
  return new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
}

function statusClass(status: ToolStatus) {
  return status.toLowerCase().replace("ó", "o");
}

function AppIcon({ type }: { type: MovementType }) {
  if (type === "Recepción") return <ArrowDownToLine size={16} />;
  if (type === "Traslado") return <RotateCcw size={16} />;
  return <ArrowUpFromLine size={16} />;
}

export default function Home() {
  const [view, setView] = useState<ViewName>("dashboard");
  const [tools, setTools] = useState<Tool[]>(initialTools);
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers);
  const [movements, setMovements] = useState<Movement[]>(initialMovements);
  const [search, setSearch] = useState("");
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [modal, setModal] = useState<"movement" | "tool" | null>(null);
  const [movementType, setMovementType] = useState<MovementType>("Despacho");
  const [selectedTool, setSelectedTool] = useState(initialTools[0].id);
  const [selectedWorker, setSelectedWorker] = useState(initialWorkers[0].id);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState("");
  const [filterStatus, setFilterStatus] = useState<"Todos" | ToolStatus>("Todos");

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const availableTools = useMemo(() => tools.filter((tool) => tool.status !== "Baja"), [tools]);
  const filteredTools = useMemo(() => {
    const normalized = search.toLowerCase().trim();
    return availableTools.filter((tool) => {
      const matchesSearch = !normalized || [tool.name, tool.code, tool.location, tool.brand, tool.category].some((field) => field.toLowerCase().includes(normalized));
      const matchesStatus = filterStatus === "Todos" || tool.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [availableTools, search, filterStatus]);
  const topTools = useMemo(() => [...tools].sort((a, b) => b.rotations - a.rotations).slice(0, 5), [tools]);
  const totalStock = tools.reduce((sum, tool) => sum + tool.stock, 0);
  const totalAvailable = tools.reduce((sum, tool) => sum + tool.available, 0);
  const borrowed = totalStock - totalAvailable;
  const overdue = 7;

  const openMovement = (type: MovementType, toolId = selectedTool) => {
    setMovementType(type);
    setSelectedTool(toolId);
    const tool = tools.find((item) => item.id === toolId);
    if (type === "Recepción" && tool?.holderCode) {
      const holder = workers.find((worker) => worker.code === tool.holderCode);
      if (holder) setSelectedWorker(holder.id);
    }
    setModal("movement");
  };

  const handleMovement = () => {
    const tool = tools.find((item) => item.id === selectedTool);
    const worker = workers.find((item) => item.id === selectedWorker);
    if (!tool || !worker) return;
    if (movementType === "Despacho" && quantity > tool.available) {
      setToast(`Solo quedan ${tool.available} unidades disponibles.`);
      return;
    }
    const delta = movementType === "Recepción" ? quantity : -quantity;
    const nextStatus: ToolStatus = movementType === "Despacho" ? "Prestada" : movementType === "Recepción" ? "Disponible" : tool.status;
    setTools((current) => current.map((item) => item.id === tool.id ? { ...item, available: Math.max(0, Math.min(item.stock, item.available + delta)), status: item.available + delta === 0 ? "Prestada" : nextStatus, rotations: movementType === "Despacho" ? item.rotations + quantity : item.rotations, lastMovement: "Ahora" } : item));
    setWorkers((current) => current.map((item) => item.id === worker.id ? { ...item, currentTools: Math.max(0, item.currentTools + (movementType === "Despacho" ? quantity : -quantity)) } : item));
    setMovements((current) => [{ id: Date.now(), type: movementType, tool: tool.name, toolCode: tool.code, worker: worker.name, workerCode: worker.code, time: "Ahora", quantity, note: note || (movementType === "Recepción" ? "Recepción conforme" : "Sin observaciones") }, ...current]);
    setModal(null);
    setNote("");
    setQuantity(1);
    setToast(`${movementType} registrado correctamente`);
  };

  const addTool = () => {
    const newTool: Tool = { id: `t${Date.now()}`, code: `HER-${String(tools.length + 1).padStart(5, "0")}`, name: "Nueva herramienta", category: "Por clasificar", brand: "Sin marca", location: "Por ubicar", image: toolImages.kit, status: "Disponible", stock: 1, available: 1, rotations: 0, lastMovement: "Sin movimientos" };
    setTools((current) => [newTool, ...current]);
    setModal(null);
    setToast("Herramienta creada. Completa sus datos desde la ficha.");
  };

  const exportCsv = () => {
    const csv = ["Código,Herramienta,Categoría,Ubicación,Estado,Stock,Disponibles,Rotaciones", ...tools.map((tool) => [tool.code, tool.name, tool.category, tool.location, tool.status, tool.stock, tool.available, tool.rotations].map((cell) => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "inventario-herramientas.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setToast("Reporte CSV descargado");
  };

  const viewMeta: Record<ViewName, { eyebrow: string; title: string; description: string }> = {
    dashboard: { eyebrow: "Control de almacén", title: "Buenos días, almacenero", description: "Aquí tienes una vista rápida de tu operación de hoy." },
    inventario: { eyebrow: "Catálogo operativo", title: "Inventario de herramientas", description: "Ubica, revisa y actualiza cada herramienta del almacén." },
    movimientos: { eyebrow: "Trazabilidad", title: "Despachos y recepciones", description: "Cada entrega queda registrada con responsable, fecha y estado." },
    personas: { eyebrow: "Equipo operativo", title: "Trabajadores registrados", description: "Consulta qué herramientas tiene cada persona en campo." },
    reportes: { eyebrow: "Análisis de uso", title: "Rotación de herramientas", description: "Identifica demanda, frecuencia y oportunidades de reposición." },
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${showMobileNav ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><Hammer size={22} strokeWidth={2.5} /></div>
          <div><div className="brand-name">almacén<span>+</span></div><div className="brand-caption">control de herramientas</div></div>
          <button className="mobile-close" onClick={() => setShowMobileNav(false)} aria-label="Cerrar menú"><X size={18} /></button>
        </div>
        <div className="warehouse-switcher"><div className="warehouse-icon"><HardHat size={18} /></div><div><span>Almacén principal</span><strong>Unidad Minera Norte</strong></div><ChevronDown size={16} /></div>
        <div className="sidebar-label">Operación</div>
        <nav className="main-nav">
          {navItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={`nav-item ${view === item.id ? "active" : ""}`} onClick={() => { setView(item.id); setShowMobileNav(false); }}><Icon size={18} /><span>{item.label}</span>{item.id === "movimientos" && <em>4</em>}</button>; })}
        </nav>
        <div className="sidebar-label secondary-label">Administración</div>
        <nav className="main-nav"><button className="nav-item" onClick={() => setToast("La configuración estará disponible en la siguiente versión.")}><Settings2 size={18} /><span>Configuración</span></button><button className="nav-item" onClick={() => setToast("Centro de ayuda abierto") }><ShieldCheck size={18} /><span>Ayuda y soporte</span></button></nav>
        <div className="sidebar-bottom"><div className="sync-card"><div className="sync-dot"/><div><strong>Datos sincronizados</strong><span>Última actualización: ahora</span></div></div><div className="user-profile"><div className="avatar avatar-orange">AM</div><div><strong>Almacenero</strong><span>Acceso operativo</span></div><ChevronDown size={15} /></div></div>
      </aside>
      {showMobileNav && <button className="sidebar-overlay" onClick={() => setShowMobileNav(false)} aria-label="Cerrar menú" />}
      <main className="main-content">
        <header className="topbar"><button className="mobile-menu" onClick={() => setShowMobileNav(true)} aria-label="Abrir menú"><Menu size={20} /></button><div className="breadcrumb"><span>Almacén principal</span><b>/</b><strong>{viewMeta[view].title}</strong></div><div className="topbar-actions"><div className="top-date"><CalendarDays size={16} /><span>{formatDate()}</span></div><button className="icon-button has-notice" onClick={() => setToast("No tienes notificaciones nuevas")} aria-label="Notificaciones"><Bell size={19} /></button><div className="mini-avatar">AM</div></div></header>
        <div className="page-content">
          <section className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot" />{viewMeta[view].eyebrow}</div><h1>{viewMeta[view].title}</h1><p>{viewMeta[view].description}</p></div><div className="heading-actions"><button className="button button-light" onClick={exportCsv}><Download size={16} />Exportar</button><button className="button button-primary" onClick={() => setModal("tool")}><Plus size={17} />Nueva herramienta</button></div></section>

          {view === "dashboard" && <Dashboard tools={tools} movements={movements} topTools={topTools} totalStock={totalStock} totalAvailable={totalAvailable} borrowed={borrowed} overdue={overdue} onMovement={openMovement} onView={(next) => setView(next)} />}
          {view === "inventario" && <InventoryView tools={filteredTools} search={search} setSearch={setSearch} filterStatus={filterStatus} setFilterStatus={setFilterStatus} onMovement={openMovement} onAdd={() => setModal("tool")} />}
          {view === "movimientos" && <MovementsView movements={movements} onMovement={openMovement} />}
          {view === "personas" && <PeopleView workers={workers} movements={movements} onMovement={openMovement} />}
          {view === "reportes" && <ReportsView tools={tools} topTools={topTools} onExport={exportCsv} />}
        </div>
      </main>
      {modal === "movement" && <MovementModal type={movementType} setType={setMovementType} toolId={selectedTool} setToolId={setSelectedTool} workerId={selectedWorker} setWorkerId={setSelectedWorker} quantity={quantity} setQuantity={setQuantity} note={note} setNote={setNote} tools={tools} workers={workers} onClose={() => setModal(null)} onSubmit={handleMovement} />}
      {modal === "tool" && <ToolModal onClose={() => setModal(null)} onCreate={addTool} />}
      {toast && <div className="toast"><div className="toast-check"><Check size={15} /></div><span>{toast}</span><button onClick={() => setToast("")}><X size={15} /></button></div>}
    </div>
  );
}

function Dashboard({ tools, movements, topTools, totalStock, totalAvailable, borrowed, overdue, onMovement, onView }: { tools: Tool[]; movements: Movement[]; topTools: Tool[]; totalStock: number; totalAvailable: number; borrowed: number; overdue: number; onMovement: (type: MovementType, toolId?: string) => void; onView: (view: ViewName) => void }) {
  return <>
    <section className="kpi-grid">
      <KpiCard label="Herramientas en inventario" value={totalStock.toString()} detail="Unidades registradas" icon={<Boxes size={20} />} tone="orange" trend="+8%" trendLabel="vs. mes anterior" />
      <KpiCard label="Disponibles ahora" value={totalAvailable.toString()} detail={`${Math.round((totalAvailable / totalStock) * 100)}% del inventario`} icon={<PackageCheck size={20} />} tone="teal" trend="Activo" trendLabel="operación normal" />
      <KpiCard label="En campo" value={borrowed.toString()} detail="Unidades prestadas" icon={<ArrowUpFromLine size={20} />} tone="blue" trend="12" trendLabel="trabajadores activos" />
      <KpiCard label="Devoluciones pendientes" value={overdue.toString()} detail="Requieren seguimiento" icon={<TriangleAlert size={20} />} tone="red" trend="3 vencidas" trendLabel="esta semana" />
    </section>
    <OverdueAlerts tools={tools} onMovement={onMovement} onView={onView} />
    <section className="dashboard-grid"><div className="panel activity-panel"><div className="panel-heading"><div><div className="panel-kicker">Actividad reciente</div><h2>Últimos movimientos</h2></div><button className="text-button" onClick={() => onView("movimientos")}>Ver todos <span>→</span></button></div><div className="activity-list">{movements.slice(0, 4).map((movement) => <ActivityRow key={movement.id} movement={movement} />)}</div></div><div className="panel rotation-panel"><div className="panel-heading"><div><div className="panel-kicker">Demanda del mes</div><h2>Mayor rotación</h2></div><button className="square-button" onClick={() => onView("reportes")} aria-label="Ver reporte de rotación"><ArrowUpFromLine size={16} /></button></div><div className="rotation-list">{topTools.slice(0, 4).map((tool, index) => <div className="rotation-row" key={tool.id}><div className={`rank rank-${index + 1}`}>{String(index + 1).padStart(2, "0")}</div><div className="rotation-tool"><strong>{tool.name}</strong><span>{tool.code} · {tool.category}</span></div><div className="rotation-value"><strong>{tool.rotations}</strong><span>salidas</span></div><div className="sparkbar"><i style={{ width: `${Math.max(24, (tool.rotations / topTools[0].rotations) * 100)}%` }} /></div></div>)}</div></div></section>
    <section className="lower-grid"><div className="panel inventory-panel"><div className="panel-heading"><div><div className="panel-kicker">Vista rápida</div><h2>Inventario destacado</h2></div><button className="text-button" onClick={() => onView("inventario")}>Ver inventario <span>→</span></button></div><div className="tool-mini-grid">{tools.slice(0, 4).map((tool) => <ToolMiniCard key={tool.id} tool={tool} onMovement={onMovement} />)}</div></div><div className="panel shortcut-panel"><div className="panel-kicker">Acciones rápidas</div><h2>Registrar movimiento</h2><p>Elige una acción para iniciar un registro.</p><div className="shortcut-buttons"><button onClick={() => onMovement("Despacho")}><span className="shortcut-icon orange"><ArrowUpFromLine size={18} /></span><span><strong>Despachar herramienta</strong><small>Registrar una salida</small></span><span className="shortcut-arrow">→</span></button><button onClick={() => onMovement("Recepción")}><span className="shortcut-icon teal"><ArrowDownToLine size={18} /></span><span><strong>Recepcionar devolución</strong><small>Registrar un ingreso</small></span><span className="shortcut-arrow">→</span></button></div><div className="tip-box"><Sparkles size={16} /><span><strong>Tip del día:</strong> las llaves francesas tienen 22% más rotación que el mes pasado.</span></div></div></section>
  </>;
}

function OverdueAlerts({ tools, onMovement, onView }: { tools: Tool[]; onMovement: (type: MovementType, toolId?: string) => void; onView: (view: ViewName) => void }) {
  const overdueTools = tools.filter((tool) => (tool.daysOut || 0) >= 7).sort((a, b) => (b.daysOut || 0) - (a.daysOut || 0));
  return <section className="overdue-alerts"><div className="overdue-heading"><div className="overdue-title"><div className="alert-pulse"><TriangleAlert size={17} /></div><div><div className="panel-kicker">Seguimiento prioritario</div><h2>Herramientas con devolución atrasada</h2><p>Hay <strong>{overdueTools.length} herramientas</strong> fuera del almacén por más de 7 días.</p></div></div><button className="text-button" onClick={() => onView("movimientos")}>Ver historial <span>→</span></button></div><div className="overdue-list">{overdueTools.map((tool) => <div className="overdue-item" key={tool.id}><img src={tool.image} alt={tool.name} /><div className="overdue-tool"><strong>{tool.name}</strong><span>{tool.code} · {tool.location}</span></div><div className="overdue-holder"><span>Responsable</span><strong>{tool.holder || "Sin asignar"}</strong><small>{tool.holderCode || "—"}</small></div><div className="overdue-days"><strong>{tool.daysOut} días</strong><span>sin devolución</span></div><button className="overdue-action" onClick={() => onMovement("Recepción", tool.id)}><ArrowDownToLine size={14} />Registrar devolución</button></div>)}</div></section>;
}

function KpiCard({ label, value, detail, icon, tone, trend, trendLabel }: { label: string; value: string; detail: string; icon: React.ReactNode; tone: string; trend: string; trendLabel: string }) { return <div className="kpi-card"><div className="kpi-top"><div className={`kpi-icon ${tone}`}>{icon}</div><span className={`kpi-trend ${tone}`}>{trend}</span></div><div className="kpi-value">{value}</div><div className="kpi-label">{label}</div><div className="kpi-footer"><span>{detail}</span><span>{trendLabel}</span></div></div>; }

function ActivityRow({ movement }: { movement: Movement }) { return <div className="activity-row"><div className={`activity-icon ${movement.type === "Recepción" ? "in" : movement.type === "Traslado" ? "move" : "out"}`}><AppIcon type={movement.type} /></div><div className="activity-copy"><strong>{movement.type} <span>·</span> {movement.tool}</strong><span>{movement.worker} · {movement.workerCode}</span></div><div className="activity-time">{movement.time}<small>{movement.quantity} ud.</small></div></div>; }

function ToolMiniCard({ tool, onMovement }: { tool: Tool; onMovement: (type: MovementType, toolId?: string) => void }) { return <div className="tool-mini-card"><div className="tool-mini-image"><img src={tool.image} alt={tool.name} /><span className={`status-pill ${statusClass(tool.status)}`}>{tool.status}</span></div><div className="tool-mini-body"><span className="tool-code">{tool.code}</span><strong>{tool.name}</strong><span className="tool-location"><MapPin size={12} />{tool.location}</span><div className="tool-mini-footer"><span><b>{tool.available}</b>/{tool.stock} disp.</span><button onClick={() => onMovement("Despacho", tool.id)} aria-label={`Despachar ${tool.name}`}><ArrowUpFromLine size={14} /></button></div></div></div>; }

function InventoryView({ tools, search, setSearch, filterStatus, setFilterStatus, onMovement, onAdd }: { tools: Tool[]; search: string; setSearch: (value: string) => void; filterStatus: "Todos" | ToolStatus; setFilterStatus: (value: "Todos" | ToolStatus) => void; onMovement: (type: MovementType, toolId?: string) => void; onAdd: () => void }) { return <section className="inventory-view"><div className="view-toolbar"><div className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por código, nombre o ubicación..." /><kbd>⌘ K</kbd></div><div className="filter-group"><SlidersHorizontal size={15} /><select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value as "Todos" | ToolStatus)}><option>Todos</option><option>Disponible</option><option>Prestada</option><option>Mantenimiento</option><option>Baja</option></select></div><button className="button button-primary" onClick={onAdd}><Plus size={16} />Agregar</button></div><div className="inventory-summary"><span><strong>{tools.length}</strong> herramientas visibles</span><span className="summary-note"><span className="legend-dot green" />Disponible <span className="legend-dot orange" />Prestada <span className="legend-dot red" />Mantenimiento</span></div>{tools.length ? <div className="inventory-grid">{tools.map((tool) => <ToolCard key={tool.id} tool={tool} onMovement={onMovement} />)}</div> : <div className="empty-state"><Search size={28} /><strong>No encontramos herramientas</strong><span>Prueba con otro código, nombre o ubicación.</span></div>}</section>; }

function ToolCard({ tool, onMovement }: { tool: Tool; onMovement: (type: MovementType, toolId?: string) => void }) { return <article className="tool-card"><div className="tool-card-image"><img src={tool.image} alt={tool.name} /><div className="image-overlay"><button onClick={() => onMovement("Despacho", tool.id)}><ArrowUpFromLine size={15} />Despachar</button></div><span className={`status-pill ${statusClass(tool.status)}`}>{tool.status}</span></div><div className="tool-card-content"><div className="tool-card-top"><span className="tool-code">{tool.code}</span><button className="more-button" aria-label="Más opciones"><span>•••</span></button></div><h3>{tool.name}</h3><p className="tool-brand">{tool.brand} <span>·</span> {tool.category}</p><div className="tool-card-meta"><div><span>Ubicación</span><strong><MapPin size={13} />{tool.location}</strong></div><div><span>Disponibilidad</span><strong className={tool.available === 0 ? "text-danger" : ""}>{tool.available} de {tool.stock} uds.</strong></div></div><div className="tool-card-bottom"><span><Activity size={13} />{tool.rotations} salidas este mes</span><span className="last-movement">{tool.lastMovement}</span></div></div></article>; }

function MovementsView({ movements, onMovement }: { movements: Movement[]; onMovement: (type: MovementType) => void }) { return <section className="data-view"><div className="view-toolbar"><div className="section-title-small"><ClipboardList size={19} /><span>Historial de movimientos</span></div><div className="toolbar-actions"><button className="button button-light"><FileText size={16} />Generar reporte</button><button className="button button-primary" onClick={() => onMovement("Despacho")}><Plus size={16} />Nuevo movimiento</button></div></div><div className="filter-tabs"><button className="active">Todos <b>{movements.length}</b></button><button>Despachos <b>{movements.filter((item) => item.type === "Despacho").length}</b></button><button>Recepciones <b>{movements.filter((item) => item.type === "Recepción").length}</b></button><button>Traslados <b>{movements.filter((item) => item.type === "Traslado").length}</b></button></div><div className="table-wrap"><table><thead><tr><th>Tipo</th><th>Herramienta</th><th>Trabajador</th><th>Fecha y hora</th><th>Cantidad</th><th>Observación</th><th /></tr></thead><tbody>{movements.map((movement) => <tr key={movement.id}><td><span className={`table-type ${movement.type === "Recepción" ? "in" : movement.type === "Traslado" ? "move" : "out"}`}><AppIcon type={movement.type} />{movement.type}</span></td><td><strong>{movement.tool}</strong><small>{movement.toolCode}</small></td><td><div className="table-person"><span className="avatar avatar-purple">{movement.worker.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><span><strong>{movement.worker}</strong><small>{movement.workerCode}</small></span></div></td><td>{movement.time}</td><td><strong>{movement.quantity}</strong> ud.</td><td className="note-cell">{movement.note}</td><td><button className="more-button">•••</button></td></tr>)}</tbody></table></div></section>; }

function PeopleView({ workers, movements, onMovement }: { workers: Worker[]; movements: Movement[]; onMovement: (type: MovementType) => void }) { return <section className="people-view"><div className="people-actions"><div className="search-field compact"><Search size={17} /><input placeholder="Buscar trabajador por nombre o código..." /></div><button className="button button-primary" onClick={() => onMovement("Despacho")}><Plus size={16} />Registrar para trabajador</button></div><div className="people-grid">{workers.map((worker) => { const workerMovements = movements.filter((item) => item.workerCode === worker.code); return <article className="person-card" key={worker.id}><div className="person-card-top"><div className="avatar avatar-large avatar-purple">{worker.initials}</div><span className={`person-status ${worker.active ? "active" : ""}`}>{worker.active ? "Activo" : "Inactivo"}</span></div><h3>{worker.name}</h3><span className="person-code">{worker.code}</span><p>{worker.area}</p><div className="person-stats"><div><strong>{worker.currentTools}</strong><span>en campo</span></div><div><strong>{workerMovements.length + 12}</strong><span>movimientos</span></div><div><strong>98%</strong><span>cumplimiento</span></div></div><button className="person-action" onClick={() => onMovement("Despacho")}>Ver ficha <span>→</span></button></article>; })}</div></section>; }

function ReportsView({ tools, topTools, onExport }: { tools: Tool[]; topTools: Tool[]; onExport: () => void }) { const max = topTools[0]?.rotations || 1; return <section className="reports-view"><div className="report-toolbar"><div className="period-selector"><CalendarDays size={16} /><span>01 sep — 30 sep 2026</span><ChevronDown size={15} /></div><button className="button button-light" onClick={onExport}><Download size={16} />Descargar CSV</button></div><div className="report-grid"><div className="panel chart-panel"><div className="panel-heading"><div><div className="panel-kicker">Frecuencia de salida</div><h2>Herramientas con mayor rotación</h2></div><span className="chart-total">{tools.reduce((sum, item) => sum + item.rotations, 0)} <small>salidas totales</small></span></div><div className="bar-chart">{topTools.map((tool) => <div className="bar-row" key={tool.id}><div className="bar-label"><strong>{tool.name}</strong><span>{tool.code}</span></div><div className="bar-track"><i style={{ width: `${(tool.rotations / max) * 100}%` }} /></div><b>{tool.rotations}</b></div>)}</div><div className="chart-legend"><span><i className="legend-swatch orange" />Salidas registradas</span><span><i className="legend-swatch grey" />Promedio histórico</span></div></div><div className="panel insight-panel"><div className="panel-kicker">Lectura operativa</div><h2>Decisiones para esta semana</h2><div className="insight-list"><div><span className="insight-icon orange"><ArrowUpFromLine size={16} /></span><p><strong>Taladros</strong> concentran el 30% de las salidas. Evalúa sumar una unidad de respaldo.</p></div><div><span className="insight-icon teal"><PackageCheck size={16} /></span><p><strong>Multímetros</strong> mantienen 100% de disponibilidad. Buen nivel de stock.</p></div><div><span className="insight-icon red"><TriangleAlert size={16} /></span><p><strong>7 devoluciones</strong> requieren seguimiento del almacenero.</p></div></div><button className="insight-button" onClick={() => window.print()}><FileText size={15} />Imprimir resumen</button></div></div><div className="panel category-panel"><div className="panel-heading"><div><div className="panel-kicker">Distribución del inventario</div><h2>Por categoría</h2></div></div><div className="category-bars">{["Eléctrica", "Manual", "Medición", "Sets"].map((category, index) => { const count = tools.filter((tool) => tool.category === category).reduce((sum, tool) => sum + tool.stock, 0); return <div className="category-row" key={category}><div><span className={`category-dot c-${index}`} />{category}</div><div className="category-track"><i style={{ width: `${Math.max(8, (count / Math.max(1, tools.reduce((sum, item) => sum + item.stock, 0))) * 100)}%` }} /></div><strong>{count} uds.</strong></div>; })}</div></div></section>; }

function MovementModal({ type, setType, toolId, setToolId, workerId, setWorkerId, quantity, setQuantity, note, setNote, tools, workers, onClose, onSubmit }: { type: MovementType; setType: (value: MovementType) => void; toolId: string; setToolId: (value: string) => void; workerId: string; setWorkerId: (value: string) => void; quantity: number; setQuantity: (value: number) => void; note: string; setNote: (value: string) => void; tools: Tool[]; workers: Worker[]; onClose: () => void; onSubmit: () => void }) { const tool = tools.find((item) => item.id === toolId); return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="modal-card"><div className="modal-header"><div><div className="eyebrow"><span className="eyebrow-dot" />Registro de movimiento</div><h2>{type === "Despacho" ? "Despachar herramienta" : type === "Recepción" ? "Recepcionar devolución" : "Registrar traslado"}</h2><p>El almacenero registra la trazabilidad del movimiento.</p></div><button className="modal-close" onClick={onClose}><X size={18} /></button></div><div className="movement-tabs"><button className={type === "Despacho" ? "active" : ""} onClick={() => setType("Despacho")}><ArrowUpFromLine size={16} />Despacho</button><button className={type === "Recepción" ? "active" : ""} onClick={() => setType("Recepción")}><ArrowDownToLine size={16} />Recepción</button><button className={type === "Traslado" ? "active" : ""} onClick={() => setType("Traslado")}><RotateCcw size={16} />Traslado</button></div><div className="form-grid"><label><span>Código del trabajador</span><div className="select-wrap"><UserRound size={16} /><select value={workerId} onChange={(event) => setWorkerId(event.target.value)}>{workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.code} · {worker.name}</option>)}</select><ChevronDown size={15} /></div></label><label><span>Herramienta</span><div className="select-wrap"><Boxes size={16} /><select value={toolId} onChange={(event) => setToolId(event.target.value)}>{tools.filter((item) => item.status !== "Baja").map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select><ChevronDown size={15} /></div></label><label><span>Cantidad</span><div className="number-field"><button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><input type="number" min="1" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))} /><button onClick={() => setQuantity(quantity + 1)}>+</button></div></label><label><span>Fecha y hora</span><div className="read-only-field"><CalendarDays size={16} />10 sep 2026 · 08:51</div></label><label className="full-field"><span>Observaciones <small>Opcional</small></span><textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder={type === "Recepción" ? "Estado de la herramienta, accesorios, daños..." : "Frente de trabajo, motivo o destino..."} /></label></div><div className="modal-tool-preview"><img src={tool?.image} alt="" /><div><strong>{tool?.name}</strong><span>{tool?.location} · <b>{tool?.available} disponibles</b></span></div><span className={`status-pill ${statusClass(tool?.status || "Disponible")}`}>{tool?.status}</span></div><div className="modal-footer"><button className="button button-light" onClick={onClose}>Cancelar</button><button className="button button-primary" onClick={onSubmit}><Check size={16} />Confirmar {type.toLowerCase()}</button></div></div></div>; }

function ToolModal({ onClose, onCreate }: { onClose: () => void; onCreate: () => void }) { return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="modal-card small-modal"><div className="modal-header"><div><div className="eyebrow"><span className="eyebrow-dot" />Alta de inventario</div><h2>Nueva herramienta</h2><p>Agrega una ficha inicial al catálogo.</p></div><button className="modal-close" onClick={onClose}><X size={18} /></button></div><div className="form-grid"><label><span>Nombre de la herramienta</span><input placeholder="Ej. Llave dinamométrica" /></label><label><span>Código interno</span><input placeholder="Se genera automáticamente" disabled /></label><label><span>Categoría</span><div className="select-wrap"><Boxes size={16} /><select defaultValue="Manual"><option>Manual</option><option>Eléctrica</option><option>Medición</option><option>Sets</option></select><ChevronDown size={15} /></div></label><label><span>Cantidad inicial</span><input type="number" defaultValue="1" min="1" /></label><label className="full-field"><span>Ubicación</span><input placeholder="Ej. Estante 02 · A-07" /></label><div className="upload-placeholder full-field"><Plus size={20} /><span><strong>Sube una fotografía</strong><small>JPG o PNG · Máx. 5 MB</small></span></div></div><div className="modal-footer"><button className="button button-light" onClick={onClose}>Cancelar</button><button className="button button-primary" onClick={onCreate}><Check size={16} />Crear herramienta</button></div></div></div>; }
