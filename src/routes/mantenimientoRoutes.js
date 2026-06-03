const express = require("express");
const router = express.Router();
const m = require("../controllers/mantenimientoController");
const { verificarToken, soloAdmin } = require("../middleware/authMiddleware");

router.get("/mantenimientos", verificarToken, m.getMantenimientos);
router.post("/mantenimientos", verificarToken, m.postMantenimiento);
router.put("/mantenimientos/:id", verificarToken, m.putMantenimiento);
router.delete("/mantenimientos/:id", verificarToken, soloAdmin, m.deleteMantenimiento);

module.exports = router;