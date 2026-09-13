from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s=p.read_text()
s=s.replace('retirementWorker?: string | null };','retirementWorker?: string | null; reportPdfName?: string | null };')
marker='  const downloadMovementPdf = () => {'
helper='''  const downloadRetirementReport = async (tool: Tool, format: "pdf" | "xlsx") => {\n    try {\n      const response = await fetch(`/api/retirements/report/${encodeURIComponent(tool.code)}?format=${format}`, { credentials: "include" });\n      if (!response.ok) { const payload = await response.json().catch(() => ({})); throw new Error(payload.message || `Error ${response.status} al descargar el reporte.`); }\n      const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `Reporte_FS_${tool.code}.${format}`; link.click(); URL.revokeObjectURL(url); notify(`Reporte ${format.toUpperCase()} descargado correctamente`);\n    } catch (error) { notify(error instanceof Error ? error.message : "No se pudo descargar el reporte."); }\n  };\n'''
if marker not in s: raise SystemExit('download marker not found')
s=s.replace(marker,helper+marker)
old='{me.data!.role === "admin" && <button className="pos-danger" disabled={deleteToolMutation.isPending} onClick={() => void deleteTool(tool)}><Trash2 size={15} />Eliminar repuesto</button>}'
new='''<div className="retired-report-actions"><button className="pos-secondary" onClick={() => void downloadRetirementReport(tool, "pdf")}><FileText size={15} />Descargar reporte PDF</button><button className="pos-secondary" onClick={() => void downloadRetirementReport(tool, "xlsx")}><Download size={15} />Descargar reporte Excel XLSX</button></div>{me.data!.role === "admin" && <button className="pos-danger" disabled={deleteToolMutation.isPending} onClick={() => void deleteTool(tool)}><Trash2 size={15} />Eliminar repuesto</button>}'''
if old not in s: raise SystemExit('retired action marker not found')
s=s.replace(old,new)
p.write_text(s)
