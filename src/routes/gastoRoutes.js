const express = require("express");
const router = express.Router();
const g = require("../controllers/gastoController");

router.get("/gastos", g.getGastos);
router.post("/gastos", g.postGasto);
router.put("/gastos/:id", g.putGasto);
router.delete("/gastos/:id", g.deleteGasto);

module.exports = router;