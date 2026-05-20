const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    let token = req.headers.authorization;

    // 🛡️ Validación robusta: verifica que exista, que sea texto y que empiece con 'Bearer'
    if (!token || typeof token !== 'string' || !token.startsWith('Bearer')) {
        return res.status(401).json({ success: false, error: 'Acceso denegado. Token no proporcionado o inválido' });
    }

    // Extraemos el token puro del string
    token = token.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, error: 'Token invalido o expirado.' });
    }
};

const autorizarRoles = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes los permisos necesarios para realizar esta acción.'
            });
        }
        next();
    };
};

module.exports = { verificarToken, autorizarRoles };