const express = require("express");
const router = express.Router();
const v = require("../controllers/viajeController");
const { verificarToken } = require("../middleware/authMiddleware");

router.get("/viajes", verificarToken, v.getViajes);
router.get("/viajes/:id", verificarToken, v.getViaje);
router.post("/viajes", verificarToken, v.postViaje);
router.put("/viajes/:id", verificarToken, v.putViaje);
router.delete("/viajes/:id", verificarToken, v.deleteViaje);

module.exports = router;