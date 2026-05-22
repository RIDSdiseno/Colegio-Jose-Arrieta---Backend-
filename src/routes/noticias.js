const router = require("express").Router();
const requireAdmin = require("../middleware/requireAdmin");
const { getNoticias, getNoticiaPorSlug, getNoticiaById, getNoticiasAdyacentes, crearNoticia, actualizarNoticia, eliminarNoticia } = require("../controllers/noticiasController");

router.get("/", getNoticias);
router.get("/id/:id", requireAdmin, getNoticiaById);
router.get("/:slug/adyacentes", getNoticiasAdyacentes);
router.get("/:slug", getNoticiaPorSlug);
router.post("/", requireAdmin, crearNoticia);
router.put("/:id", requireAdmin, actualizarNoticia);
router.delete("/:id", requireAdmin, eliminarNoticia);

module.exports = router;
