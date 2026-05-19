require("dotenv").config();
const express = require("express");
const cors = require("cors");
const errorHandler = require("./middleware/errorHandler");

const noticiasRouter = require("./routes/noticias");
const testimoniosRouter = require("./routes/testimonios");
const galeriaRouter = require("./routes/galeria");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

// Health check
app.get("/", (req, res) => res.json({ status: "ok", message: "API Colegio José Arrieta" }));

// Rutas
app.use("/api/noticias", noticiasRouter);
app.use("/api/testimonios", testimoniosRouter);
app.use("/api/galeria", galeriaRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
