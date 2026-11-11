const reporteService = require("../services/reporteService");
const demoService = require("../services/demoService");

const responderError = (res, error) =>
    res.status(error.statusCode || 500).json({ success: false, error: error.message, message: error.message });

const getReporte = async (req, res) => {
    try { res.json({ success: true, data: await reporteService.obtenerReporte(req.query) }); }
    catch (error) { responderError(res, error); }
};

const getViajesReporte = async (req, res) => {
    try { res.json({ success: true, data: await reporteService.obtenerViajesReporte(req.query) }); }
    catch (error) { responderError(res, error); }
};

const getDemo = async (req, res) => {
    try { res.json({ success: true, data: await demoService.contarDatosDemo() }); }
    catch (error) { responderError(res, error); }
};

const postDemo = async (req, res) => {
    try { res.status(201).json({ success: true, data: await demoService.generarViajesDemo(req.body?.cantidad) }); }
    catch (error) { responderError(res, error); }
};

const deleteDemo = async (req, res) => {
    try { res.json({ success: true, data: await demoService.borrarDatosDemo() }); }
    catch (error) { responderError(res, error); }
};

module.exports = { getReporte, getViajesReporte, getDemo, postDemo, deleteDemo };
