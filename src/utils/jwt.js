const jwt = require('jsonwebtoken');

const generarToken = (usuario) => {
    return jwt.sign(
        {
            id: usuario.id_usuario || usuario.id,
            email: usuario.email,
            rol: usuario.rol || usuario.fk_rol
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }  // ← debe ser string como '24h', '7d', o número como 86400
    );
};

const verificarToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generarToken, verificarToken };