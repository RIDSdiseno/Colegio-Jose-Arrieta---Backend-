const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("SUPABASE_URL y SUPABASE_SERVICE_KEY son obligatorios. Revisar variables de entorno.");
}

// Cliente con service_role — solo vive en el servidor, nunca en el browser
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function requireAdmin(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const token = authHeader.slice(7);

  let authResult;
  try {
    authResult = await Promise.race([
      supabase.auth.getUser(token),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Auth timeout")), 5000)
      ),
    ]);
  } catch {
    return res.status(503).json({ error: "Servicio de autenticación no disponible" });
  }

  const { data, error } = authResult;

  if (error || !data?.user) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const role = data.user.app_metadata?.role;
  if (role !== "admin") {
    return res.status(403).json({ error: "Acceso denegado" });
  }

  next();
}

module.exports = requireAdmin;
