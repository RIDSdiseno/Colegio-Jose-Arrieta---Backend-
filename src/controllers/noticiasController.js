const { Prisma } = require("@prisma/client");
const prisma = require("../lib/prisma");
const { isValidHttpsUrl, checkLength } = require("../lib/validators");
const { assertHasFields, assertValidId, makeDeleteHandler } = require("../lib/controllerHelpers");

const CATEGORIAS_VALIDAS = ["General", "Académico", "Deportivo", "Cultural", "Institucional", "Comunidad"];

// GET /api/noticias
async function getNoticias(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 6));
    const search = (req.query.search || "").trim().slice(0, 100);
    const skip = (page - 1) * limit;

    let data, total;
    if (search) {
      const pattern = `%${search}%`;
      const limitVal = Prisma.sql`${limit}`;
      const skipVal = Prisma.sql`${skip}`;
      const [rows, countRows] = await Promise.all([
        // Columnas explícitas + fechas casteadas a text para que el formato sea
        // idéntico al que devuelve Prisma ORM (evita que el frontend reciba
        // tipos distintos según si hay búsqueda o no)
        prisma.$queryRaw`
          SELECT
            id,
            titulo,
            slug,
            extracto,
            contenido,
            imagen,
            categoria,
            fecha::text        AS fecha,
            created_at::text   AS "createdAt",
            updated_at::text   AS "updatedAt"
          FROM noticias
          WHERE unaccent(lower(titulo)) LIKE unaccent(lower(${pattern}))
          ORDER BY fecha DESC
          LIMIT ${limitVal} OFFSET ${skipVal}
        `,
        // ::int cast necesario — sin él Prisma retorna BigInt y Math.ceil falla
        prisma.$queryRaw`
          SELECT COUNT(*)::int AS count FROM noticias
          WHERE unaccent(lower(titulo)) LIKE unaccent(lower(${pattern}))
        `,
      ]);
      data = rows;
      total = countRows[0]?.count ?? 0;
    } else {
      [data, total] = await Promise.all([
        prisma.noticia.findMany({ orderBy: { fecha: "desc" }, skip, take: limit }),
        prisma.noticia.count(),
      ]);
    }

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
  if (!assertValidId(req.params.id, res)) return;
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
  const slug = req.params.slug;
  if (!slug || slug.length > 200) return res.status(400).json({ error: "slug inválido" });
  try {
    const noticia = await prisma.noticia.findUnique({
      where: { slug },
    });
    if (!noticia) return res.status(404).json({ error: "Noticia no encontrada" });
    res.json(noticia);
  } catch (err) {
    next(err);
  }
}

// GET /api/noticias/:slug/adyacentes
async function getNoticiasAdyacentes(req, res, next) {
  const slug = req.params.slug;
  if (!slug || slug.length > 200) return res.status(400).json({ error: "slug inválido" });
  try {
    const noticia = await prisma.noticia.findUnique({
      where: { slug: req.params.slug },
      select: { fecha: true, id: true },
    });
    if (!noticia) return res.status(404).json({ error: "Noticia no encontrada" });

    const [anterior, siguiente] = await Promise.all([
      prisma.noticia.findFirst({
        where: {
          OR: [
            { fecha: { lt: noticia.fecha } },
            { fecha: noticia.fecha, id: { lt: noticia.id } },
          ],
        },
        orderBy: [{ fecha: "desc" }, { id: "desc" }],
        select: { titulo: true, slug: true },
      }),
      prisma.noticia.findFirst({
        where: {
          OR: [
            { fecha: { gt: noticia.fecha } },
            { fecha: noticia.fecha, id: { gt: noticia.id } },
          ],
        },
        orderBy: [{ fecha: "asc" }, { id: "asc" }],
        select: { titulo: true, slug: true },
      }),
    ]);

    res.json({ anterior: anterior || null, siguiente: siguiente || null });
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

    for (const [field, value] of [["titulo", titulo], ["slug", slug], ["extracto", extracto], ["contenido", contenido]]) {
      if (value !== undefined) {
        const check = checkLength(field, value);
        if (!check.ok) return res.status(400).json({ error: check.error });
      }
    }

    const data = { titulo, slug };
    if (extracto !== undefined) data.extracto = extracto;
    if (contenido !== undefined) data.contenido = contenido;
    if ("imagen" in req.body) {
      const img = req.body.imagen;
      if (img === null || img === "") {
        data.imagen = null;
      } else {
        if (!isValidHttpsUrl(img)) return res.status(400).json({ error: "imagen debe ser una URL https válida" });
        data.imagen = img;
      }
    }
    if (categoria !== undefined) {
      if (!CATEGORIAS_VALIDAS.includes(categoria)) {
        return res.status(400).json({ error: `categoria inválida. Opciones: ${CATEGORIAS_VALIDAS.join(", ")}` });
      }
      data.categoria = categoria;
    }
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
    if (!assertValidId(req.params.id, res)) return;
    const { titulo, slug, extracto, contenido, categoria, fecha } = req.body;

    for (const [field, value] of [["titulo", titulo], ["slug", slug], ["extracto", extracto], ["contenido", contenido]]) {
      if (value !== undefined) {
        const check = checkLength(field, value);
        if (!check.ok) return res.status(400).json({ error: check.error });
      }
    }

    const data = {};
    if (titulo !== undefined) data.titulo = titulo;
    if (slug !== undefined) data.slug = slug;
    if (extracto !== undefined) data.extracto = extracto;
    if (contenido !== undefined) data.contenido = contenido;
    if (categoria !== undefined) {
      if (!CATEGORIAS_VALIDAS.includes(categoria)) {
        return res.status(400).json({ error: `categoria inválida. Opciones: ${CATEGORIAS_VALIDAS.join(", ")}` });
      }
      data.categoria = categoria;
    }
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

module.exports = { getNoticias, getNoticiaPorSlug, getNoticiaById, getNoticiasAdyacentes, crearNoticia, actualizarNoticia, eliminarNoticia };
