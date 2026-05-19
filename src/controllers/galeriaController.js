const prisma = require("../lib/prisma");

// GET /api/galeria
async function getGaleria(req, res, next) {
  try {
    const data = await prisma.galeria.findMany({
      where: { activo: true },
      orderBy: [{ orden: "asc" }, { createdAt: "desc" }],
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// POST /api/galeria
async function crearFoto(req, res, next) {
  try {
    const { url, caption, orden, activo } = req.body;

    if (!url) {
      return res.status(400).json({ error: "url es obligatoria" });
    }

    const data = { url };
    if (caption !== undefined) data.caption = caption;
    if (activo !== undefined) data.activo = Boolean(activo);
    if (orden !== undefined) {
      const n = parseInt(orden);
      if (isNaN(n)) return res.status(400).json({ error: "orden debe ser un número" });
      data.orden = n;
    }

    const foto = await prisma.galeria.create({ data });
    res.status(201).json(foto);
  } catch (err) {
    next(err);
  }
}

// PUT /api/galeria/:id
async function actualizarFoto(req, res, next) {
  try {
    const { url, caption, orden, activo } = req.body;

    const data = {};
    if (url !== undefined) data.url = url;
    if (caption !== undefined) data.caption = caption;
    if (activo !== undefined) data.activo = Boolean(activo);
    if (orden !== undefined) {
      const n = parseInt(orden);
      if (isNaN(n)) return res.status(400).json({ error: "orden debe ser un número" });
      data.orden = n;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No se enviaron campos para actualizar" });
    }

    const foto = await prisma.galeria.update({
      where: { id: req.params.id },
      data,
    });
    res.json(foto);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/galeria/:id
async function eliminarFoto(req, res, next) {
  try {
    await prisma.galeria.delete({ where: { id: req.params.id } });
    res.json({ message: "Foto eliminada" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getGaleria, crearFoto, actualizarFoto, eliminarFoto };
