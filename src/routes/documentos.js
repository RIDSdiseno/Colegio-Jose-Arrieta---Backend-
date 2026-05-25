const router = require("express").Router();
const requireAdmin = require("../middleware/requireAdmin");
const {
  getDocumentos,
  getAnos,
  getDocumentosAdmin,
  getDocumentoById,
  crearDocumento,
  actualizarDocumento,
  eliminarDocumento,
} = require("../controllers/documentosController");

router.get("/", getDocumentos);
router.get("/anos", getAnos);
router.get("/admin", requireAdmin, getDocumentosAdmin);
router.get("/id/:id", requireAdmin, getDocumentoById);
router.post("/", requireAdmin, crearDocumento);
router.put("/:id", requireAdmin, actualizarDocumento);
router.delete("/:id", requireAdmin, eliminarDocumento);

module.exports = router;
