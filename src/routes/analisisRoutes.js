const express = require("express");
const router = express.Router();
const c = require("../controllers/analisisController");
const { verificarToken } = require("../middleware/authMiddleware");

router.get("/analisis", verificarToken, c.getAnalisis);

module.exports = router;
