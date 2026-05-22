const router = require("express").Router();
const requireAdmin = require("../middleware/requireAdmin");
const {
  getAlbums,
  getAlbumsAdmin,
  getAlbumById,
  getFotosAlbum,
  crearAlbum,
  actualizarAlbum,
  eliminarAlbum,
  agregarFoto,
  eliminarFoto,
} = require("../controllers/albumController");

// Admin (rutas estáticas primero, antes de las paramétricas)
router.get("/admin", requireAdmin, getAlbumsAdmin);
router.get("/id/:id", requireAdmin, getAlbumById);

// Públicas
router.get("/", getAlbums);
router.get("/:id/fotos", getFotosAlbum);

// Mutaciones admin
router.post("/", requireAdmin, crearAlbum);
router.put("/:id", requireAdmin, actualizarAlbum);
router.post("/:id/fotos", requireAdmin, agregarFoto);
// Ruta específica antes de la parametrizada para evitar que /:id capture "fotos"
router.delete("/fotos/:fotoId", requireAdmin, eliminarFoto);
router.delete("/:id", requireAdmin, eliminarAlbum);

module.exports = router;
