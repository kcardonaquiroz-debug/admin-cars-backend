const db = require("../config/db");

// Catálogo de tipos de gasto. Los gastos guardan el nombre del tipo
// (columna gastos.tipo_gasto), así los reportes existentes siguen funcionando.

const errorValidacion = (mensaje, statusCode = 400) => {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    return error;
};

const obtenerTiposGasto = async (incluirInactivos = false) => {
    const sql = `
        SELECT t.*, (SELECT COUNT(*) FROM gastos g WHERE g.tipo_gasto = t.nombre) AS total_gastos
        FROM tipos_gasto t
        ${incluirInactivos ? '' : 'WHERE t.estado = 1'}
        ORDER BY t.nombre ASC`;
    const [rows] = await db.query(sql);
    return rows;
};

const validar = async (t, idActual = null) => {
    const nombre = (t.nombre || '').trim();
    if (!nombre) throw errorValidacion('El nombre del tipo de gasto es obligatorio');
    if (nombre.length > 100) throw errorValidacion('El nombre no puede superar 100 caracteres');

    const [existentes] = await db.query(
        `SELECT id_tipo_gasto FROM tipos_gasto WHERE LOWER(nombre) = LOWER(?) AND id_tipo_gasto <> ?`,
        [nombre, idActual || 0]
    );
    if (existentes.length > 0) throw errorValidacion('Ya existe un tipo de gasto con ese nombre');
    return nombre;
};

const crearTipoGasto = async (t) => {
    const nombre = await validar(t);
    const [result] = await db.execute(
        `INSERT INTO tipos_gasto (nombre, descripcion, estado) VALUES (?, ?, 1)`,
        [nombre, (t.descripcion || '').trim() || null]
    );
    return { id_tipo_gasto: result.insertId, nombre };
};

const actualizarTipoGasto = async (id, t) => {
    const nombre = await validar(t, id);
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [actual] = await conn.query(`SELECT nombre FROM tipos_gasto WHERE id_tipo_gasto = ?`, [id]);
        if (actual.length === 0) throw errorValidacion('Tipo de gasto no encontrado', 404);

        await conn.execute(
            `UPDATE tipos_gasto SET nombre = ?, descripcion = ?, estado = ? WHERE id_tipo_gasto = ?`,
            [nombre, (t.descripcion || '').trim() || null, t.estado === 0 || t.estado === '0' ? 0 : 1, id]
        );
        // Si cambió el nombre, se actualizan los gastos ya registrados con ese tipo
        if (actual[0].nombre !== nombre) {
            await conn.execute(`UPDATE gastos SET tipo_gasto = ? WHERE tipo_gasto = ?`, [nombre, actual[0].nombre]);
        }
        await conn.commit();
        return { id_tipo_gasto: Number(id), nombre };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

// Desactiva el tipo (no se borra para no perder el historial de gastos)
const desactivarTipoGasto = async (id) => {
    const [result] = await db.execute(`UPDATE tipos_gasto SET estado = 0 WHERE id_tipo_gasto = ?`, [id]);
    if (result.affectedRows === 0) throw errorValidacion('Tipo de gasto no encontrado', 404);
    return result;
};

module.exports = { obtenerTiposGasto, crearTipoGasto, actualizarTipoGasto, desactivarTipoGasto };
