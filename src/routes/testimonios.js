const router = require("express").Router();
const requireAdmin = require("../middleware/requireAdmin");
const { getTestimonios, getTestimonioById, getTestimoniosAdmin, crearTestimonio, actualizarTestimonio, eliminarTestimonio } = require("../controllers/testimoniosController");

router.get("/", getTestimonios);
router.get("/admin", requireAdmin, getTestimoniosAdmin);
router.get("/id/:id", requireAdmin, getTestimonioById);
router.post("/", requireAdmin, crearTestimonio);
router.put("/:id", requireAdmin, actualizarTestimonio);
router.delete("/:id", requireAdmin, eliminarTestimonio);

module.exports = router;
