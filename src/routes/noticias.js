const router = require("express").Router();
const requireAdmin = require("../middleware/requireAdmin");
const { getNoticias, getNoticiaPorSlug, crearNoticia, actualizarNoticia, eliminarNoticia } = require("../controllers/noticiasController");

router.get("/", getNoticias);
router.get("/:slug", getNoticiaPorSlug);
router.post("/", requireAdmin, crearNoticia);
router.put("/:id", requireAdmin, actualizarNoticia);
router.delete("/:id", requireAdmin, eliminarNoticia);

module.exports = router;
