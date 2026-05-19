function errorHandler(err, req, res, next) {
  console.error(err);

  // Prisma: registro no encontrado
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Registro no encontrado" });
  }

  // Prisma: violación de unique (ej. slug duplicado)
  if (err.code === "P2002") {
    const field = err.meta?.target?.join(", ") || "campo";
    return res.status(409).json({ error: `Ya existe un registro con ese ${field}` });
  }

  // No exponer mensajes internos de Prisma al cliente
  if (err.code?.startsWith("P")) {
    return res.status(500).json({ error: "Error de base de datos" });
  }

  const status = err.status || 500;
  // Solo exponer el mensaje si fue un error intencional de la API (tiene .status)
  const safeMessage = err.status ? err.message : "Error interno del servidor";
  res.status(status).json({ error: safeMessage || "Error interno del servidor" });
}

module.exports = errorHandler;
