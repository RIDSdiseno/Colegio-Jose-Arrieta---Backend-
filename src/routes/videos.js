const router = require("express").Router();
const requireAdmin = require("../middleware/requireAdmin");
const {
  getVideos,
  getVideosAdmin,
  getVideoById,
  crearVideo,
  actualizarVideo,
  eliminarVideo,
} = require("../controllers/videosController");

router.get("/", getVideos);
router.get("/admin", requireAdmin, getVideosAdmin);
router.get("/id/:id", requireAdmin, getVideoById);
router.post("/", requireAdmin, crearVideo);
router.put("/:id", requireAdmin, actualizarVideo);
router.delete("/:id", requireAdmin, eliminarVideo);

module.exports = router;
