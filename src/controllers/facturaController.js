const facturaService = require("../services/facturaService");

const getFacturas = async (req, res) => {
    try {
        const data = await facturaService.obtenerFacturas();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const postFactura = async (req, res) => {
    try {
        const result = await facturaService.crearFactura(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const putFactura = async (req, res) => {
    try {
        const result = await facturaService.actualizarFactura(req.params.id, req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteFactura = async (req, res) => {
    try {
        await facturaService.eliminarFactura(req.params.id);
        res.json({ success: true, message: 'Factura eliminada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getFacturas, postFactura, putFactura, deleteFactura };