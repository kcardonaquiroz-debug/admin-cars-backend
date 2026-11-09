const camionService = require("../services/camionService");

const getCamiones = async (req, res) => {
    try {
        const data = await camionService.obtenerCamiones();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getResumenCamion = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        const inicio = fecha_inicio || '2020-01-01';
        const fin = fecha_fin || new Date().toISOString().slice(0, 10);
        const data = await camionService.obtenerResumenCamion(req.params.id, inicio, fin);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const postCamion = async (req, res) => {
    try {
        const result = await camionService.crearCamion(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message, message: error.message });
    }
};

const putCamion = async (req, res) => {
    try {
        const result = await camionService.actualizarCamion(req.params.id, req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message, message: error.message });
    }
};

const getMiResumen = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        const data = await camionService.obtenerMiResumen(req.user.id, fecha_inicio, fecha_fin);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteCamion = async (req, res) => {
    try {
        await camionService.eliminarCamion(req.params.id);
        res.json({ success: true, message: 'Camión eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const uploadPhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se seleccionó ninguna imagen', message: 'No se seleccionó ninguna imagen' });
        }
        const existe = await camionService.camionExiste(req.params.id);
        if (!existe) return res.status(404).json({ error: 'Camión no encontrado', message: 'Camión no encontrado' });

        await camionService.guardarFotoCamion(req.params.id, req.file.buffer, req.file.mimetype);
        // ?v= cambia en cada subida para que el navegador no muestre la foto anterior en caché
        const url = `${req.protocol}://${req.get('host')}/api/v1/camiones/${req.params.id}/foto?v=${Date.now()}`;
        await camionService.actualizarFotoCamion(req.params.id, url);
        res.json({ success: true, data: { foto_url: url } });
    } catch (error) {
        res.status(500).json({ error: error.message, message: error.message });
    }
};

const getFoto = async (req, res) => {
    try {
        const foto = await camionService.obtenerFotoCamion(req.params.id);
        if (!foto) return res.status(404).json({ error: 'Este camión no tiene foto' });
        res.set('Content-Type', foto.mime);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.send(foto.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getCamiones, getResumenCamion, getMiResumen, postCamion, putCamion, deleteCamion, uploadPhoto, getFoto };