/**
 * Valida que un string sea una URL https válida.
 * Rechaza strings vacíos. Para campos URL opcionales que admiten
 * borrado, verificar `if (value && !isValidHttpsUrl(value))` en el caller.
 */
function isValidHttpsUrl(str) {
  if (!str) return false;
  try {
    const u = new URL(str);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Valida formato de color hex CSS válido: #rgb, #rrggbb, #rrggbbaa */
const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/**
 * Parsea y valida el campo estrellas (1–5).
 * Retorna { ok: true, value } o { ok: false, error }.
 */
function parseEstrellas(raw) {
  const n = parseInt(raw);
  if (isNaN(n) || n < 1 || n > 5) {
    return { ok: false, error: "estrellas debe ser un número entre 1 y 5" };
  }
  return { ok: true, value: n };
}

/**
 * Límites máximos de longitud para campos de texto libre.
 * Aplican en todos los controllers para prevenir payloads excesivos.
 */
const TEXT_LIMITS = {
  titulo:      200,
  slug:        200,
  extracto:    500,
  contenido:   60000,
  texto:       5000,   // testimonios
  nombre:      150,
  cargo:       150,
  descripcion: 1000,
  caption:     300,
  categoria:   100,
};

/**
 * Valida que un campo de texto no supere el límite definido en TEXT_LIMITS.
 * Retorna { ok: true } o { ok: false, error: string }.
 * Si el campo no está en TEXT_LIMITS, pasa sin restricción.
 */
function checkLength(field, value) {
  const max = TEXT_LIMITS[field];
  if (!max || typeof value !== "string") return { ok: true };
  if (value.length > max) {
    return { ok: false, error: `${field} supera el máximo de ${max} caracteres` };
  }
  return { ok: true };
}

module.exports = { isValidHttpsUrl, HEX_COLOR, parseEstrellas, checkLength, TEXT_LIMITS };
