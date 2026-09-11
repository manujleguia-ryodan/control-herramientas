from pathlib import Path
root=Path('/home/ubuntu/control-herramientas')
db=root/'server/db.ts'
s=db.read_text()
# Remove any partial insertion if present
start=s.find('export type RetirementReportInput')
marker='export async function createPersonal('
if start>=0:
    end=s.find(marker,start)
    s=s[:start]+s[end:]
if 'import PDFDocument' not in s:
    s=s.replace('import { hashPin } from "./pinAuth";', 'import { hashPin } from "./pinAuth";\nimport fs from "node:fs/promises";\nimport path from "node:path";\nimport PDFDocument from "pdfkit";')
fn=r'''export type RetirementReportInput = { idTag: string; motivo: string; fechaIncidente: number; supervisorCodigo: string; usuarioBaja: number; photos: Array<{ buffer: Buffer; originalname: string; mimetype: string }> };

function safeFilePart(value: string) { return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80); }

export async function createRetirementReport(input: RetirementReportInput) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const tool = (await db.select().from(catalogoHerramientas).where(eq(catalogoHerramientas.idTag, input.idTag)).limit(1))[0];
  const supervisor = (await db.select().from(catalogoPersonal).where(eq(catalogoPersonal.codigoTrabajador, input.supervisorCodigo)).limit(1))[0];
  const user = (await db.select().from(usuarios).where(eq(usuarios.id, input.usuarioBaja)).limit(1))[0];
  if (!tool) throw new TRPCError({ code: "NOT_FOUND", message: "La herramienta no existe." });
  if (!supervisor) throw new TRPCError({ code: "BAD_REQUEST", message: "Selecciona un supervisor válido." });
  if (!input.motivo.trim()) throw new TRPCError({ code: "BAD_REQUEST", message: "El motivo es obligatorio." });
  const now = input.fechaIncidente || Date.now();
  const baseDir = path.join(process.cwd(), "storage", "bajas", safeFilePart(input.idTag));
  await fs.mkdir(baseDir, { recursive: true });
  const photoPaths: string[] = [];
  for (let i = 0; i < Math.min(input.photos.length, 5); i++) {
    const photo = input.photos[i];
    const ext = path.extname(photo.originalname).toLowerCase() || ".jpg";
    const target = path.join(baseDir, `${i + 1}${ext}`);
    await fs.writeFile(target, photo.buffer);
    photoPaths.push(target);
  }
  const datePart = new Date(now).toISOString().slice(0, 10).replace(/-/g, "");
  const pdfNombre = `Reporte_FS_${safeFilePart(input.idTag)}_${datePart}.pdf`;
  const pdfPath = path.join(baseDir, pdfNombre);
  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const out = require("node:fs").createWriteStream(pdfPath);
    doc.pipe(out);
    doc.fontSize(16).font("Helvetica-Bold").text("REPORTE DE HERRAMIENTA FUERA DE SERVICIO", { align: "center" });
    doc.moveDown(1.5).fontSize(10).font("Helvetica");
    const lines = [
      ["Herramienta", tool.descripcion], ["Código", tool.idTag],
      ["Fecha/Hora", new Date(now).toLocaleString("es-PE", { timeZone: "America/Lima" })],
      ["Almacenero Responsable", user?.nombre ?? `Usuario #${input.usuarioBaja}`],
      ["Supervisor Responsable", `${supervisor.nombreCompleto} (${supervisor.codigoTrabajador})`],
      ["Descripción del Evento", input.motivo.trim()],
    ];
    for (const [label, value] of lines) { doc.font("Helvetica-Bold").text(`${label}:`, { continued: true }); doc.font("Helvetica").text(` ${value}`); doc.moveDown(.45); }
    if (photoPaths.length) {
      doc.moveDown(.8).font("Helvetica-Bold").text("Evidencias fotográficas").moveDown(.5);
      let x = 48; let y = doc.y;
      for (const photoPath of photoPaths) {
        try { doc.image(photoPath, x, y, { fit: [235, 155], align: "center", valign: "center" }); } catch {}
        x += 250;
        if (x > 300) { x = 48; y += 175; if (y > 650) { doc.addPage(); y = 48; } }
      }
    }
    doc.end(); out.on("finish", () => resolve()); out.on("error", reject);
  });
  await db.transaction(async (tx) => {
    await tx.update(catalogoHerramientas).set({ estadoActivo: 0 }).where(eq(catalogoHerramientas.idTag, input.idTag));
    await tx.insert(bajasHerramientas).values({ idTag: input.idTag, motivo: input.motivo.trim(), fechaIncidente: now, trabajadorResponsable: supervisor.nombreCompleto, usuarioBaja: input.usuarioBaja, supervisorCodigo: supervisor.codigoTrabajador, pdfNombre, fotosJson: JSON.stringify(photoPaths) });
  });
  return { pdfPath, pdfNombre, tool: input.idTag };
}

'''
s=s.replace(marker,fn+marker)
db.write_text(s)

idx=root/'server/_core/index.ts'; i=idx.read_text()
i=i.replace('import { importPersonalCsv, importToolsCsv } from "../db";', 'import { createRetirementReport, importPersonalCsv, importToolsCsv } from "../db";')
i=i.replace('limits: { fileSize: 5 * 1024 * 1024, files: 1 }', 'limits: { fileSize: 5 * 1024 * 1024, files: 5 }')
route=r'''  app.post("/api/retirements/report", upload.array("photos", 5), async (req: express.Request, res: express.Response) => {
    try {
      const user = await getSessionUser(req);
      if (!user) return res.status(401).json({ ok: false, message: "Debes iniciar sesión." });
      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      if (files.length > 5) return res.status(400).json({ ok: false, message: "Puedes adjuntar máximo 5 fotos." });
      const result = await createRetirementReport({ idTag: String(req.body.idTag ?? ""), motivo: String(req.body.motivo ?? ""), fechaIncidente: Number(req.body.fechaIncidente ?? Date.now()), supervisorCodigo: String(req.body.supervisorCodigo ?? ""), usuarioBaja: user.id, photos: files });
      return res.download(result.pdfPath, result.pdfNombre, (error) => { if (error && !res.headersSent) res.status(500).json({ ok: false, message: "No se pudo descargar el PDF." }); });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo generar el reporte.";
      const code = error and hasattr(error, "code") and str(error.code) or ""
      return res.status(code == "NOT_FOUND" and 404 or code == "CONFLICT" and 409 or 400).json({ ok: false, message });
    }
  });
'''
# fix Python-generated JS ternary line
route=route.replace('const code = error and hasattr(error, "code") and str(error.code) or ""','const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";').replace('code == "NOT_FOUND" and 404 or code == "CONFLICT" and 409 or 400','code === "NOT_FOUND" ? 404 : code === "CONFLICT" ? 409 : 400')
i=i.replace('  app.post("/api/import/tools", ...multipartImport("tools"));',route+'  app.post("/api/import/tools", ...multipartImport("tools"));')
idx.write_text(i)
