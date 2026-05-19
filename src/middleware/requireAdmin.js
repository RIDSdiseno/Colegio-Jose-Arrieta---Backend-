const crypto = require("crypto");

function requireAdmin(req, res, next) {
  const token = req.headers["x-admin-secret"];
  const secret = process.env.ADMIN_SECRET;

  if (!secret) {
    return res.status(500).json({ error: "ADMIN_SECRET no configurado en el servidor" });
  }

  if (
    !token ||
    token.length !== secret.length ||
    !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret))
  ) {
    return res.status(401).json({ error: "No autorizado" });
  }

  next();
}

module.exports = requireAdmin;
