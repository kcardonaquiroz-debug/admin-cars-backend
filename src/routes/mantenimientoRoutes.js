const express = require("express");
const router = express.Router();
const m = require("../controllers/mantenimientoController");

router.get("/mantenimientos", m.getMantenimientos);
router.post("/mantenimientos", m.postMantenimiento);
router.put("/mantenimientos/:id", m.putMantenimiento);
router.delete("/mantenimientos/:id", m.deleteMantenimiento);

module.exports = router;