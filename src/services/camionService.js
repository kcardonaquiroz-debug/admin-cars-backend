const db = require("../config/db");

const obtenerCamiones = async () => {
    const [rows] = await db.query(`
        SELECT c.*, con.nombre AS nombre_conductor
        FROM camiones c
        LEFT JOIN conductores con ON c.fk_conductor = con.id_conductor
    `);
    return rows;
};

const obtenerResumenCamion = async (id, fecha_inicio, fecha_fin) => {
    const [camion] = await db.query(
        `SELECT c.*, con.nombre AS nombre_conductor
         FROM camiones c
         LEFT JOIN conductores con ON c.fk_conductor = con.id_conductor
         WHERE c.id_camion = ?`, [id]
    );

    const [viajes] = await db.query(`
        SELECT v.*,
               COALESCE((SELECT SUM(g.monto) FROM gastos g WHERE g.fk_viaje = v.id_viaje), 0) AS total_gastos,
               v.valor_flete - COALESCE((SELECT SUM(g.monto) FROM gastos g WHERE g.fk_viaje = v.id_viaje), 0) AS saldo
        FROM viajes v
        WHERE v.fk_camion = ?
        AND v.fecha_salida BETWEEN ? AND ?
        ORDER BY v.fecha_salida DESC
    `, [id, fecha_inicio, fecha_fin]);

    const totalFletes = viajes.reduce((s, v) => s + (v.valor_flete || 0), 0);
    const totalGastos = viajes.reduce((s, v) => s + (v.total_gastos || 0), 0);
    const totalSaldo = totalFletes - totalGastos;

    return {
        camion: camion[0],
        viajes,
        resumen: { totalFletes, totalGastos, totalSaldo, totalViajes: viajes.length }
    };
};

const validarCapacidad = (capacidad) => {
    if (capacidad == null || isNaN(capacidad) || Number(capacidad) <= 0) {
        throw new Error('La capacidad debe ser un número mayor a 0');
    }
};

const crearCamion = async (c) => {
    validarCapacidad(c.capacidad);
    const [result] = await db.execute(
        `INSERT INTO camiones (marca, placa, modelo, capacidad, estado, fk_conductor, foto_url)
         VALUES (?,?,?,?,?,?,?)`,
        [c.marca, c.placa || null, c.modelo, c.capacidad,
         c.estado, c.fk_conductor || null, c.foto_url || null]
    );
    return result;
};

const actualizarCamion = async (id, c) => {
    validarCapacidad(c.capacidad);
    const [result] = await db.execute(
        `UPDATE camiones SET marca=?, placa=?, modelo=?, capacidad=?,
         estado=?, fk_conductor=?, foto_url=? WHERE id_camion=?`,
        [c.marca, c.placa, c.modelo, c.capacidad,
         c.estado, c.fk_conductor || null, c.foto_url || null, id]
    );
    return result;
};

const eliminarCamion = async (id) => {
    try {
        const [result] = await db.execute(
            `DELETE FROM camiones WHERE id_camion=?`, [id]
        );
        return result;
    } catch (error) {
        if (error.errno === 1451) {
            throw new Error('No se puede eliminar el camión porque tiene viajes o mantenimientos asociados.');
        }
        throw error;
    }
};

const actualizarFotoCamion = async (id, url) => {
    const [result] = await db.execute(
        `UPDATE camiones SET foto_url=? WHERE id_camion=?`,
        [url, id]
    );
    return result;
};

module.exports = {
    obtenerCamiones, obtenerResumenCamion,
    crearCamion, actualizarCamion, eliminarCamion, actualizarFotoCamion
};