const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const c = require("../controllers/camionController");
const { verificarToken } = require("../middleware/authMiddleware");

const storage = multer.diskStorage({
    destination: path.join(__dirname, '..', '..', 'uploads'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `camion-${req.params.id}-${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const tipos = /jpeg|jpg|png|gif|webp/;
        const valido = tipos.test(path.extname(file.originalname).toLowerCase()) && tipos.test(file.mimetype.split('/')[1]);
        cb(valido ? null : new Error('Solo imágenes (jpg, png, gif, webp)'), valido);
    }
});

router.get("/camiones", verificarToken, c.getCamiones);
router.get("/camiones/mio/resumen", verificarToken, c.getMiResumen);
router.get("/camiones/:id/resumen", verificarToken, c.getResumenCamion);
router.post("/camiones", verificarToken, c.postCamion);
router.put("/camiones/:id", verificarToken, c.putCamion);
router.delete("/camiones/:id", verificarToken, c.deleteCamion);
router.post("/camiones/:id/upload", verificarToken, upload.single('foto'), c.uploadPhoto);

module.exports = router;