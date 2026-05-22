/**
 * Valida que un string sea una URL https válida.
 * Permite string vacío (para limpiar campos opcionales).
 */
function isValidHttpsUrl(str) {
  if (str === "") return true;
  try {
    const u = new URL(str);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Valida formato de color hex: #rgb, #rrggbb, #rrggbbaa */
const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;

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

module.exports = { isValidHttpsUrl, HEX_COLOR, parseEstrellas };
