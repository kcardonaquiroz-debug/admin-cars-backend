const express = require("express");
const router = express.Router();
const c = require("../controllers/camionController");

router.get("/camiones", c.getCamiones);
router.post("/camiones", c.postCamion);
router.put("/camiones/:id", c.putCamion);
router.delete("/camiones/:id", c.deleteCamion);

module.exports = router;