const prisma = require("../lib/prisma");
const { HEX_COLOR, parseEstrellas, checkLength } = require("../lib/validators");
const { assertHasFields, assertValidId, makeDeleteHandler } = require("../lib/controllerHelpers");

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
  if (!assertValidId(req.params.id, res)) return;
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

    if (!nombre?.trim() || !texto?.trim()) {
      return res.status(400).json({ error: "nombre y texto son obligatorios" });
    }

    for (const [field, value] of [["nombre", nombre], ["cargo", cargo], ["texto", texto]]) {
      if (value !== undefined) {
        const check = checkLength(field, value);
        if (!check.ok) return res.status(400).json({ error: check.error });
      }
    }

    const data = { nombre: nombre.trim(), texto: texto.trim() };
    if (cargo !== undefined) data.cargo = cargo.trim();
    if (color !== undefined) {
      if (!HEX_COLOR.test(color)) return res.status(400).json({ error: "color debe ser un valor hex válido (ej: #1e3a5f)" });
      data.color = color;
    }
    if (activo !== undefined) data.activo = Boolean(activo);
    if (estrellas !== undefined) {
      const result = parseEstrellas(estrellas);
      if (!result.ok) return res.status(400).json({ error: result.error });
      data.estrellas = result.value;
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
    if (!assertValidId(req.params.id, res)) return;
    const { nombre, cargo, texto, estrellas, color, activo } = req.body;

    for (const [field, value] of [["nombre", nombre], ["cargo", cargo], ["texto", texto]]) {
      if (value !== undefined) {
        const check = checkLength(field, value);
        if (!check.ok) return res.status(400).json({ error: check.error });
      }
    }

    if (nombre !== undefined && !nombre.trim())
      return res.status(400).json({ error: "nombre no puede estar vacío" });
    if (texto !== undefined && !texto.trim())
      return res.status(400).json({ error: "texto no puede estar vacío" });

    const data = {};
    if (nombre !== undefined) data.nombre = nombre.trim();
    if (cargo !== undefined) data.cargo = cargo.trim();
    if (texto !== undefined) data.texto = texto.trim();
    if (color !== undefined) {
      if (!HEX_COLOR.test(color)) return res.status(400).json({ error: "color debe ser un valor hex válido (ej: #1e3a5f)" });
      data.color = color;
    }
    if (activo !== undefined) data.activo = Boolean(activo);
    if (estrellas !== undefined) {
      const result = parseEstrellas(estrellas);
      if (!result.ok) return res.status(400).json({ error: result.error });
      data.estrellas = result.value;
    }

    if (!assertHasFields(data, res)) return;

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
const eliminarTestimonio = makeDeleteHandler("testimonio", "Testimonio");

module.exports = { getTestimonios, getTestimonioById, getTestimoniosAdmin, crearTestimonio, actualizarTestimonio, eliminarTestimonio };
