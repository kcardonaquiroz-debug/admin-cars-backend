const usuarioService = require('../services/usuarioService');

const responderError = (res, error) => {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, error: error.message, message: error.message });
};

const getRoles = async (req, res) => {
    try { res.json({ success: true, data: await usuarioService.obtenerRoles() }); }
    catch (error) { responderError(res, error); }
};

const getUsuarios = async (req, res) => {
    try { res.json({ success: true, data: await usuarioService.obtenerUsuarios() }); }
    catch (error) { responderError(res, error); }
};

const postUsuario = async (req, res) => {
    try { res.status(201).json({ success: true, data: await usuarioService.crearUsuario(req.body) }); }
    catch (error) { responderError(res, error); }
};

const putUsuario = async (req, res) => {
    try { res.json({ success: true, data: await usuarioService.actualizarUsuario(req.params.id, req.body, req.user) }); }
    catch (error) { responderError(res, error); }
};

const deleteUsuario = async (req, res) => {
    try {
        await usuarioService.desactivarUsuario(req.params.id, req.user);
        res.json({ success: true, message: 'Usuario desactivado' });
    } catch (error) { responderError(res, error); }
};

module.exports = { getRoles, getUsuarios, postUsuario, putUsuario, deleteUsuario };
