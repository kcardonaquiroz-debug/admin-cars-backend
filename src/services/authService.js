const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { generarToken } = require('../utils/jwt');

// El registro público se eliminó: los usuarios los crea el SuperAdmin (ver usuarioService).

// Las contraseñas nuevas se guardan con bcrypt. Las cuentas antiguas guardadas
// en texto plano siguen funcionando hasta que el SuperAdmin les asigne una nueva.
const passwordCoincide = async (password, guardada) => {
    if (!password || !guardada) return false;
    if (guardada.startsWith('$2')) return bcrypt.compare(password, guardada);
    return password === guardada;
};

class AuthService {

    static async login(email, password) {
        const [usuarios] = await pool.execute(
            `SELECT u.*, r.nombre AS rol
             FROM usuarios u
             JOIN rol r ON u.fk_rol = r.id_rol
             WHERE u.email = ?`,
            [email]
        );

        const usuario = usuarios[0];

        if (!usuario || !(await passwordCoincide(password, usuario.password_hash))) {
            const error = new Error('Credenciales inválidas');
            error.statusCode = 401;
            throw error;
        }

        if (usuario.estado !== undefined && Number(usuario.estado) === 0) {
            const error = new Error('Tu usuario está desactivado. Contacta al administrador.');
            error.statusCode = 403;
            throw error;
        }

        const token = generarToken(usuario);
        const { password_hash, ...usuarioSinPassword } = usuario;

        return { usuario: usuarioSinPassword, token };
    }
}

module.exports = AuthService;
