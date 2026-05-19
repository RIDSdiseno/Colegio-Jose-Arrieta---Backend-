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

    const foto = await prisma.galeria.create({
      data: { url, caption, orden, activo },
    });
    res.status(201).json(foto);
  } catch (err) {
    next(err);
  }
}

// PUT /api/galeria/:id
async function actualizarFoto(req, res, next) {
  try {
    const { url, caption, orden, activo } = req.body;

    const foto = await prisma.galeria.update({
      where: { id: req.params.id },
      data: { url, caption, orden, activo },
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
