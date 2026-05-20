const prisma = require("../lib/prisma");
const { HEX_COLOR } = require("../lib/validators");

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

// GET /api/testimonios/:id (admin)
async function getTestimonioById(req, res, next) {
  try {
    const testimonio = await prisma.testimonio.findUnique({
      where: { id: req.params.id },
    });
    if (!testimonio) return res.status(404).json({ error: "Testimonio no encontrado" });
    res.json(testimonio);
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

    const data = { nombre, texto };
    if (cargo !== undefined) data.cargo = cargo;
    if (color !== undefined) {
      if (!HEX_COLOR.test(color)) return res.status(400).json({ error: "color debe ser un valor hex válido (ej: #1e3a5f)" });
      data.color = color;
    }
    if (activo !== undefined) data.activo = Boolean(activo);
    if (estrellas !== undefined) {
      const stars = parseInt(estrellas);
      if (isNaN(stars) || stars < 1 || stars > 5) {
        return res.status(400).json({ error: "estrellas debe ser un número entre 1 y 5" });
      }
      data.estrellas = stars;
    }

    const testimonio = await prisma.testimonio.create({ data });
    res.status(201).json(testimonio);
  } catch (err) {
    next(err);
  }
}

// PUT /api/testimonios/:id
async function actualizarTestimonio(req, res, next) {
  try {
    const { nombre, cargo, texto, estrellas, color, activo } = req.body;

    const data = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (cargo !== undefined) data.cargo = cargo;
    if (texto !== undefined) data.texto = texto;
    if (color !== undefined) {
      if (!HEX_COLOR.test(color)) return res.status(400).json({ error: "color debe ser un valor hex válido (ej: #1e3a5f)" });
      data.color = color;
    }
    if (activo !== undefined) data.activo = Boolean(activo);
    if (estrellas !== undefined) {
      const stars = parseInt(estrellas);
      if (isNaN(stars) || stars < 1 || stars > 5) {
        return res.status(400).json({ error: "estrellas debe ser un número entre 1 y 5" });
      }
      data.estrellas = stars;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No se enviaron campos para actualizar" });
    }

    const testimonio = await prisma.testimonio.update({
      where: { id: req.params.id },
      data,
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

module.exports = { getTestimonios, getTestimonioById, getTestimoniosAdmin, crearTestimonio, actualizarTestimonio, eliminarTestimonio };
