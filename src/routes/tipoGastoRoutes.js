const express = require("express");
const router = express.Router();
const t = require("../controllers/tipoGastoController");
const { verificarToken, noConductor, soloAdmin } = require("../middleware/authMiddleware");

// Catálogo de tipos de gasto
router.get("/tipos-gasto", verificarToken, t.getTiposGasto);
router.post("/tipos-gasto", verificarToken, noConductor, t.postTipoGasto);
router.put("/tipos-gasto/:id", verificarToken, noConductor, t.putTipoGasto);
router.delete("/tipos-gasto/:id", verificarToken, soloAdmin, t.deleteTipoGasto);

module.exports = router;
