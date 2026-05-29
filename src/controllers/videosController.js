const prisma = require("../lib/prisma");
const { isValidHttpsUrl, checkLength } = require("../lib/validators");
const { assertHasFields, assertValidId, makeDeleteHandler } = require("../lib/controllerHelpers");

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
  if (!assertValidId(req.params.id, res)) return;
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
    if (!titulo?.trim() || !url?.trim() || !anio) {
      return res.status(400).json({ error: "titulo, url y anio son obligatorios" });
    }
    for (const [field, value] of [["titulo", titulo]]) {
      const check = checkLength(field, value);
      if (!check.ok) return res.status(400).json({ error: check.error });
    }
    if (!isValidHttpsUrl(url.trim())) {
      return res.status(400).json({ error: "url debe ser una URL https válida" });
    }

    const parsedAnio = parseInt(anio);
    if (isNaN(parsedAnio) || parsedAnio < 2000 || parsedAnio > 2100) {
      return res.status(400).json({ error: "anio debe ser un número entre 2000 y 2100" });
    }

    let parsedOrden = 0;
    if (orden !== undefined) {
      parsedOrden = parseInt(orden);
      if (isNaN(parsedOrden)) return res.status(400).json({ error: "orden debe ser un número entero" });
    }

    const video = await prisma.video.create({
      data: {
        titulo: titulo.trim(),
        url: url.trim(),
        anio: parsedAnio,
        orden: parsedOrden,
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
    if (!assertValidId(req.params.id, res)) return;
    const { titulo, url, anio, orden, activo } = req.body;
    for (const [field, value] of [["titulo", titulo]]) {
      if (value !== undefined) {
        const check = checkLength(field, value);
        if (!check.ok) return res.status(400).json({ error: check.error });
      }
    }
    if (titulo !== undefined && !titulo.trim())
      return res.status(400).json({ error: "titulo no puede estar vacío" });

    const data = {};
    if (titulo !== undefined) data.titulo = titulo.trim();
    if (url !== undefined) {
      if (!isValidHttpsUrl(url)) {
        return res.status(400).json({ error: "url debe ser una URL https válida" });
      }
      data.url = url.trim();
    }
    if (anio !== undefined) {
      const parsedAnio = parseInt(anio);
      if (isNaN(parsedAnio) || parsedAnio < 2000 || parsedAnio > 2100) {
        return res.status(400).json({ error: "anio debe ser un número entre 2000 y 2100" });
      }
      data.anio = parsedAnio;
    }
    if (orden !== undefined) {
      const parsedOrden = parseInt(orden);
      if (isNaN(parsedOrden)) return res.status(400).json({ error: "orden debe ser un número entero" });
      data.orden = parsedOrden;
    }
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
