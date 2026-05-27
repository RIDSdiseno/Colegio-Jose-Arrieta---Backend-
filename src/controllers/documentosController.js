const prisma = require("../lib/prisma");
const { isValidHttpsUrl, checkLength } = require("../lib/validators");
const { assertHasFields, assertValidId, makeDeleteHandler } = require("../lib/controllerHelpers");

const CATEGORIAS_VALIDAS = [
  "Información de Cursos",
  "Útiles Escolares",
  "Calendario Escolar",
  "Plan Lector",
  "Otro",
];

// GET /api/documentos?anio=2026 — público, solo activos
async function getDocumentos(req, res, next) {
  try {
    const anio = req.query.anio ? parseInt(req.query.anio) : new Date().getFullYear();
    const documentos = await prisma.documento.findMany({
      where: { activo: true, anio },
      orderBy: [{ orden: "asc" }, { titulo: "asc" }],
    });
    res.json(documentos);
  } catch (err) {
    next(err);
  }
}

// GET /api/documentos/anos — público, años con documentos activos
async function getAnos(req, res, next) {
  try {
    const rows = await prisma.documento.findMany({
      where: { activo: true },
      select: { anio: true },
      distinct: ["anio"],
      orderBy: { anio: "desc" },
    });
    res.json(rows.map((r) => r.anio));
  } catch (err) {
    next(err);
  }
}

// GET /api/documentos/admin — admin, todos
async function getDocumentosAdmin(req, res, next) {
  try {
    const documentos = await prisma.documento.findMany({
      orderBy: [{ anio: "desc" }, { orden: "asc" }, { titulo: "asc" }],
    });
    res.json(documentos);
  } catch (err) {
    next(err);
  }
}

// GET /api/documentos/id/:id — admin
async function getDocumentoById(req, res, next) {
  if (!assertValidId(req.params.id, res)) return;
  try {
    const doc = await prisma.documento.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ error: "Documento no encontrado" });
    res.json(doc);
  } catch (err) {
    next(err);
  }
}

// POST /api/documentos — admin
async function crearDocumento(req, res, next) {
  try {
    const { titulo, categoria, anio, link, activo, orden } = req.body;
    if (!titulo || !link || !anio) {
      return res.status(400).json({ error: "titulo, link y anio son obligatorios" });
    }
    for (const [field, value] of [["titulo", titulo]]) {
      const check = checkLength(field, value);
      if (!check.ok) return res.status(400).json({ error: check.error });
    }
    if (!isValidHttpsUrl(link)) {
      return res.status(400).json({ error: "link debe ser una URL https válida" });
    }

    const parsedAnio = parseInt(anio);
    if (isNaN(parsedAnio) || parsedAnio < 2000 || parsedAnio > 2100) {
      return res.status(400).json({ error: "anio debe ser un número entre 2000 y 2100" });
    }

    const cat = categoria || "Otro";
    if (!CATEGORIAS_VALIDAS.includes(cat)) {
      return res.status(400).json({ error: `categoria inválida. Opciones: ${CATEGORIAS_VALIDAS.join(", ")}` });
    }

    const doc = await prisma.documento.create({
      data: {
        titulo,
        categoria: cat,
        anio: parsedAnio,
        link,
        activo: activo !== undefined ? Boolean(activo) : true,
        orden: orden !== undefined ? parseInt(orden) : 0,
      },
    });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
}

// PUT /api/documentos/:id — admin
async function actualizarDocumento(req, res, next) {
  try {
    if (!assertValidId(req.params.id, res)) return;
    const { titulo, categoria, anio, link, activo, orden } = req.body;
    for (const [field, value] of [["titulo", titulo]]) {
      if (value !== undefined) {
        const check = checkLength(field, value);
        if (!check.ok) return res.status(400).json({ error: check.error });
      }
    }
    const data = {};
    if (titulo !== undefined) data.titulo = titulo;
    if (link !== undefined) {
      if (!isValidHttpsUrl(link)) {
        return res.status(400).json({ error: "link debe ser una URL https válida" });
      }
      data.link = link;
    }
    if (activo !== undefined) data.activo = Boolean(activo);
    if (orden !== undefined) {
      const parsedOrden = parseInt(orden);
      if (isNaN(parsedOrden)) return res.status(400).json({ error: "orden debe ser un número entero" });
      data.orden = parsedOrden;
    }
    if (anio !== undefined) {
      const parsedAnio = parseInt(anio);
      if (isNaN(parsedAnio) || parsedAnio < 2000 || parsedAnio > 2100) {
        return res.status(400).json({ error: "anio debe ser un número entre 2000 y 2100" });
      }
      data.anio = parsedAnio;
    }
    if (categoria !== undefined) {
      if (!CATEGORIAS_VALIDAS.includes(categoria)) {
        return res.status(400).json({ error: `categoria inválida. Opciones: ${CATEGORIAS_VALIDAS.join(", ")}` });
      }
      data.categoria = categoria;
    }

    if (!assertHasFields(data, res)) return;

    const doc = await prisma.documento.update({ where: { id: req.params.id }, data });
    res.json(doc);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/documentos/:id — admin
const eliminarDocumento = makeDeleteHandler("documento", "Documento");

module.exports = {
  getDocumentos,
  getAnos,
  getDocumentosAdmin,
  getDocumentoById,
  crearDocumento,
  actualizarDocumento,
  eliminarDocumento,
};
