const liquidacionService = require("../services/liquidacionService");

const getLiquidacion = async (req, res) => {
    try {
        const data = await liquidacionService.obtenerLiquidacion(req.params.viajeId);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const postLiquidacion = async (req, res) => {
    try {
        const result = await liquidacionService.guardarLiquidacion(req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getLiquidacion, postLiquidacion };