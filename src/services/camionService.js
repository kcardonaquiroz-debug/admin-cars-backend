const db = require("../config/db");

const obtenerCamiones = async () => {
    const [rows] = await db.query("SELECT * FROM camiones");
    return rows;
};

const crearCamion = async (c) => {
    const [result] = await db.execute(
        `INSERT INTO camiones VALUES(null,?,?,?,?,?)`,
        [c.marca, c.modelo, c.capacidad, c.estado, c.fk_conductor]
    );
    return result;
};

const actualizarCamion = async (id, c) => {
    const [result] = await db.execute(
        `UPDATE camiones SET marca=?, modelo=?, capacidad=?, estado=?, fk_conductor=? WHERE id_camion=?`,
        [c.marca, c.modelo, c.capacidad, c.estado, c.fk_conductor, id]
    );
    return result;
};

const eliminarCamion = async (id) => {
    const [result] = await db.execute(
        `DELETE FROM camiones WHERE id_camion=?`, [id]
    );
    return result;
};

module.exports = { obtenerCamiones, crearCamion, actualizarCamion, eliminarCamion };