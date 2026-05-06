const express = require("express");
const router = express.Router();
const f = require("../controllers/facturaController");

router.get("/facturas", f.getFacturas);
router.post("/facturas", f.postFactura);
router.put("/facturas/:id", f.putFactura);
router.delete("/facturas/:id", f.deleteFactura);

module.exports = router;