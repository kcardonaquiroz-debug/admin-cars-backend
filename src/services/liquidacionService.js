const db = require("../config/db");

const obtenerLiquidacion = async (fk_viaje) => {
    const [viaje] = await db.query(`
        SELECT v.*, c.marca, c.modelo, c.placa, c.foto_url,
               con.nombre AS nombre_conductor
        FROM viajes v
        LEFT JOIN camiones c ON v.fk_camion = c.id_camion
        LEFT JOIN conductores con ON v.fk_conductor = con.id_conductor
        WHERE v.id_viaje = ?
    `, [fk_viaje]);

    const [gastos] = await db.query(`
        SELECT * FROM gastos WHERE fk_viaje = ? ORDER BY id_gastos ASC
    `, [fk_viaje]);

    const totalGastos = gastos.reduce((s, g) => s + (g.monto || 0), 0);
    const saldo = (viaje[0]?.valor_flete || 0) - totalGastos;

    const [liq] = await db.query(
        `SELECT * FROM liquidaciones WHERE fk_viaje = ?`, [fk_viaje]
    );

    return {
        viaje: viaje[0],
        gastos,
        resumen: {
            valor_flete: viaje[0]?.valor_flete || 0,
            total_gastos: totalGastos,
            saldo_camion: saldo
        },
        liquidacion: liq[0] || null
    };
};

const guardarLiquidacion = async (data) => {
    const existe = await db.query(
        `SELECT id_liquidacion FROM liquidaciones WHERE fk_viaje = ?`,
        [data.fk_viaje]
    );

    if (existe[0].length > 0) {
        const [result] = await db.execute(
            `UPDATE liquidaciones SET valor_flete=?, total_gastos=?,
             saldo_camion=?, fecha_liquidacion=?, observaciones=?
             WHERE fk_viaje=?`,
            [data.valor_flete, data.total_gastos, data.saldo_camion,
             data.fecha_liquidacion, data.observaciones || null, data.fk_viaje]
        );
        return result;
    } else {
        const [result] = await db.execute(
            `INSERT INTO liquidaciones (fk_viaje, valor_flete, total_gastos, saldo_camion, fecha_liquidacion, observaciones)
             VALUES (?,?,?,?,?,?)`,
            [data.fk_viaje, data.valor_flete, data.total_gastos,
             data.saldo_camion, data.fecha_liquidacion, data.observaciones || null]
        );
        return result;
    }
};

module.exports = { obtenerLiquidacion, guardarLiquidacion };