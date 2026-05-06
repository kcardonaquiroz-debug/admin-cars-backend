const express = require("express");
const router = express.Router();
const c = require("../controllers/conductorController");

router.get("/conductores", c.getConductores);
router.post("/conductores", c.postConductor);
router.put("/conductores/:id", c.putConductor);
router.delete("/conductores/:id", c.deleteConductor);

module.exports = router;