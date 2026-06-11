const prisma = require("./prisma");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Guard: retorna false y envía 400 si el id no es un UUID válido.
 */
function assertValidId(id, res) {
  if (!UUID_RE.test(id)) {
    res.status(400).json({ error: "id inválido" });
    return false;
  }
  return true;
}

/**
 * Guard: lanza 400 si el objeto `data` está vacío.
 */
function assertHasFields(data, res) {
  if (!data || Object.keys(data).length === 0) {
    res.status(400).json({ error: "No se enviaron campos para actualizar" });
    return false;
  }
  return true;
}

/**
 * Factory: crea un handler DELETE genérico.
 * @param {string} model   — nombre del modelo Prisma (ej: "noticia")
 * @param {string} label   — nombre legible para el mensaje (ej: "Noticia")
 * @param {string} [param] — nombre del parámetro de ruta (default: "id")
 */
function makeDeleteHandler(model, label, param = "id") {
  return async (req, res, next) => {
    if (!assertValidId(req.params[param], res)) return;
    try {
      await prisma[model].delete({ where: { id: req.params[param] } });
      res.json({ message: `${label} eliminado` });
    } catch (err) {
      // P2025 = registro no encontrado en Prisma
      if (err.code === "P2025") {
        return res.status(404).json({ error: `${label} no encontrado` });
      }
      next(err);
    }
  };
}

module.exports = { assertHasFields, assertValidId, makeDeleteHandler };
