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
        res.status(500).json({ error: error.message });
    }
};

const putCamion = async (req, res) => {
    try {
        const result = await camionService.actualizarCamion(req.params.id, req.body);
        res.json({ success: true, data: result });
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
            return res.status(400).json({ error: 'No se seleccionó ninguna imagen' });
        }
        const url = `/uploads/${req.file.filename}`;
        await camionService.actualizarFotoCamion(req.params.id, url);
        res.json({ success: true, data: { foto_url: url } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getCamiones, getResumenCamion, postCamion, putCamion, deleteCamion, uploadPhoto };