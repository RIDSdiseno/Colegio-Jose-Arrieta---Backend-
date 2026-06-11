const prisma = require("../lib/prisma");
const { isValidHttpsUrl, checkLength, parseAnio, parseOrden } = require("../lib/validators");
const { assertHasFields, assertValidId, makeDeleteHandler } = require("../lib/controllerHelpers");

const CATEGORIAS_VALIDAS = [
  "Información de Cursos",
  "Útiles Escolares",
  "Calendario Escolar",
  "Plan Lector",
  "Institucional",
  "Protocolo",
  "Otro",
];

// GET /api/documentos?anio=2026&search=termino&categoria=Institucional — público, solo activos
async function getDocumentos(req, res, next) {
  try {
    const search = (req.query.search || "").trim().slice(0, 100);
    const rawCategoria = (req.query.categoria || "").trim();
    const categoria = CATEGORIAS_VALIDAS.includes(rawCategoria) ? rawCategoria : "";

    // Si se filtra por categoría, devolver todos los activos de esa categoría (sin filtro de año)
    if (categoria) {
      const documentos = await prisma.documento.findMany({
        where: { activo: true, categoria },
        orderBy: [{ orden: "asc" }, { titulo: "asc" }],
      });
      return res.json(documentos);
    }

    // Si hay búsqueda, ignorar el filtro de año y buscar en todos
    if (search) {
      const documentos = await prisma.documento.findMany({
        where: {
          activo: true,
          titulo: { contains: search, mode: "insensitive" },
        },
        orderBy: [{ anio: "desc" }, { orden: "asc" }, { titulo: "asc" }],
        take: 10,
      });
      return res.json(documentos);
    }

    const anio = req.query.anio ? parseInt(req.query.anio) : new Date().getFullYear();
    if (isNaN(anio) || anio < 2000 || anio > 2100) return res.status(400).json({ error: "anio inválido" });
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
      take: 500,
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
    if (!titulo?.trim() || !link?.trim() || !anio) {
      return res.status(400).json({ error: "titulo, link y anio son obligatorios" });
    }
    for (const [field, value] of [["titulo", titulo]]) {
      const check = checkLength(field, value);
      if (!check.ok) return res.status(400).json({ error: check.error });
    }
    if (!isValidHttpsUrl(link.trim())) {
      return res.status(400).json({ error: "link debe ser una URL https válida" });
    }

    const anioResult = parseAnio(anio);
    if (!anioResult.ok) return res.status(400).json({ error: anioResult.error });

    const cat = categoria || "Otro";
    if (!CATEGORIAS_VALIDAS.includes(cat)) {
      return res.status(400).json({ error: `categoria inválida. Opciones: ${CATEGORIAS_VALIDAS.join(", ")}` });
    }

    const ordenResult = parseOrden(orden);
    if (!ordenResult.ok) return res.status(400).json({ error: ordenResult.error });

    const doc = await prisma.documento.create({
      data: {
        titulo: titulo.trim(),
        categoria: cat,
        anio: anioResult.value,
        link: link.trim(),
        activo: activo !== undefined ? Boolean(activo) : true,
        orden: ordenResult.value,
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
    if (titulo !== undefined && !titulo.trim())
      return res.status(400).json({ error: "titulo no puede estar vacío" });

    const data = {};
    if (titulo !== undefined) data.titulo = titulo.trim();
    if (link !== undefined) {
      if (!isValidHttpsUrl(link.trim())) {
        return res.status(400).json({ error: "link debe ser una URL https válida" });
      }
      data.link = link.trim();
    }
    if (activo !== undefined) data.activo = Boolean(activo);
    if (orden !== undefined) {
      const ordenResult = parseOrden(orden);
      if (!ordenResult.ok) return res.status(400).json({ error: ordenResult.error });
      data.orden = ordenResult.value;
    }
    if (anio !== undefined) {
      const anioResult = parseAnio(anio);
      if (!anioResult.ok) return res.status(400).json({ error: anioResult.error });
      data.anio = anioResult.value;
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
