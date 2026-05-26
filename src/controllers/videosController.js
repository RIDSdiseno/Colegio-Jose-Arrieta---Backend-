const prisma = require("../lib/prisma");
const { isValidUrl } = require("../lib/validators");
const { assertHasFields, makeDeleteHandler } = require("../lib/controllerHelpers");

// GET /api/videos — público, solo activos ordenados
async function getVideos(req, res, next) {
  try {
    const videos = await prisma.video.findMany({
      where: { activo: true },
      orderBy: [{ orden: "asc" }, { anio: "desc" }],
    });
    res.json(videos);
  } catch (err) {
    next(err);
  }
}

// GET /api/videos/admin — admin, todos
async function getVideosAdmin(req, res, next) {
  try {
    const videos = await prisma.video.findMany({
      orderBy: [{ orden: "asc" }, { anio: "desc" }],
    });
    res.json(videos);
  } catch (err) {
    next(err);
  }
}

// GET /api/videos/:id — admin
async function getVideoById(req, res, next) {
  try {
    const video = await prisma.video.findUnique({ where: { id: req.params.id } });
    if (!video) return res.status(404).json({ error: "Video no encontrado" });
    res.json(video);
  } catch (err) {
    next(err);
  }
}

// POST /api/videos — admin
async function crearVideo(req, res, next) {
  try {
    const { titulo, url, anio, orden, activo } = req.body;
    if (!titulo || !url || !anio) {
      return res.status(400).json({ error: "titulo, url y anio son obligatorios" });
    }

    if (!isValidUrl(url)) {
      return res.status(400).json({ error: "url debe ser una URL válida" });
    }

    const parsedAnio = parseInt(anio);
    if (isNaN(parsedAnio) || parsedAnio < 2000 || parsedAnio > 2100) {
      return res.status(400).json({ error: "anio debe ser un número entre 2000 y 2100" });
    }

    const video = await prisma.video.create({
      data: {
        titulo,
        url,
        anio: parsedAnio,
        orden: orden !== undefined ? parseInt(orden) : 0,
        activo: activo !== undefined ? Boolean(activo) : true,
      },
    });
    res.status(201).json(video);
  } catch (err) {
    next(err);
  }
}

// PUT /api/videos/:id — admin
async function actualizarVideo(req, res, next) {
  try {
    const { titulo, url, anio, orden, activo } = req.body;
    const data = {};
    if (titulo !== undefined) data.titulo = titulo;
    if (url !== undefined) {
      if (!isValidUrl(url)) {
        return res.status(400).json({ error: "url debe ser una URL válida" });
      }
      data.url = url;
    }
    if (anio !== undefined) {
      const parsedAnio = parseInt(anio);
      if (isNaN(parsedAnio) || parsedAnio < 2000 || parsedAnio > 2100) {
        return res.status(400).json({ error: "anio debe ser un número entre 2000 y 2100" });
      }
      data.anio = parsedAnio;
    }
    if (orden !== undefined) data.orden = parseInt(orden);
    if (activo !== undefined) data.activo = Boolean(activo);

    if (!assertHasFields(data, res)) return;

    const video = await prisma.video.update({ where: { id: req.params.id }, data });
    res.json(video);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/videos/:id — admin
const eliminarVideo = makeDeleteHandler("video", "Video");

module.exports = { getVideos, getVideosAdmin, getVideoById, crearVideo, actualizarVideo, eliminarVideo };
