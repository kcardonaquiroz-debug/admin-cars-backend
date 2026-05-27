const db = require("../config/db");

const obtenerConductores = async () => {
    const [rows] = await db.query("SELECT * FROM conductores");
    return rows;
};

const crearConductor = async (c) => {
    const [result] = await db.execute(
        `INSERT INTO conductores VALUES(null,?,?,?,?,?)`,
        [c.nombre, c.telefono, c.licencia_nro, c.licencia_vence, c.fk_usuario]
    );
    return result;
};

const actualizarConductor = async (id, c) => {
    const [result] = await db.execute(
        `UPDATE conductores SET nombre=?, telefono=?, licencia_nro=?, licencia_vence=?, fk_usuario=? WHERE id_conductor=?`,
        [c.nombre, c.telefono, c.licencia_nro, c.licencia_vence, c.fk_usuario, id]
    );
    return result;
};

const eliminarConductor = async (id) => {
    try {
        const [result] = await db.execute(
            `DELETE FROM conductores WHERE id_conductor=?`, [id]
        );
        return result;
    } catch (error) {
        if (error.errno === 1451) {
            throw new Error('No se puede eliminar el conductor porque tiene viajes, camiones o facturas asociados.');
        }
        throw error;
    }
};

module.exports = { obtenerConductores, crearConductor, actualizarConductor, eliminarConductor };