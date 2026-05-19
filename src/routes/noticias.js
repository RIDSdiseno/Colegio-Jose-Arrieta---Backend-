const router = require("express").Router();
const { getNoticias, getNoticiaPorSlug, crearNoticia, actualizarNoticia, eliminarNoticia } = require("../controllers/noticiasController");

router.get("/", getNoticias);
router.get("/:slug", getNoticiaPorSlug);
router.post("/", crearNoticia);
router.put("/:id", actualizarNoticia);
router.delete("/:id", eliminarNoticia);

module.exports = router;
