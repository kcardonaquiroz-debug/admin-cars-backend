const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const c = require("../controllers/camionController");
const { verificarToken, soloAdmin } = require("../middleware/authMiddleware");

// La foto se guarda en la base de datos (no en disco): en Render los archivos
// del disco se borran cada vez que el servidor se reinicia.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const tipos = /jpeg|jpg|png|gif|webp/;
        const valido = tipos.test(path.extname(file.originalname).toLowerCase()) || tipos.test(file.mimetype.split('/')[1]);
        cb(valido ? null : new Error('Solo imágenes (jpg, png, gif, webp)'), valido);
    }
});

// Devuelve los errores de la subida (tamaño, tipo) con un mensaje claro
const subirFoto = (req, res, next) => {
    upload.single('foto')(req, res, (err) => {
        if (!err) return next();
        const mensaje = err.code === 'LIMIT_FILE_SIZE' ? 'La imagen supera 5MB' : err.message;
        res.status(400).json({ success: false, error: mensaje, message: mensaje });
    });
};

// Pública para que funcione dentro de <img src="..."> (los navegadores no envían el token)
router.get("/camiones/:id/foto", c.getFoto);

router.get("/camiones", verificarToken, c.getCamiones);
router.get("/camiones/mio/resumen", verificarToken, c.getMiResumen);
router.get("/camiones/:id/resumen", verificarToken, c.getResumenCamion);
router.post("/camiones", verificarToken, c.postCamion);
router.put("/camiones/:id", verificarToken, c.putCamion);
router.delete("/camiones/:id", verificarToken, soloAdmin, c.deleteCamion);
router.post("/camiones/:id/upload", verificarToken, subirFoto, c.uploadPhoto);

module.exports = router;
