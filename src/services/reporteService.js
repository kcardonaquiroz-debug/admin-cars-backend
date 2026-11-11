const db = require("../config/db");

// Reportes de operación: todo se calcula sobre los viajes que cumplen los filtros.
// Gastos por viaje = suma de la tabla gastos. Utilidad = flete - gastos.

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

const construirFiltros = (q = {}) => {
    const condiciones = [];
    const params = [];
    if (q.desde && FECHA_RE.test(q.desde)) { condiciones.push('v.fecha_salida >= ?'); params.push(q.desde); }
    if (q.hasta && FECHA_RE.test(q.hasta)) { condiciones.push('v.fecha_salida < DATE_ADD(?, INTERVAL 1 DAY)'); params.push(q.hasta); }
    if (q.camion) { condiciones.push('v.fk_camion = ?'); params.push(Number(q.camion)); }
    if (q.conductor) { condiciones.push('v.fk_conductor = ?'); params.push(Number(q.conductor)); }
    return { where: condiciones.length ? 'WHERE ' + condiciones.join(' AND ') : '', params };
};

// Viajes filtrados con su total de gastos (subconsulta reutilizable)
const baseViajes = (where) => `
    SELECT v.id_viaje, v.nro_guia, v.fecha_salida, v.fecha_llegada, v.origen, v.destino,
           v.producto_carga, COALESCE(v.toneladas, 0) AS toneladas,
           COALESCE(v.valor_flete, 0) AS flete, COALESCE(g.total, 0) AS gastos,
           v.fk_camion, v.fk_conductor
    FROM viajes v
    LEFT JOIN (SELECT fk_viaje, SUM(monto) AS total FROM gastos GROUP BY fk_viaje) g ON g.fk_viaje = v.id_viaje
    ${where}`;

const num = (v) => Number(v) || 0;
const margen = (utilidad, ingresos) => ingresos > 0 ? Number(((utilidad / ingresos) * 100).toFixed(1)) : 0;
const fila = (r) => {
    const ingresos = num(r.ingresos), gastos = num(r.gastos), toneladas = num(r.toneladas), viajes = num(r.viajes);
    const utilidad = ingresos - gastos;
    return {
        ...r, viajes, toneladas, ingresos, gastos, utilidad,
        margen: margen(utilidad, ingresos),
        flete_por_tonelada: toneladas > 0 ? Math.round(ingresos / toneladas) : 0
    };
};

const AGREGADOS = `COUNT(*) AS viajes, SUM(b.toneladas) AS toneladas, SUM(b.flete) AS ingresos, SUM(b.gastos) AS gastos`;

const obtenerReporte = async (q) => {
    const { where, params } = construirFiltros(q);
    const base = baseViajes(where);

    const [[totales], [porMes], [porCamion], [porConductor], [porRuta], [gastosPorTipo]] = await Promise.all([
        db.query(`SELECT ${AGREGADOS} FROM (${base}) b`, params),
        db.query(`SELECT DATE_FORMAT(b.fecha_salida, '%Y-%m') AS mes, ${AGREGADOS}
                  FROM (${base}) b WHERE b.fecha_salida IS NOT NULL GROUP BY mes ORDER BY mes`, params),
        db.query(`SELECT c.id_camion, c.placa, c.marca, c.modelo, ${AGREGADOS}
                  FROM (${base}) b LEFT JOIN camiones c ON c.id_camion = b.fk_camion
                  GROUP BY c.id_camion, c.placa, c.marca, c.modelo ORDER BY ingresos DESC`, params),
        db.query(`SELECT con.id_conductor, con.nombre, ${AGREGADOS}
                  FROM (${base}) b LEFT JOIN conductores con ON con.id_conductor = b.fk_conductor
                  GROUP BY con.id_conductor, con.nombre ORDER BY ingresos DESC`, params),
        db.query(`SELECT b.origen, b.destino, ${AGREGADOS}
                  FROM (${base}) b GROUP BY b.origen, b.destino ORDER BY viajes DESC, ingresos DESC`, params),
        db.query(`SELECT COALESCE(g.tipo_gasto, 'Sin tipo') AS tipo, COUNT(*) AS cantidad, SUM(g.monto) AS total
                  FROM gastos g JOIN (${base}) b ON b.id_viaje = g.fk_viaje
                  GROUP BY g.tipo_gasto ORDER BY total DESC`, params),
    ]);

    const t = fila(totales[0] || {});
    const totalGastos = t.gastos;
    return {
        filtros: { desde: q.desde || null, hasta: q.hasta || null, camion: q.camion || null, conductor: q.conductor || null },
        resumen: {
            ...t,
            flete_promedio: t.viajes ? Math.round(t.ingresos / t.viajes) : 0,
            gasto_promedio: t.viajes ? Math.round(t.gastos / t.viajes) : 0,
            toneladas_promedio: t.viajes ? Number((t.toneladas / t.viajes).toFixed(2)) : 0,
        },
        por_mes: porMes.map(fila),
        por_camion: porCamion.map(fila),
        por_conductor: porConductor.map(fila),
        por_ruta: porRuta.map(fila),
        gastos_por_tipo: gastosPorTipo.map(g => ({
            tipo: g.tipo, cantidad: num(g.cantidad), total: num(g.total),
            porcentaje: totalGastos > 0 ? Number(((num(g.total) / totalGastos) * 100).toFixed(1)) : 0
        })),
    };
};

// Detalle de viajes (para la tabla y la exportación)
const obtenerViajesReporte = async (q) => {
    const { where, params } = construirFiltros(q);
    const [rows] = await db.query(`
        SELECT b.*, DATE_FORMAT(b.fecha_salida, '%Y-%m-%d') AS fecha_salida,
               DATE_FORMAT(b.fecha_llegada, '%Y-%m-%d') AS fecha_llegada,
               c.placa, con.nombre AS conductor,
               b.flete - b.gastos AS utilidad
        FROM (${baseViajes(where)}) b
        LEFT JOIN camiones c ON c.id_camion = b.fk_camion
        LEFT JOIN conductores con ON con.id_conductor = b.fk_conductor
        ORDER BY b.fecha_salida DESC, b.id_viaje DESC
        LIMIT 20000`, params);
    return rows.map(r => ({
        ...r, toneladas: num(r.toneladas), flete: num(r.flete), gastos: num(r.gastos), utilidad: num(r.utilidad)
    }));
};

module.exports = { obtenerReporte, obtenerViajesReporte, construirFiltros };
