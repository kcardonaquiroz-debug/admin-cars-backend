const viajeService = require("../services/viajeService");

const getViajes = async (req, res) => {
    try {
        const data = await viajeService.obtenerViajes();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const postViaje = async (req, res) => {
    try {
        const result = await viajeService.crearViaje(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const putViaje = async (req, res) => {
    try {
        const result = await viajeService.actualizarViaje(req.params.id, req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteViaje = async (req, res) => {
    try {
        await viajeService.eliminarViaje(req.params.id);
        res.json({ success: true, message: 'Viaje eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getViajes, postViaje, putViaje, deleteViaje };