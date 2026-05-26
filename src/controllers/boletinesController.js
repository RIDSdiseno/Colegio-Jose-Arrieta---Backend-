const prisma = require("../lib/prisma");
const { isValidUrl } = require("../lib/validators");
const { assertHasFields, makeDeleteHandler } = require("../lib/controllerHelpers");

// GET /api/boletines — público, solo activos ordenados
async function getBoletines(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 6, 50);
    const boletines = await prisma.boletin.findMany({
      where: { activo: true },
      orderBy: [{ orden: "asc" }, { fecha: "desc" }],
      take: limit,
    });
    res.json(boletines);
  } catch (err) {
    next(err);
  }
}

// GET /api/boletines/admin — admin, todos
async function getBoletinesAdmin(req, res, next) {
  try {
    const boletines = await prisma.boletin.findMany({
      orderBy: [{ orden: "asc" }, { fecha: "desc" }],
    });
    res.json(boletines);
  } catch (err) {
    next(err);
  }
}

// GET /api/boletines/id/:id — admin
async function getBoletinById(req, res, next) {
  try {
    const boletin = await prisma.boletin.findUnique({ where: { id: req.params.id } });
    if (!boletin) return res.status(404).json({ error: "Boletín no encontrado" });
    res.json(boletin);
  } catch (err) {
    next(err);
  }
}

// POST /api/boletines — admin
async function crearBoletin(req, res, next) {
  try {
    const { titulo, fecha, link, isPdf, imagen, activo, orden } = req.body;
    if (!titulo || !link) {
      return res.status(400).json({ error: "titulo y link son obligatorios" });
    }

    if (!isValidUrl(link)) {
      return res.status(400).json({ error: "link debe ser una URL válida" });
    }

    const boletin = await prisma.boletin.create({
      data: {
        titulo,
        fecha: fecha ? new Date(fecha) : new Date(),
        link,
        isPdf: isPdf !== undefined ? Boolean(isPdf) : true,
        imagen: imagen || null,
        activo: activo !== undefined ? Boolean(activo) : true,
        orden: orden !== undefined ? parseInt(orden) : 0,
      },
    });
    res.status(201).json(boletin);
  } catch (err) {
    next(err);
  }
}

// PUT /api/boletines/:id — admin
async function actualizarBoletin(req, res, next) {
  try {
    const { titulo, fecha, link, isPdf, imagen, activo, orden } = req.body;
    const data = {};
    if (titulo !== undefined) data.titulo = titulo;
    if (fecha !== undefined) {
      const parsed = new Date(fecha);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ error: "fecha no es una fecha válida" });
      }
      data.fecha = parsed;
    }
    if (link !== undefined) {
      if (!isValidUrl(link)) {
        return res.status(400).json({ error: "link debe ser una URL válida" });
      }
      data.link = link;
    }
    if (isPdf !== undefined) data.isPdf = Boolean(isPdf);
    if (imagen !== undefined) data.imagen = imagen || null;
    if (activo !== undefined) data.activo = Boolean(activo);
    if (orden !== undefined) data.orden = parseInt(orden);

    if (!assertHasFields(data, res)) return;

    const boletin = await prisma.boletin.update({ where: { id: req.params.id }, data });
    res.json(boletin);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/boletines/:id — admin
const eliminarBoletin = makeDeleteHandler("boletin", "Boletín");

module.exports = { getBoletines, getBoletinesAdmin, getBoletinById, crearBoletin, actualizarBoletin, eliminarBoletin };
