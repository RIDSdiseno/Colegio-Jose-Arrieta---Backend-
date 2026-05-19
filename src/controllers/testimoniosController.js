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
    const testimonio = await prisma.testimonio.create({ data: req.body });
    res.status(201).json(testimonio);
  } catch (err) {
    next(err);
  }
}

// PUT /api/testimonios/:id
async function actualizarTestimonio(req, res, next) {
  try {
    const testimonio = await prisma.testimonio.update({
      where: { id: req.params.id },
      data: req.body,
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
