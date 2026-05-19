require("dotenv").config();
const express = require("express");
const cors = require("cors");
const prisma = require("./lib/prisma");
const errorHandler = require("./middleware/errorHandler");

const noticiasRouter = require("./routes/noticias");
const testimoniosRouter = require("./routes/testimonios");
const galeriaRouter = require("./routes/galeria");

const app = express();
const PORT = process.env.PORT || 4000;

// CORS — si FRONTEND_URL no está definido, bloquear todo origen cruzado
const allowedOrigin = process.env.FRONTEND_URL;
if (!allowedOrigin) {
  console.warn("ADVERTENCIA: FRONTEND_URL no definido — CORS bloqueará peticiones de origen cruzado");
}
app.use(cors({ origin: allowedOrigin || false }));

app.use(express.json());

// Health check
app.get("/", (req, res) => res.json({ status: "ok", message: "API Colegio José Arrieta" }));

// Rutas
app.use("/api/noticias", noticiasRouter);
app.use("/api/testimonios", testimoniosRouter);
app.use("/api/galeria", galeriaRouter);

// 404 para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Error handler
app.use(errorHandler);

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
