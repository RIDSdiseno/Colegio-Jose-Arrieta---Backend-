const crypto = require("crypto");

function requireAdmin(req, res, next) {
  const token = req.headers["x-admin-secret"];
  const secret = process.env.ADMIN_SECRET;

  if (!secret) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const tokenBuf = Buffer.from(token || "");
  const secretBuf = Buffer.from(secret);

  let valid = false;
  try {
    valid = tokenBuf.byteLength === secretBuf.byteLength &&
            crypto.timingSafeEqual(tokenBuf, secretBuf);
  } catch (_) { /* longitudes distintas */ }

  if (!token || !valid) {
    return res.status(401).json({ error: "No autorizado" });
  }

  next();
}

module.exports = requireAdmin;
