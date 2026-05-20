require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const prisma = require("./lib/prisma");
const errorHandler = require("./middleware/errorHandler");

const noticiasRouter = require("./routes/noticias");
const testimoniosRouter = require("./routes/testimonios");
const galeriaRouter = require("./routes/galeria");
const albumsRouter = require("./routes/albums");

const app = express();
const PORT = process.env.PORT || 4000;

// CORS — si FRONTEND_URL no está definido, bloquear todo origen cruzado
const allowedOrigin = process.env.FRONTEND_URL;
if (!allowedOrigin) {
  console.warn("ADVERTENCIA: FRONTEND_URL no definido — CORS bloqueará peticiones de origen cruzado");
}
app.set("trust proxy", 1);
app.use(cors({ origin: allowedOrigin || false }));

app.use(express.json({ limit: "1mb" }));

// Rate limiting — 120 peticiones por minuto por IP
app.use(rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false }));

// Health check
app.get("/", (req, res) => res.json({ status: "ok", message: "API Colegio José Arrieta" }));

// Rutas
app.use("/api/noticias", noticiasRouter);
app.use("/api/testimonios", testimoniosRouter);
app.use("/api/galeria", galeriaRouter);
app.use("/api/albums", albumsRouter);

// 404 para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Error handler
app.use(errorHandler);

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM recibido, cerrando servidor...");
  await prisma.$disconnect();
  process.exit(0);
});

// Iniciar servidor solo si la BD responde
prisma.$connect()
  .then(() => {
    console.log("Conectado a la base de datos");
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("No se pudo conectar a la base de datos:", err.message);
    process.exit(1);
  });
