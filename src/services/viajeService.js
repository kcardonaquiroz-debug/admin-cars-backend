const db = require("../config/db");

const obtenerViajes = async (search) => {
    let sql = `
        SELECT v.*, 
               c.marca, c.modelo, c.placa,
               con.nombre AS nombre_conductor
        FROM viajes v
        LEFT JOIN camiones c ON v.fk_camion = c.id_camion
        LEFT JOIN conductores con ON v.fk_conductor = con.id_conductor
    `;
    const params = [];
    if (search) {
        sql += ` WHERE (v.nro_guia LIKE ? OR v.origen LIKE ? OR v.destino LIKE ? OR v.producto_carga LIKE ? OR c.placa LIKE ? OR con.nombre LIKE ?)`;
        const like = `%${search}%`;
        params.push(like, like, like, like, like, like);
    }
    sql += ` ORDER BY v.id_viaje DESC`;
    const [rows] = await db.query(sql, params);
    return rows;
};

const obtenerViajesPorConductor = async (fk_usuario, search) => {
    let sql = `
        SELECT v.*, 
               c.marca, c.modelo, c.placa,
               con.nombre AS nombre_conductor
        FROM viajes v
        LEFT JOIN camiones c ON v.fk_camion = c.id_camion
        LEFT JOIN conductores con ON v.fk_conductor = con.id_conductor
        WHERE con.fk_usuario = ?
    `;
    const params = [fk_usuario];
    if (search) {
        sql += ` AND (v.nro_guia LIKE ? OR v.origen LIKE ? OR v.destino LIKE ? OR v.producto_carga LIKE ? OR c.placa LIKE ?)`;
        const like = `%${search}%`;
        params.push(like, like, like, like, like);
    }
    sql += ` ORDER BY v.id_viaje DESC`;
    const [rows] = await db.query(sql, params);
    return rows;
};

const obtenerViajePorId = async (id) => {
    const [rows] = await db.query(`
        SELECT v.*, 
               c.marca, c.modelo, c.placa, c.foto_url,
               con.nombre AS nombre_conductor
        FROM viajes v
        LEFT JOIN camiones c ON v.fk_camion = c.id_camion
        LEFT JOIN conductores con ON v.fk_conductor = con.id_conductor
        WHERE v.id_viaje = ?
    `, [id]);
    return rows[0];
};

const crearViaje = async (v) => {
    const [result] = await db.execute(
        `INSERT INTO viajes (fk_camion, fk_conductor, nro_guia, fecha_salida, fecha_llegada, producto_carga, origen, destino, valor_flete, estado)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [v.fk_camion, v.fk_conductor, v.nro_guia || null,
         v.fecha_salida, v.fecha_llegada, v.producto_carga,
         v.origen, v.destino, v.valor_flete, v.estado || 'en_curso']
    );
    return result;
};

const actualizarViaje = async (id, v) => {
    const [result] = await db.execute(
        `UPDATE viajes SET fk_camion=?, fk_conductor=?, nro_guia=?,
         fecha_salida=?, fecha_llegada=?, producto_carga=?,
         origen=?, destino=?, valor_flete=?, estado=?
         WHERE id_viaje=?`,
        [v.fk_camion, v.fk_conductor, v.nro_guia,
         v.fecha_salida, v.fecha_llegada, v.producto_carga,
         v.origen, v.destino, v.valor_flete, v.estado, id]
    );
    return result;
};

const eliminarViaje = async (id) => {
    const [result] = await db.execute(
        `DELETE FROM viajes WHERE id_viaje=?`, [id]
    );
    return result;
};

module.exports = {
    obtenerViajes, obtenerViajesPorConductor, obtenerViajePorId,
    crearViaje, actualizarViaje, eliminarViaje
};