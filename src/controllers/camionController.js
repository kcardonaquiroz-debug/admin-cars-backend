const camionService = require("../services/camionService");

const getCamiones = async (req, res) => {
    try {
        const data = await camionService.obtenerCamiones();
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

module.exports = { getCamiones, postCamion, putCamion, deleteCamion };