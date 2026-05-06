const pool = require('../config/db');
const { generarToken } = require('../utils/jwt');

class AuthService {

    static async registrarUsuario(datos) {
        const { email, password, fk_rol } = datos;

        const [existentes] = await pool.execute(
            'SELECT id_usuario FROM usuarios WHERE email = ?',
            [email]
        );

        if (existentes.length > 0) {
            const error = new Error('El correo ya está registrado');
            error.statusCode = 400;
            throw error;
        }

        const [resultado] = await pool.execute(
            'INSERT INTO usuarios (email, password_hash, fk_rol) VALUES (?, ?, ?)',
            [email, password, fk_rol || 3]
        );

        const nuevoUsuario = {
            id: resultado.insertId,
            email,
            fk_rol: fk_rol || 3
        };

        const token = generarToken(nuevoUsuario);
        return { usuario: nuevoUsuario, token };
    }

    static async login(email, password) {
        const [usuarios] = await pool.execute(
            `SELECT u.*, r.nombre AS rol
             FROM usuarios u
             JOIN rol r ON u.fk_rol = r.id_rol
             WHERE u.email = ?`,
            [email]
        );

        const usuario = usuarios[0];

        if (!usuario || usuario.password_hash !== password) {
            const error = new Error('Credenciales inválidas');
            error.statusCode = 401;
            throw error;
        }

        const token = generarToken(usuario);
        const { password_hash, ...usuarioSinPassword } = usuario;

        return { usuario: usuarioSinPassword, token };
    }
}

module.exports = AuthService;