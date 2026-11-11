const db = require("../config/db");

// Datos de prueba: viajes con guía 'DEMO-xxxxx' y sus gastos, para probar los reportes.
// Todo lo generado se puede borrar con borrarDatosDemo() sin tocar los datos reales.

const PREFIJO = 'DEMO-';
const MAX_POR_LLAMADO = 5000;

// Rutas típicas en Colombia con distancia aproximada en km
const RUTAS = [
    ['Medellín', 'Bogotá', 415], ['Bogotá', 'Medellín', 415], ['Medellín', 'Cali', 420], ['Cali', 'Medellín', 420],
    ['Bogotá', 'Cali', 460], ['Cali', 'Bogotá', 460], ['Medellín', 'Barranquilla', 700], ['Barranquilla', 'Medellín', 700],
    ['Cartagena', 'Medellín', 640], ['Medellín', 'Cartagena', 640], ['Buenaventura', 'Bogotá', 520], ['Buenaventura', 'Medellín', 540],
    ['Bogotá', 'Bucaramanga', 400], ['Bucaramanga', 'Bogotá', 400], ['Medellín', 'Manizales', 195], ['Manizales', 'Medellín', 195],
    ['Bogotá', 'Villavicencio', 120], ['Medellín', 'Pereira', 215], ['Cali', 'Pasto', 390], ['Barranquilla', 'Bogotá', 990],
    ['Medellín', 'Montería', 400], ['Santa Marta', 'Medellín', 780], ['Bogotá', 'Ibagué', 200], ['Medellín', 'Rionegro', 45],
];
const PRODUCTOS = ['Cemento', 'Café', 'Arroz', 'Maíz', 'Fertilizante', 'Acero', 'Madera', 'Azúcar', 'Contenedor', 'Carbón',
    'Abarrotes', 'Bebidas', 'Ladrillo', 'Papel', 'Plástico', 'Insumos agrícolas'];

const azar = (min, max) => min + Math.random() * (max - min);
const entero = (min, max) => Math.floor(azar(min, max + 1));
const elegir = (lista) => lista[Math.floor(Math.random() * lista.length)];
const redondear = (v, a = 1000) => Math.round(v / a) * a;
const fechaISO = (d) => d.toISOString().slice(0, 10);

const asegurarFlota = async (conn) => {
    let [camiones] = await conn.query(`SELECT id_camion, capacidad, fk_conductor FROM camiones WHERE estado = 1`);
    let [conductores] = await conn.query(`SELECT id_conductor FROM conductores WHERE estado = 1`);

    if (conductores.length === 0) {
        for (let i = 1; i <= 5; i++) {
            await conn.query(
                `INSERT INTO conductores (nombre, telefono, licencia_nro, licencia_vence, estado) VALUES (?, ?, ?, ?, 1)`,
                [`Conductor ${i} (demo)`, `300000000${i}`, `${PREFIJO}LIC-${i}`, fechaISO(new Date(Date.now() + 365 * 86400000))]
            );
        }
        [conductores] = await conn.query(`SELECT id_conductor FROM conductores WHERE estado = 1`);
    }
    if (camiones.length === 0) {
        for (let i = 1; i <= 5; i++) {
            await conn.query(
                `INSERT INTO camiones (marca, placa, modelo, capacidad, estado, fk_conductor) VALUES (?, ?, ?, ?, 1, ?)`,
                [elegir(['Kenworth', 'International', 'Freightliner', 'Volvo']), `${PREFIJO}${i}`, String(entero(2012, 2023)), 34,
                 conductores[(i - 1) % conductores.length].id_conductor]
            );
        }
        [camiones] = await conn.query(`SELECT id_camion, capacidad, fk_conductor FROM camiones WHERE estado = 1`);
    }
    return { camiones, conductores };
};

const generarGastos = (km, toneladas, dias) => {
    const gastos = [];
    const galones = km / azar(5.5, 7.5);                       // rendimiento de una tractomula
    gastos.push(['Combustible (ACPM)', `${Math.round(galones)} galones ACPM`, redondear(galones * azar(10500, 11800), 100)]);
    if (km > 80) gastos.push(['Peaje', `${Math.max(1, Math.round(km / 90))} peajes`, redondear((km / 90) * azar(38000, 52000), 100)]);
    gastos.push(['Viáticos / Liga', `${dias} día(s)`, redondear(dias * azar(60000, 90000))]);
    if (dias > 1 && Math.random() < 0.6) gastos.push(['Hospedaje', `${dias - 1} noche(s)`, redondear((dias - 1) * azar(45000, 80000))]);
    if (Math.random() < 0.5) gastos.push(['Alimentación', null, redondear(dias * azar(30000, 55000))]);
    if (Math.random() < 0.25) gastos.push(['Engrasado', null, redondear(azar(40000, 90000))]);
    if (Math.random() < 0.12) gastos.push(['Repuestos', elegir(['Llanta', 'Filtro', 'Bombillo', 'Manguera']), redondear(azar(80000, 900000))]);
    if (Math.random() < 0.08) gastos.push(['Aceite de motor', null, redondear(azar(250000, 450000))]);
    if (toneladas > 30 && Math.random() < 0.3) gastos.push(['Planilla', null, redondear(azar(20000, 40000))]);
    return gastos;
};

const generarViajesDemo = async (cantidad = 1000) => {
    cantidad = Math.max(1, Math.min(MAX_POR_LLAMADO, parseInt(cantidad, 10) || 1000));
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { camiones, conductores } = await asegurarFlota(conn);

        const [[{ ultimo }]] = await conn.query(
            `SELECT COALESCE(MAX(CAST(SUBSTRING(nro_guia, ${PREFIJO.length + 1}) AS UNSIGNED)), 0) AS ultimo
             FROM viajes WHERE nro_guia LIKE '${PREFIJO}%'`);

        const hoy = new Date(); hoy.setHours(12, 0, 0, 0);
        const viajes = [];
        const gastosPorGuia = {};

        for (let i = 1; i <= cantidad; i++) {
            const guia = `${PREFIJO}${String(Number(ultimo) + i).padStart(5, '0')}`;
            const camion = elegir(camiones);
            const conductor = camion.fk_conductor && Math.random() < 0.85 ? camion.fk_conductor : elegir(conductores).id_conductor;
            const [origen, destino, km] = elegir(RUTAS);
            const capacidad = Number(camion.capacidad) > 0 ? Number(camion.capacidad) : 34;
            const toneladas = Number(azar(capacidad * 0.55, capacidad).toFixed(1));
            const dias = Math.max(1, Math.ceil(km / 450) + (Math.random() < 0.3 ? 1 : 0));

            const salida = new Date(hoy.getTime() - entero(dias, 364) * 86400000);
            const llegada = fechaISO(new Date(salida.getTime() + dias * 86400000));

            const tarifa = azar(165, 245) * (km < 150 ? 1.6 : 1);   // COP por tonelada-km (rutas cortas cuestan más por km)
            const flete = redondear(Math.max(600000, km * toneladas * tarifa), 10000);

            viajes.push([camion.id_camion, conductor, guia, fechaISO(salida), llegada, elegir(PRODUCTOS), toneladas,
                origen, destino, flete, 'completado']);
            gastosPorGuia[guia] = generarGastos(km, toneladas, dias);
        }

        const LOTE = 250;
        for (let i = 0; i < viajes.length; i += LOTE) {
            await conn.query(
                `INSERT INTO viajes (fk_camion, fk_conductor, nro_guia, fecha_salida, fecha_llegada, producto_carga, toneladas,
                                     origen, destino, valor_flete, estado) VALUES ?`,
                [viajes.slice(i, i + LOTE)]
            );
        }

        const guias = Object.keys(gastosPorGuia);
        const [ids] = await conn.query(`SELECT id_viaje, nro_guia FROM viajes WHERE nro_guia IN (?)`, [viajes.map(v => v[2])]);
        const idPorGuia = Object.fromEntries(ids.map(r => [r.nro_guia, r.id_viaje]));
        const gastos = [];
        for (const guia of guias) {
            for (const [tipo, detalle, monto] of gastosPorGuia[guia]) gastos.push([idPorGuia[guia], tipo, detalle, monto]);
        }
        for (let i = 0; i < gastos.length; i += 1000) {
            await conn.query(`INSERT INTO gastos (fk_viaje, tipo_gasto, categoria, monto) VALUES ?`, [gastos.slice(i, i + 1000)]);
        }

        await conn.commit();
        return { viajes_creados: viajes.length, gastos_creados: gastos.length };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

const contarDatosDemo = async () => {
    const [[r]] = await db.query(`SELECT COUNT(*) AS viajes FROM viajes WHERE nro_guia LIKE '${PREFIJO}%'`);
    return { viajes: Number(r.viajes) };
};

const borrarDatosDemo = async () => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const filtro = `SELECT id_viaje FROM viajes WHERE nro_guia LIKE '${PREFIJO}%'`;
        const [g] = await conn.query(`DELETE FROM gastos WHERE fk_viaje IN (SELECT id_viaje FROM (${filtro}) x)`);
        await conn.query(`DELETE FROM liquidaciones WHERE fk_viaje IN (SELECT id_viaje FROM (${filtro}) x)`);
        const [v] = await conn.query(`DELETE FROM viajes WHERE nro_guia LIKE '${PREFIJO}%'`);
        // Camiones y conductores creados solo para la demo (si hizo falta crearlos)
        await conn.query(`DELETE FROM camion_fotos WHERE fk_camion IN (SELECT id_camion FROM (SELECT id_camion FROM camiones WHERE placa LIKE '${PREFIJO}%') x)`);
        await conn.query(`DELETE FROM camiones WHERE placa LIKE '${PREFIJO}%'
                          AND id_camion NOT IN (SELECT fk_camion FROM (SELECT DISTINCT fk_camion FROM viajes WHERE fk_camion IS NOT NULL) y)`);
        await conn.query(`UPDATE conductores SET estado = 0 WHERE licencia_nro LIKE '${PREFIJO}%'`);
        await conn.commit();
        return { viajes_borrados: v.affectedRows, gastos_borrados: g.affectedRows };
    } catch (error) {
        await conn.rollback();
        if (error.errno === 1451) {
            error.message = 'Algunos viajes de prueba tienen registros asociados (por ejemplo facturas) y no se pudieron borrar.';
        }
        throw error;
    } finally {
        conn.release();
    }
};

module.exports = { generarViajesDemo, borrarDatosDemo, contarDatosDemo };
