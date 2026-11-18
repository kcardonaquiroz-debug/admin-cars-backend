/**
 * Copia única de la base de datos anterior (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT)
 * a la base de datos nueva (DATABASE_URL), por ejemplo de Aiven a TiDB Cloud.
 *
 * Solo se ejecuta si:
 *   - existen DATABASE_URL y DB_HOST,
 *   - la variable MIGRAR_DATOS vale "si",
 *   - y la base nueva todavía no tiene tablas (ni la marca de copia terminada).
 * Si algo falla, se borran las tablas a medio copiar para reintentar en el siguiente arranque.
 */
const mysql = require('mysql2/promise');
const { AUTO_ID } = require('./esquema');

const MARCA = '_copia_origen';
const LOTE = 500;

const tablasDe = async (conn) => {
    const [rows] = await conn.query(`SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'`);
    return rows.map(r => Object.values(r)[0]);
};

// Ordena las tablas para crear primero las referenciadas por llaves foráneas
const ordenarPorDependencias = async (conn, tablas) => {
    const [refs] = await conn.query(
        `SELECT TABLE_NAME AS tabla, REFERENCED_TABLE_NAME AS depende
         FROM information_schema.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL`);
    const deps = Object.fromEntries(tablas.map(t => [t, new Set()]));
    for (const r of refs) if (deps[r.tabla] && r.depende !== r.tabla && deps[r.depende]) deps[r.tabla].add(r.depende);
    const orden = [], visitadas = new Set();
    const visitar = (t, camino = new Set()) => {
        if (visitadas.has(t) || camino.has(t)) return;
        camino.add(t);
        for (const d of deps[t]) visitar(d, camino);
        visitadas.add(t);
        orden.push(t);
    };
    tablas.forEach(t => visitar(t));
    return orden;
};

const copiarDesdeOrigen = async (destino, log = console.log) => {
    if (!process.env.DATABASE_URL || !process.env.DB_HOST) return;
    if (String(process.env.MIGRAR_DATOS || '').toLowerCase() !== 'si') return;

    const tablasDestino = await tablasDe(destino);
    if (tablasDestino.includes(MARCA)) return;          // ya se copió antes
    if (tablasDestino.length > 0) {
        log(`· La base nueva ya tiene tablas; no se copian datos (${tablasDestino.length} tablas).`);
        return;
    }

    log(`Copiando datos desde ${process.env.DB_HOST} ...`);
    const origen = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false },
        connectTimeout: 20000,
    });

    // Aiven usa sql_mode con ANSI_QUOTES: SHOW CREATE TABLE devolvería "tabla" en vez de `tabla`,
    // y TiDB/MySQL estándar no lo aceptan. Se pide el formato estándar en esta sesión.
    await origen.query(`SET SESSION sql_mode = 'NO_ENGINE_SUBSTITUTION'`);
    await origen.query(`SET SESSION sql_quote_show_create = 1`);

    const creadas = [];
    try {
        const tablas = await ordenarPorDependencias(origen, (await tablasDe(origen)).filter(t => t !== MARCA));
        await destino.query('SET FOREIGN_KEY_CHECKS = 0');
        const resumen = [];
        for (const tabla of tablas) {
            const [[def]] = await origen.query(`SHOW CREATE TABLE \`${tabla}\``);
            let crear = def['Create Table'];
            if (/AUTO_INCREMENT/i.test(crear)) crear += ` ${AUTO_ID}`;
            await destino.query(crear);
            creadas.push(tabla);

            const [filas] = await origen.query(`SELECT * FROM \`${tabla}\``);
            if (filas.length) {
                const columnas = Object.keys(filas[0]);
                const lote = /foto|blob/i.test(tabla) ? 20 : LOTE;
                for (let i = 0; i < filas.length; i += lote) {
                    const valores = filas.slice(i, i + lote).map(f => columnas.map(c => f[c]));
                    await destino.query(
                        `INSERT INTO \`${tabla}\` (${columnas.map(c => `\`${c}\``).join(', ')}) VALUES ?`, [valores]
                    );
                }
            }
            resumen.push(`${tabla}: ${filas.length}`);
        }
        await destino.query('SET FOREIGN_KEY_CHECKS = 1');
        await destino.query(`CREATE TABLE \`${MARCA}\` (copiado TIMESTAMP DEFAULT CURRENT_TIMESTAMP, origen VARCHAR(255), detalle TEXT)`);
        await destino.query(`INSERT INTO \`${MARCA}\` (origen, detalle) VALUES (?, ?)`, [process.env.DB_HOST, resumen.join(', ')]);
        log(`✓ Datos copiados (${tablas.length} tablas) → ${resumen.join(', ') || 'origen vacío'}`);
    } catch (error) {
        log(`✗ Error copiando datos: ${error.message}. Se deshace la copia para reintentar en el próximo arranque.`);
        try {
            await destino.query('SET FOREIGN_KEY_CHECKS = 0');
            for (const t of creadas.reverse()) await destino.query(`DROP TABLE IF EXISTS \`${t}\``);
            await destino.query('SET FOREIGN_KEY_CHECKS = 1');
        } catch { /* nada más que hacer */ }
        error.copiaFallida = true;
        throw error;
    } finally {
        await origen.end().catch(() => {});
    }
};

module.exports = { copiarDesdeOrigen };
