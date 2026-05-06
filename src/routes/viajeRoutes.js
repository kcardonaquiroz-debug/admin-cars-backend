const express = require("express");
const router = express.Router();
const v = require("../controllers/viajeController");

router.get("/viajes", v.getViajes);
router.post("/viajes", v.postViaje);
router.put("/viajes/:id", v.putViaje);
router.delete("/viajes/:id", v.deleteViaje);

module.exports = router;