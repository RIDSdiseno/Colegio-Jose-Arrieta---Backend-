const router = require("express").Router();
const requireAdmin = require("../middleware/requireAdmin");
const {
  getBoletines,
  getBoletinesAdmin,
  getBoletinById,
  crearBoletin,
  actualizarBoletin,
  eliminarBoletin,
} = require("../controllers/boletinesController");

router.get("/", getBoletines);
router.get("/admin", requireAdmin, getBoletinesAdmin);
router.get("/id/:id", requireAdmin, getBoletinById);
router.post("/", requireAdmin, crearBoletin);
router.put("/:id", requireAdmin, actualizarBoletin);
router.delete("/:id", requireAdmin, eliminarBoletin);

module.exports = router;
