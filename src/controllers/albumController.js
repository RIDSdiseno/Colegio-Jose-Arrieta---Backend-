const prisma = require("../lib/prisma");
const { isValidHttpsUrl, checkLength, parseOrden } = require("../lib/validators");
const { assertHasFields, assertValidId, makeDeleteHandler } = require("../lib/controllerHelpers");

// GET /api/albums — público, solo activos
async function getAlbums(req, res, next) {
  try {
    const albums = await prisma.album.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
      include: {
        fotos: { orderBy: { orden: "asc" }, take: 1 }, // portada dinámica si no hay portada
        _count: { select: { fotos: true } },
      },
    });
    res.json(albums);
  } catch (err) {
    next(err);
  }
}

// GET /api/albums/admin — admin, todos
async function getAlbumsAdmin(req, res, next) {
  try {
    const albums = await prisma.album.findMany({
      orderBy: { orden: "asc" },
      include: { _count: { select: { fotos: true } } },
      take: 500,
    });
    res.json(albums);
  } catch (err) {
    next(err);
  }
}

// GET /api/albums/id/:id — admin
async function getAlbumById(req, res, next) {
  if (!assertValidId(req.params.id, res)) return;
  try {
    const album = await prisma.album.findUnique({
      where: { id: req.params.id },
      include: { fotos: { orderBy: { orden: "asc" } } },
    });
    if (!album) return res.status(404).json({ error: "Álbum no encontrado" });
    res.json(album);
  } catch (err) {
    next(err);
  }
}

// GET /api/albums/:id/fotos?page=1&limit=50 — público, paginado
async function getFotosAlbum(req, res, next) {
  if (!assertValidId(req.params.id, res)) return;
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const page  = Math.max(parseInt(req.query.page)  || 1, 1);
    const skip  = (page - 1) * limit;

    const [album, total] = await Promise.all([
      prisma.album.findUnique({
        where: { id: req.params.id, activo: true },
        include: { fotos: { orderBy: { orden: "asc" }, skip, take: limit } },
      }),
      prisma.fotoAlbum.count({ where: { albumId: req.params.id, album: { activo: true } } }),
    ]);

    if (!album) return res.status(404).json({ error: "Álbum no encontrado" });
    res.json({ ...album, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
}

// POST /api/albums — admin
async function crearAlbum(req, res, next) {
  try {
    const { titulo, descripcion, portada, orden, activo } = req.body;
    if (!titulo?.trim()) return res.status(400).json({ error: "titulo es obligatorio" });
    if (portada && !isValidHttpsUrl(portada.trim()))
      return res.status(400).json({ error: "portada debe ser una URL https válida" });
    // Consistente con actualizarAlbum: portada vacía → null explícito

    for (const [field, value] of [["titulo", titulo], ["descripcion", descripcion]]) {
      if (value !== undefined) {
        const check = checkLength(field, value);
        if (!check.ok) return res.status(400).json({ error: check.error });
      }
    }

    const data = { titulo: titulo.trim() };
    if (descripcion !== undefined) data.descripcion = descripcion.trim();
    if ("portada" in req.body) data.portada = portada?.trim() || null;
    if (orden !== undefined) {
      const ordenResult = parseOrden(orden);
      if (!ordenResult.ok) return res.status(400).json({ error: ordenResult.error });
      data.orden = ordenResult.value;
    }
    if (activo !== undefined) data.activo = Boolean(activo);

    const album = await prisma.album.create({ data });
    res.status(201).json(album);
  } catch (err) {
    next(err);
  }
}

// PUT /api/albums/:id — admin
async function actualizarAlbum(req, res, next) {
  try {
    if (!assertValidId(req.params.id, res)) return;
    const { titulo, descripcion, portada, orden, activo } = req.body;

    for (const [field, value] of [["titulo", titulo], ["descripcion", descripcion]]) {
      if (value !== undefined) {
        const check = checkLength(field, value);
        if (!check.ok) return res.status(400).json({ error: check.error });
      }
    }

    if (titulo !== undefined && !titulo.trim())
      return res.status(400).json({ error: "titulo no puede estar vacío" });

    const data = {};
    if (titulo !== undefined) data.titulo = titulo.trim();
    if (descripcion !== undefined) data.descripcion = descripcion.trim();
    if (portada !== undefined) {
      if (portada && !isValidHttpsUrl(portada.trim()))
        return res.status(400).json({ error: "portada debe ser una URL https válida" });
      data.portada = portada?.trim() || null;
    }
    if (orden !== undefined) {
      const ordenResult = parseOrden(orden);
      if (!ordenResult.ok) return res.status(400).json({ error: ordenResult.error });
      data.orden = ordenResult.value;
    }
    if (activo !== undefined) data.activo = Boolean(activo);

    if (!assertHasFields(data, res)) return;

    const album = await prisma.album.update({ where: { id: req.params.id }, data });
    res.json(album);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/albums/:id — admin (cascade borra fotos)
const eliminarAlbum = makeDeleteHandler("album", "Álbum");

// POST /api/albums/:id/fotos — admin
async function agregarFoto(req, res, next) {
  if (!assertValidId(req.params.id, res)) return;
  try {
    const { url, caption, orden } = req.body;
    if (!url) return res.status(400).json({ error: "url es obligatorio" });
    if (!isValidHttpsUrl(url.trim())) return res.status(400).json({ error: "url debe ser una URL https válida" });
    if (caption !== undefined) {
      const check = checkLength("caption", caption);
      if (!check.ok) return res.status(400).json({ error: check.error });
    }

    const data = { url: url.trim(), albumId: req.params.id };
    if (caption !== undefined) data.caption = caption.trim();
    if (orden !== undefined) {
      const ordenResult = parseOrden(orden);
      if (!ordenResult.ok) return res.status(400).json({ error: ordenResult.error });
      data.orden = ordenResult.value;
    }

    const foto = await prisma.fotoAlbum.create({ data });
    res.status(201).json(foto);
  } catch (err) {
    // P2003 = FK violation: el álbum fue eliminado entre la validación y el insert
    if (err.code === "P2003") return res.status(404).json({ error: "Álbum no encontrado" });
    next(err);
  }
}

// DELETE /api/albums/fotos/:fotoId — admin
const eliminarFoto = makeDeleteHandler("fotoAlbum", "Foto", "fotoId");

module.exports = {
  getAlbums,
  getAlbumsAdmin,
  getAlbumById,
  getFotosAlbum,
  crearAlbum,
  actualizarAlbum,
  eliminarAlbum,
  agregarFoto,
  eliminarFoto,
};
