const prisma = require("../lib/prisma");
const { isValidHttpsUrl } = require("../lib/validators");
const { assertHasFields, makeDeleteHandler } = require("../lib/controllerHelpers");

// GET /api/noticias
async function getNoticias(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 6));
    const search = (req.query.search || "").slice(0, 100);
    const skip = (page - 1) * limit;

    const where = search
      ? { titulo: { contains: search, mode: "insensitive" } }
      : {};

    const [data, total] = await Promise.all([
      prisma.noticia.findMany({ where, orderBy: { fecha: "desc" }, skip, take: limit }),
      prisma.noticia.count({ where }),
    ]);

    res.json({
      data,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      total,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/noticias/id/:id (admin)
async function getNoticiaById(req, res, next) {
  try {
    const noticia = await prisma.noticia.findUnique({
      where: { id: req.params.id },
    });
    if (!noticia) return res.status(404).json({ error: "Noticia no encontrada" });
    res.json(noticia);
  } catch (err) {
    next(err);
  }
}

// GET /api/noticias/:slug
async function getNoticiaPorSlug(req, res, next) {
  try {
    const noticia = await prisma.noticia.findUnique({
      where: { slug: req.params.slug },
    });
    if (!noticia) return res.status(404).json({ error: "Noticia no encontrada" });
    res.json(noticia);
  } catch (err) {
    next(err);
  }
}

// POST /api/noticias
async function crearNoticia(req, res, next) {
  try {
    const { titulo, slug, extracto, contenido, imagen, categoria, fecha } = req.body;

    if (!titulo || !slug) {
      return res.status(400).json({ error: "titulo y slug son obligatorios" });
    }

    const data = { titulo, slug };
    if (extracto !== undefined) data.extracto = extracto;
    if (contenido !== undefined) data.contenido = contenido;
    if (imagen !== undefined && imagen !== null && imagen !== "") {
      if (!isValidHttpsUrl(imagen)) return res.status(400).json({ error: "imagen debe ser una URL https válida" });
      data.imagen = imagen;
    }
    if (categoria !== undefined) data.categoria = categoria;
    if (fecha !== undefined) {
      const parsed = new Date(fecha);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ error: "fecha no es una fecha válida" });
      }
      data.fecha = parsed;
    }

    const noticia = await prisma.noticia.create({ data });
    res.status(201).json(noticia);
  } catch (err) {
    next(err);
  }
}

// PUT /api/noticias/:id
async function actualizarNoticia(req, res, next) {
  try {
    const { titulo, slug, extracto, contenido, categoria, fecha } = req.body;

    const data = {};
    if (titulo !== undefined) data.titulo = titulo;
    if (slug !== undefined) data.slug = slug;
    if (extracto !== undefined) data.extracto = extracto;
    if (contenido !== undefined) data.contenido = contenido;
    if (categoria !== undefined) data.categoria = categoria;
    if (fecha !== undefined) {
      const parsed = new Date(fecha);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ error: "fecha no es una fecha válida" });
      }
      data.fecha = parsed;
    }

    // Permitir borrar imagen enviando null o string vacío
    if ("imagen" in req.body) {
      const img = req.body.imagen;
      if (img === null || img === "") {
        data.imagen = null;
      } else {
        if (!isValidHttpsUrl(img)) return res.status(400).json({ error: "imagen debe ser una URL https válida" });
        data.imagen = img;
      }
    }

    if (!assertHasFields(data, res)) return;

    const noticia = await prisma.noticia.update({
      where: { id: req.params.id },
      data,
    });
    res.json(noticia);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/noticias/:id
const eliminarNoticia = makeDeleteHandler("noticia", "Noticia");

module.exports = { getNoticias, getNoticiaPorSlug, getNoticiaById, crearNoticia, actualizarNoticia, eliminarNoticia };
