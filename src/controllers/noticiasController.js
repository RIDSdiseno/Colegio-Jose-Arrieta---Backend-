const prisma = require("../lib/prisma");

// GET /api/noticias
async function getNoticias(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 6));
    const search = req.query.search || "";
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
    if (imagen !== undefined) data.imagen = imagen;
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
    const { titulo, slug, extracto, contenido, imagen, categoria, fecha } = req.body;

    const data = {};
    if (titulo !== undefined) data.titulo = titulo;
    if (slug !== undefined) data.slug = slug;
    if (extracto !== undefined) data.extracto = extracto;
    if (contenido !== undefined) data.contenido = contenido;
    if (imagen !== undefined) data.imagen = imagen;
    if (categoria !== undefined) data.categoria = categoria;
    if (fecha !== undefined) {
      const parsed = new Date(fecha);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ error: "fecha no es una fecha válida" });
      }
      data.fecha = parsed;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No se enviaron campos para actualizar" });
    }

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
async function eliminarNoticia(req, res, next) {
  try {
    await prisma.noticia.delete({ where: { id: req.params.id } });
    res.json({ message: "Noticia eliminada" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getNoticias, getNoticiaPorSlug, crearNoticia, actualizarNoticia, eliminarNoticia };
