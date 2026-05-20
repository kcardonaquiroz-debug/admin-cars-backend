const express = require("express");
const router = express.Router();
const l = require("../controllers/liquidacionController");
const { verificarToken } = require("../middleware/authMiddleware");

router.get("/liquidacion/:viajeId", verificarToken, l.getLiquidacion);
router.post("/liquidacion", verificarToken, l.postLiquidacion);

module.exports = router;