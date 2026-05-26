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

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const role = data.user.app_metadata?.role ?? data.user.user_metadata?.role;
  if (role !== "admin") {
    return res.status(403).json({ error: "Acceso denegado" });
  }

  next();
}

module.exports = requireAdmin;
