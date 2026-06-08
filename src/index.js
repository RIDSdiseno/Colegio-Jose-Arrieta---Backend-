require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const prisma = require("./lib/prisma");
const errorHandler = require("./middleware/errorHandler");

const noticiasRouter = require("./routes/noticias");
const testimoniosRouter = require("./routes/testimonios");
const albumsRouter = require("./routes/albums");
const videosRouter = require("./routes/videos");
const documentosRouter = require("./routes/documentos");

const app = express();
const PORT = process.env.PORT || 4000;

// CORS — si FRONTEND_URL no está definido, bloquear todo origen cruzado
const allowedOrigin = process.env.FRONTEND_URL;
if (!allowedOrigin) {
  console.warn("ADVERTENCIA: FRONTEND_URL no definido — CORS bloqueará peticiones de origen cruzado");
}
app.set("trust proxy", 1);
// helmet agrega headers de seguridad estándar; se desactiva CSP porque es una API JSON pura (sin HTML)
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: allowedOrigin || false }));

app.use(express.json({ limit: "1mb" }));

// Rate limiting global — 120 peticiones por minuto por IP (lecturas públicas)
const globalLimiter = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false });
// Rate limiting estricto — 20 peticiones por minuto por IP (escrituras admin)
const writeLimiter = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false });

// Aplica writeLimiter solo a métodos de escritura, globalLimiter cubre el resto
const withWriteLimit = (router) => [
  (req, res, next) => ["POST", "PUT", "DELETE"].includes(req.method) ? writeLimiter(req, res, next) : next(),
  router,
];

app.use(globalLimiter);

// Health check — no expone información del proyecto
app.get("/", (req, res) => res.json({ status: "ok" }));

// Rutas
app.use("/api/noticias",    ...withWriteLimit(noticiasRouter));
app.use("/api/testimonios", ...withWriteLimit(testimoniosRouter));
app.use("/api/albums",      ...withWriteLimit(albumsRouter));
app.use("/api/videos",      ...withWriteLimit(videosRouter));
app.use("/api/documentos",  ...withWriteLimit(documentosRouter));

// 404 para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Error handler
app.use(errorHandler);

// Graceful shutdown
async function shutdown(signal) {
  console.log(`${signal} recibido, cerrando servidor...`);
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Iniciar servidor solo si la BD responde
prisma.$connect()
  .then(async () => {
    try {
      await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS unaccent;`;
    } catch {
      console.warn("No se pudo habilitar la extensión unaccent (se requieren permisos de superusuario). La búsqueda sin tildes no estará disponible.");
    }
    console.log("Conectado a la base de datos");
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("No se pudo conectar a la base de datos:", err.message);
    process.exit(1);
  });
