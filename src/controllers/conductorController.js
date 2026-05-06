const conductorService = require("../services/conductorService");

const getConductores = async (req, res) => {
    try {
        const data = await conductorService.obtenerConductores();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const postConductor = async (req, res) => {
    try {
        const result = await conductorService.crearConductor(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const putConductor = async (req, res) => {
    try {
        const result = await conductorService.actualizarConductor(req.params.id, req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteConductor = async (req, res) => {
    try {
        await conductorService.eliminarConductor(req.params.id);
        res.json({ success: true, message: 'Conductor eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getConductores, postConductor, putConductor, deleteConductor };