import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import multer from "multer";
import { getSessionUser } from "../internalSession";
import { importPersonalCsv, importToolsCsv } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
  const multipartImport = (kind: "tools" | "personal") => [upload.single("file"), async (req: express.Request, res: express.Response) => {
    try {
      const user = await getSessionUser(req);
      if (!user) return res.status(401).json({ ok: false, message: "Debes iniciar sesión para importar datos." });
      if (user.rol !== "Admin") return res.status(403).json({ ok: false, message: "Solo un Administrador puede importar archivos." });
      if (!req.file) return res.status(400).json({ ok: false, message: "Adjunta un archivo CSV en el campo 'file'." });
      const text = req.file.buffer.toString("utf8").replace(/^\uFEFF/, "");
      const result = kind === "tools" ? await importToolsCsv(text) : await importPersonalCsv(text);
      return res.status(200).json({ ok: true, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo procesar el archivo CSV.";
      const status = error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "CONFLICT" ? 409 : 400;
      return res.status(status).json({ ok: false, message });
    }
  }];
  app.post("/api/import/tools", ...multipartImport("tools"));
  app.post("/api/import/personal", ...multipartImport("personal"));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
