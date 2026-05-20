const router = require("express").Router();
const requireAdmin = require("../middleware/requireAdmin");
const { getGaleria, getFotoById, getGaleriaAdmin, crearFoto, actualizarFoto, eliminarFoto } = require("../controllers/galeriaController");

router.get("/", getGaleria);
router.get("/admin", requireAdmin, getGaleriaAdmin);
router.get("/id/:id", requireAdmin, getFotoById);
router.post("/", requireAdmin, crearFoto);
router.put("/:id", requireAdmin, actualizarFoto);
router.delete("/:id", requireAdmin, eliminarFoto);

module.exports = router;
