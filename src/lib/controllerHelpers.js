const prisma = require("./prisma");

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
    try {
      await prisma[model].delete({ where: { id: req.params[param] } });
      res.json({ message: `${label} eliminado` });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { assertHasFields, makeDeleteHandler };
