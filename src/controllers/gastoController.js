const gastoService = require("../services/gastoService");

const getGastos = async (req, res) => {
    try {
        const data = await gastoService.obtenerGastos();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const postGasto = async (req, res) => {
    try {
        const result = await gastoService.crearGasto(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const putGasto = async (req, res) => {
    try {
        const result = await gastoService.actualizarGasto(req.params.id, req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteGasto = async (req, res) => {
    try {
        await gastoService.eliminarGasto(req.params.id);
        res.json({ success: true, message: 'Gasto eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getGastos, postGasto, putGasto, deleteGasto };