const db = require("../config/db");

const obtenerCamiones = async () => {
    const [rows] = await db.query(`
        SELECT c.*,
               DATE_FORMAT(c.matricula_fecha, '%Y-%m-%d') AS matricula_fecha,
               DATE_FORMAT(c.seguro_vence, '%Y-%m-%d') AS seguro_vence,
               DATE_FORMAT(c.tecnomecanica_vence, '%Y-%m-%d') AS tecnomecanica_vence,
               con.nombre AS nombre_conductor
        FROM camiones c
        LEFT JOIN conductores con ON c.fk_conductor = con.id_conductor
    `);
    return rows;
};

const obtenerResumenCamion = async (id, fecha_inicio, fecha_fin) => {
    const [camion] = await db.query(
        `SELECT c.*,
               DATE_FORMAT(c.matricula_fecha, '%Y-%m-%d') AS matricula_fecha,
               DATE_FORMAT(c.seguro_vence, '%Y-%m-%d') AS seguro_vence,
               DATE_FORMAT(c.tecnomecanica_vence, '%Y-%m-%d') AS tecnomecanica_vence,
               con.nombre AS nombre_conductor
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

const validarPlacaUnica = async (placa, excluirId = null) => {
    if (!placa) return;
    const [rows] = await db.execute(
        excluirId
            ? 'SELECT id_camion FROM camiones WHERE placa = ? AND id_camion != ?'
            : 'SELECT id_camion FROM camiones WHERE placa = ?',
        excluirId ? [placa, excluirId] : [placa]
    );
    if (rows.length > 0) {
        const error = new Error('Ya existe un camión con esa placa');
        error.statusCode = 400;
        throw error;
    }
};

// Documentos del camión: matrícula, seguro (SOAT / póliza) y revisión tecnomecánica
const texto = (v) => (v === undefined || v === null || String(v).trim() === '') ? null : String(v).trim();
const fecha = (v, nombre) => {
    const t = texto(v);
    if (!t) return null;
    const f = t.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f) || isNaN(new Date(f))) {
        throw new Error(`La fecha de ${nombre} no es válida`);
    }
    return f;
};
const documentos = (c) => [
    texto(c.matricula_nro), fecha(c.matricula_fecha, 'matrícula'),
    texto(c.seguro_aseguradora), texto(c.seguro_poliza), fecha(c.seguro_vence, 'vencimiento del seguro'),
    texto(c.tecnomecanica_nro), fecha(c.tecnomecanica_vence, 'vencimiento de la tecnomecánica')
];

const crearCamion = async (c) => {
    validarCapacidad(c.capacidad);
    await validarPlacaUnica(c.placa);
    const [result] = await db.execute(
        `INSERT INTO camiones (marca, placa, modelo, capacidad, estado, fk_conductor, foto_url,
             matricula_nro, matricula_fecha, seguro_aseguradora, seguro_poliza, seguro_vence,
             tecnomecanica_nro, tecnomecanica_vence)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [c.marca, c.placa || null, c.modelo, c.capacidad,
         c.estado, c.fk_conductor || null, c.foto_url || null, ...documentos(c)]
    );
    return result;
};

const actualizarCamion = async (id, c) => {
    validarCapacidad(c.capacidad);
    await validarPlacaUnica(c.placa, id);
    const [result] = await db.execute(
        `UPDATE camiones SET marca=?, placa=?, modelo=?, capacidad=?,
         estado=?, fk_conductor=?, foto_url=?,
         matricula_nro=?, matricula_fecha=?, seguro_aseguradora=?, seguro_poliza=?, seguro_vence=?,
         tecnomecanica_nro=?, tecnomecanica_vence=?
         WHERE id_camion=?`,
        [c.marca, c.placa, c.modelo, c.capacidad,
         c.estado, c.fk_conductor || null, c.foto_url || null, ...documentos(c), id]
    );
    return result;
};

const obtenerMiResumen = async (fkUsuario, fecha_inicio, fecha_fin) => {
    const [conductor] = await db.query(
        `SELECT id_conductor FROM conductores WHERE fk_usuario = ? AND estado = 1`,
        [fkUsuario]
    );
    if (conductor.length === 0) {
        throw new Error('No se encontró un conductor activo para este usuario');
    }
    const [camion] = await db.query(
        `SELECT c.*,
               DATE_FORMAT(c.matricula_fecha, '%Y-%m-%d') AS matricula_fecha,
               DATE_FORMAT(c.seguro_vence, '%Y-%m-%d') AS seguro_vence,
               DATE_FORMAT(c.tecnomecanica_vence, '%Y-%m-%d') AS tecnomecanica_vence,
               con.nombre AS nombre_conductor
         FROM camiones c
         LEFT JOIN conductores con ON c.fk_conductor = con.id_conductor
         WHERE c.fk_conductor = ?`, [conductor[0].id_conductor]
    );
    if (camion.length === 0) {
        throw new Error('No tienes un camión asignado');
    }

    const inicio = fecha_inicio || '2020-01-01';
    const fin = fecha_fin || new Date().toISOString().slice(0, 10);

    const [viajes] = await db.query(`
        SELECT v.*,
               COALESCE((SELECT SUM(g.monto) FROM gastos g WHERE g.fk_viaje = v.id_viaje), 0) AS total_gastos,
               v.valor_flete - COALESCE((SELECT SUM(g.monto) FROM gastos g WHERE g.fk_viaje = v.id_viaje), 0) AS saldo
        FROM viajes v
        WHERE v.fk_camion = ?
        AND v.fecha_salida BETWEEN ? AND ?
        ORDER BY v.fecha_salida DESC
    `, [camion[0].id_camion, inicio, fin]);

    const totalFletes = viajes.reduce((s, v) => s + (v.valor_flete || 0), 0);
    const totalGastos = viajes.reduce((s, v) => s + (v.total_gastos || 0), 0);
    const totalSaldo = totalFletes - totalGastos;

    return {
        camion: camion[0],
        viajes,
        resumen: { totalFletes, totalGastos, totalSaldo, totalViajes: viajes.length }
    };
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
    obtenerCamiones, obtenerResumenCamion, obtenerMiResumen,
    crearCamion, actualizarCamion, eliminarCamion, actualizarFotoCamion
};