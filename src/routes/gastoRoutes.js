const express = require("express");
const router = express.Router();
const g = require("../controllers/gastoController");
const { verificarToken, soloAdmin } = require("../middleware/authMiddleware");

router.get("/gastos", verificarToken, g.getGastos);
router.post("/gastos", verificarToken, g.postGasto);
router.put("/gastos/:id", verificarToken, g.putGasto);
router.delete("/gastos/:id", verificarToken, soloAdmin, g.deleteGasto);

module.exports = router;