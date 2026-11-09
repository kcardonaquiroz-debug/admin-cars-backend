const express = require("express");
const router = express.Router();
const a = require("../controllers/alertaController");
const { verificarToken } = require("../middleware/authMiddleware");

// Avisos de vencimiento (licencias, seguro y tecnomecánica)
router.get("/alertas", verificarToken, a.getAlertas);

module.exports = router;
