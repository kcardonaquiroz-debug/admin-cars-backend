const db = require("../config/db");

const obtenerConductores = async () => {
    const [rows] = await db.query("SELECT * FROM conductores WHERE estado = 1");
    return rows;
};

const crearConductor = async (c) => {
    const [result] = await db.execute(
        `INSERT INTO conductores (nombre, telefono, licencia_nro, licencia_vence, fk_usuario, estado) VALUES(?,?,?,?,?,1)`,
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
    const [result] = await db.execute(
        `UPDATE conductores SET estado = 0 WHERE id_conductor = ?`, [id]
    );
    return result;
};

module.exports = { obtenerConductores, crearConductor, actualizarConductor, eliminarConductor };