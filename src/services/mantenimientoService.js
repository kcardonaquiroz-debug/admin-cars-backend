const db = require("../config/db");

const obtenerMantenimientos = async () => {
    const [rows] = await db.query("SELECT * FROM mantenimientos");
    return rows;
};

const crearMantenimiento = async (m) => {
    const [result] = await db.execute(
        `INSERT INTO mantenimientos VALUES(null,?,?,?,?)`,
        [m.fk_camion, m.descripcion, m.costo_total, m.fecha_mantenimiento]
    );
    return result;
};

const actualizarMantenimiento = async (id, m) => {
    const [result] = await db.execute(
        `UPDATE mantenimientos SET fk_camion=?, descripcion=?, costo_total=?, fecha_mantenimiento=? WHERE id_mantenimiento=?`,
        [m.fk_camion, m.descripcion, m.costo_total, m.fecha_mantenimiento, id]
    );
    return result;
};

const eliminarMantenimiento = async (id) => {
    const [result] = await db.execute(
        `DELETE FROM mantenimientos WHERE id_mantenimiento=?`, [id]
    );
    return result;
};

module.exports = { obtenerMantenimientos, crearMantenimiento, actualizarMantenimiento, eliminarMantenimiento };