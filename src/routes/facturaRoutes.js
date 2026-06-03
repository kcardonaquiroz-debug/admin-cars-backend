const express = require("express");
const router = express.Router();
const f = require("../controllers/facturaController");
const { verificarToken, soloAdmin } = require("../middleware/authMiddleware");

router.get("/facturas", verificarToken, f.getFacturas);
router.post("/facturas", verificarToken, f.postFactura);
router.put("/facturas/:id", verificarToken, f.putFactura);
router.delete("/facturas/:id", verificarToken, soloAdmin, f.deleteFactura);

module.exports = router;