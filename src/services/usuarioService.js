const bcrypt = require('bcrypt');
const db = require('../config/db');

// Gestión de usuarios: solo el SuperAdmin crea cuentas y asigna contraseñas.

const SALT_ROUNDS = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const errorValidacion = (mensaje, statusCode = 400) => {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    return error;
};

const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

const validarPassword = (password) => {
    if (!password || String(password).length < 6) {
        throw errorValidacion('La contraseña debe tener mínimo 6 caracteres');
    }
};

const validarEmail = async (email, idActual = null) => {
    const limpio = (email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(limpio)) throw errorValidacion('El correo no es válido');
    const [existentes] = await db.query(
        'SELECT id_usuario FROM usuarios WHERE LOWER(email) = ? AND id_usuario <> ?',
        [limpio, idActual || 0]
    );
    if (existentes.length > 0) throw errorValidacion('El correo ya está registrado');
    return limpio;
};

const validarRol = async (fk_rol) => {
    const [roles] = await db.query('SELECT id_rol FROM rol WHERE id_rol = ?', [fk_rol]);
    if (roles.length === 0) throw errorValidacion('Debes seleccionar un rol válido');
    return Number(fk_rol);
};

const obtenerRoles = async () => {
    const [rows] = await db.query('SELECT id_rol, nombre FROM rol ORDER BY id_rol');
    return rows;
};

const obtenerUsuarios = async () => {
    const [rows] = await db.query(`
        SELECT u.id_usuario, u.email, u.fk_rol, u.estado, r.nombre AS rol
        FROM usuarios u
        JOIN rol r ON u.fk_rol = r.id_rol
        ORDER BY u.id_usuario DESC
    `);
    return rows;
};

const crearUsuario = async (datos) => {
    const email = await validarEmail(datos.email);
    validarPassword(datos.password);
    const fk_rol = await validarRol(datos.fk_rol);
    const hash = await hashPassword(datos.password);

    const [result] = await db.execute(
        'INSERT INTO usuarios (email, password_hash, fk_rol, estado) VALUES (?, ?, ?, 1)',
        [email, hash, fk_rol]
    );
    return { id_usuario: result.insertId, email, fk_rol };
};

const actualizarUsuario = async (id, datos, usuarioActual) => {
    const [actuales] = await db.query('SELECT id_usuario FROM usuarios WHERE id_usuario = ?', [id]);
    if (actuales.length === 0) throw errorValidacion('Usuario no encontrado', 404);

    const email = await validarEmail(datos.email, id);
    const fk_rol = await validarRol(datos.fk_rol);
    const estado = datos.estado === 0 || datos.estado === '0' ? 0 : 1;

    if (Number(id) === Number(usuarioActual.id)) {
        const [[rolNuevo]] = await db.query('SELECT nombre FROM rol WHERE id_rol = ?', [fk_rol]);
        if (rolNuevo.nombre !== 'SuperAdmin') throw errorValidacion('No puedes quitarte a ti mismo el rol de SuperAdmin');
        if (estado === 0) throw errorValidacion('No puedes desactivar tu propia cuenta');
    }

    if (datos.password) {
        validarPassword(datos.password);
        const hash = await hashPassword(datos.password);
        await db.execute(
            'UPDATE usuarios SET email = ?, fk_rol = ?, estado = ?, password_hash = ? WHERE id_usuario = ?',
            [email, fk_rol, estado, hash, id]
        );
    } else {
        await db.execute(
            'UPDATE usuarios SET email = ?, fk_rol = ?, estado = ? WHERE id_usuario = ?',
            [email, fk_rol, estado, id]
        );
    }
    return { id_usuario: Number(id), email, fk_rol, estado };
};

// No se borra el usuario (puede estar ligado a un conductor); se desactiva y ya no puede iniciar sesión
const desactivarUsuario = async (id, usuarioActual) => {
    if (Number(id) === Number(usuarioActual.id)) throw errorValidacion('No puedes desactivar tu propia cuenta');
    const [result] = await db.execute('UPDATE usuarios SET estado = 0 WHERE id_usuario = ?', [id]);
    if (result.affectedRows === 0) throw errorValidacion('Usuario no encontrado', 404);
    return result;
};

module.exports = {
    hashPassword, obtenerRoles, obtenerUsuarios,
    crearUsuario, actualizarUsuario, desactivarUsuario
};
