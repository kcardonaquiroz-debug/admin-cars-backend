const alertaService = require("../services/alertaService");

const getAlertas = async (req, res) => {
    try {
        const data = await alertaService.obtenerAlertas(req.user);
        res.json({ success: true, dias_aviso: alertaService.DIAS_AVISO, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, message: error.message });
    }
};

module.exports = { getAlertas };
