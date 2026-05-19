const router = require("express").Router();
const { getGaleria, crearFoto, actualizarFoto, eliminarFoto } = require("../controllers/galeriaController");

router.get("/", getGaleria);
router.post("/", crearFoto);
router.put("/:id", actualizarFoto);
router.delete("/:id", eliminarFoto);

module.exports = router;
