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

module.exports = { isValidHttpsUrl, HEX_COLOR };
