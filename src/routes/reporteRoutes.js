const express = require("express");
const router = express.Router();
const r = require("../controllers/reporteController");
const { verificarToken, noConductor, soloAdmin } = require("../middleware/authMiddleware");

// Reportes (roles administrativos)
router.get("/reportes", verificarToken, noConductor, r.getReporte);
router.get("/reportes/viajes", verificarToken, noConductor, r.getViajesReporte);

// Datos de prueba (Administrador / SuperAdmin)
router.get("/reportes/demo", verificarToken, soloAdmin, r.getDemo);
router.post("/reportes/demo", verificarToken, soloAdmin, r.postDemo);
router.delete("/reportes/demo", verificarToken, soloAdmin, r.deleteDemo);

module.exports = router;
