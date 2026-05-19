const prisma = require("../lib/prisma");

// GET /api/testimonios
async function getTestimonios(req, res, next) {
  try {
    const data = await prisma.testimonio.findMany({
      where: { activo: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/testimonios/admin (todos, incluye inactivos)
async function getTestimoniosAdmin(req, res, next) {
  try {
    const data = await prisma.testimonio.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// POST /api/testimonios
async function crearTestimonio(req, res, next) {
  try {
    const { nombre, cargo, texto, estrellas, color, activo } = req.body;

    if (!nombre || !texto) {
      return res.status(400).json({ error: "nombre y texto son obligatorios" });
    }

    const testimonio = await prisma.testimonio.create({
      data: { nombre, cargo, texto, estrellas, color, activo },
    });
    res.status(201).json(testimonio);
  } catch (err) {
    next(err);
  }
}

// PUT /api/testimonios/:id
async function actualizarTestimonio(req, res, next) {
  try {
    const { nombre, cargo, texto, estrellas, color, activo } = req.body;

    const testimonio = await prisma.testimonio.update({
      where: { id: req.params.id },
      data: { nombre, cargo, texto, estrellas, color, activo },
    });
    res.json(testimonio);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/testimonios/:id
async function eliminarTestimonio(req, res, next) {
  try {
    await prisma.testimonio.delete({ where: { id: req.params.id } });
    res.json({ message: "Testimonio eliminado" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTestimonios, getTestimoniosAdmin, crearTestimonio, actualizarTestimonio, eliminarTestimonio };
