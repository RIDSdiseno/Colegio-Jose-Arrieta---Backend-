const prisma = require("../lib/prisma");
const { isValidHttpsUrl } = require("../lib/validators");
const { assertHasFields, makeDeleteHandler } = require("../lib/controllerHelpers");

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
    });
    res.json(albums);
  } catch (err) {
    next(err);
  }
}

// GET /api/albums/id/:id — admin
async function getAlbumById(req, res, next) {
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

// GET /api/albums/:id/fotos — público
async function getFotosAlbum(req, res, next) {
  try {
    const album = await prisma.album.findUnique({
      where: { id: req.params.id },
      include: { fotos: { orderBy: { orden: "asc" } } },
    });
    if (!album) return res.status(404).json({ error: "Álbum no encontrado" });
    if (!album.activo) return res.status(404).json({ error: "Álbum no encontrado" });
    res.json(album);
  } catch (err) {
    next(err);
  }
}

// POST /api/albums — admin
async function crearAlbum(req, res, next) {
  try {
    const { titulo, descripcion, portada, orden, activo } = req.body;
    if (!titulo) return res.status(400).json({ error: "titulo es obligatorio" });
    if (portada && !isValidHttpsUrl(portada))
      return res.status(400).json({ error: "portada debe ser una URL https válida" });

    const data = { titulo };
    if (descripcion !== undefined) data.descripcion = descripcion;
    if (portada) data.portada = portada;
    if (orden !== undefined) data.orden = parseInt(orden) || 0;
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
    const { titulo, descripcion, portada, orden, activo } = req.body;
    const data = {};
    if (titulo !== undefined) data.titulo = titulo;
    if (descripcion !== undefined) data.descripcion = descripcion;
    if (portada !== undefined) {
      if (portada && !isValidHttpsUrl(portada))
        return res.status(400).json({ error: "portada debe ser una URL https válida" });
      data.portada = portada || null;
    }
    if (orden !== undefined) data.orden = parseInt(orden) || 0;
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
  try {
    const { url, caption, orden } = req.body;
    if (!url) return res.status(400).json({ error: "url es obligatorio" });
    if (!isValidHttpsUrl(url)) return res.status(400).json({ error: "url debe ser una URL https válida" });

    const album = await prisma.album.findUnique({ where: { id: req.params.id } });
    if (!album) return res.status(404).json({ error: "Álbum no encontrado" });

    const data = { url, albumId: req.params.id };
    if (caption !== undefined) data.caption = caption;
    if (orden !== undefined) data.orden = parseInt(orden) || 0;

    const foto = await prisma.fotoAlbum.create({ data });
    res.status(201).json(foto);
  } catch (err) {
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
