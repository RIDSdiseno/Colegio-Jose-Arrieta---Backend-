const crypto = require("crypto");

function requireAdmin(req, res, next) {
  const token = req.headers["x-admin-secret"];
  const secret = process.env.ADMIN_SECRET;

  if (!secret) {
    return res.status(500).json({ error: "ADMIN_SECRET no configurado en el servidor" });
  }

  const tokenBuf = Buffer.from(token || "");
  const secretBuf = Buffer.from(secret);

  if (!token || tokenBuf.length !== secretBuf.length || !crypto.timingSafeEqual(tokenBuf, secretBuf)) {
    return res.status(401).json({ error: "No autorizado" });
  }

  next();
}

module.exports = requireAdmin;
