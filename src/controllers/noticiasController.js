const prisma = require("../lib/prisma");

// GET /api/noticias
async function getNoticias(req, res, next) {
  try {
    const { page = 1, limit = 6, search = "" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search
      ? { titulo: { contains: search, mode: "insensitive" } }
      : {};

    const [data, total] = await Promise.all([
      prisma.noticia.findMany({
        where,
        orderBy: { fecha: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.noticia.count({ where }),
    ]);

    res.json({
      data,
      page: Number(page),
      totalPages: Math.max(1, Math.ceil(total / Number(limit))),
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
    const noticia = await prisma.noticia.create({ data: req.body });
    res.status(201).json(noticia);
  } catch (err) {
    next(err);
  }
}

// PUT /api/noticias/:id
async function actualizarNoticia(req, res, next) {
  try {
    const noticia = await prisma.noticia.update({
      where: { id: req.params.id },
      data: req.body,
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
