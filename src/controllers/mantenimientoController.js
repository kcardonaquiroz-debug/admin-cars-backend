const mantenimientoService = require("../services/mantenimientoService");

const getMantenimientos = async (req, res) => {
    try {
        const data = await mantenimientoService.obtenerMantenimientos();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const postMantenimiento = async (req, res) => {
    try {
        const result = await mantenimientoService.crearMantenimiento(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const putMantenimiento = async (req, res) => {
    try {
        const result = await mantenimientoService.actualizarMantenimiento(req.params.id, req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteMantenimiento = async (req, res) => {
    try {
        await mantenimientoService.eliminarMantenimiento(req.params.id);
        res.json({ success: true, message: 'Mantenimiento eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getMantenimientos, postMantenimiento, putMantenimiento, deleteMantenimiento };