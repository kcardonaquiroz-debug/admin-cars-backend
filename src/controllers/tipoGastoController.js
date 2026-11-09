const tipoGastoService = require("../services/tipoGastoService");

const responderError = (res, error) => {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, error: error.message, message: error.message });
};

const getTiposGasto = async (req, res) => {
    try {
        const incluirInactivos = req.query.todos === '1' && req.user.rol !== 'Conductor';
        const data = await tipoGastoService.obtenerTiposGasto(incluirInactivos);
        res.json({ success: true, data });
    } catch (error) { responderError(res, error); }
};

const postTipoGasto = async (req, res) => {
    try {
        const data = await tipoGastoService.crearTipoGasto(req.body);
        res.status(201).json({ success: true, data });
    } catch (error) { responderError(res, error); }
};

const putTipoGasto = async (req, res) => {
    try {
        const data = await tipoGastoService.actualizarTipoGasto(req.params.id, req.body);
        res.json({ success: true, data });
    } catch (error) { responderError(res, error); }
};

const deleteTipoGasto = async (req, res) => {
    try {
        await tipoGastoService.desactivarTipoGasto(req.params.id);
        res.json({ success: true, message: 'Tipo de gasto desactivado' });
    } catch (error) { responderError(res, error); }
};

module.exports = { getTiposGasto, postTipoGasto, putTipoGasto, deleteTipoGasto };
