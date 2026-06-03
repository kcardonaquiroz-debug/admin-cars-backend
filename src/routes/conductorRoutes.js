const express = require("express");
const router = express.Router();
const c = require("../controllers/conductorController");
const { verificarToken, soloAdmin } = require("../middleware/authMiddleware");

router.get("/conductores", verificarToken, c.getConductores);
router.post("/conductores", verificarToken, c.postConductor);
router.put("/conductores/:id", verificarToken, c.putConductor);
router.delete("/conductores/:id", verificarToken, soloAdmin, c.deleteConductor);

module.exports = router;