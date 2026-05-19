const router = require("express").Router();
const { getTestimonios, getTestimoniosAdmin, crearTestimonio, actualizarTestimonio, eliminarTestimonio } = require("../controllers/testimoniosController");

router.get("/", getTestimonios);
router.get("/admin", getTestimoniosAdmin);
router.post("/", crearTestimonio);
router.put("/:id", actualizarTestimonio);
router.delete("/:id", eliminarTestimonio);

module.exports = router;
