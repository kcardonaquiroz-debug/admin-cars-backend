const express = require("express");
const router = express.Router();
const c = require("../controllers/camionController");
const { verificarToken } = require("../middleware/authMiddleware");

router.get("/camiones", verificarToken, c.getCamiones);
router.get("/camiones/:id/resumen", verificarToken, c.getResumenCamion);
router.post("/camiones", verificarToken, c.postCamion);
router.put("/camiones/:id", verificarToken, c.putCamion);
router.delete("/camiones/:id", verificarToken, c.deleteCamion);

module.exports = router;