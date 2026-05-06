const db = require("../config/db");

const obtenerViajes = async () => {
    const [rows] = await db.query("SELECT * FROM viajes");
    return rows;
};

const crearViaje = async (v) => {
    const [result] = await db.execute(
        `INSERT INTO viajes VALUES(null,?,?,?,?,?,?,?,?)`,
        [v.fk_camion, v.fk_conductor, v.fecha_salida, v.fecha_llegada, v.producto_carga, v.origen, v.destino, v.valor_flete]
    );
    return result;
};

const actualizarViaje = async (id, v) => {
    const [result] = await db.execute(
        `UPDATE viajes SET fk_camion=?, fk_conductor=?, fecha_salida=?, fecha_llegada=?, producto_carga=?, origen=?, destino=?, valor_flete=? WHERE id_viaje=?`,
        [v.fk_camion, v.fk_conductor, v.fecha_salida, v.fecha_llegada, v.producto_carga, v.origen, v.destino, v.valor_flete, id]
    );
    return result;
};

const eliminarViaje = async (id) => {
    const [result] = await db.execute(
        `DELETE FROM viajes WHERE id_viaje=?`, [id]
    );
    return result;
};

module.exports = { obtenerViajes, crearViaje, actualizarViaje, eliminarViaje };