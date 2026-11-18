require('dotenv').config();

const mysql = require('mysql2/promise');
const app = require('./app');
const pool = require('./config/db');
const { aplicarEsquema } = require('./config/esquema');
const { copiarDesdeOrigen } = require('./config/copiarOrigen');
const { aplicarMigraciones } = require('./config/migraciones');

const PORT = process.env.PORT || 4000;
const log = (m) => console.log('[base de datos]', m);

// Con DATABASE_URL (TiDB) la base de datos puede no existir todavía: se crea.
const asegurarBaseDatos = async () => {
    if (!process.env.DATABASE_URL) return;
    const { database, ...sinBase } = pool.configuracion;
    const conn = await mysql.createConnection({ ...sinBase, connectTimeout: 20000 });
    try {
        await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    } finally {
        await conn.end();
    }
};

// 1) base de datos  2) copia única desde la BD anterior  3) tablas base  4) migraciones
const prepararBaseDatos = async () => {
    log(`Conectando a ${pool.infoConexion.host} / ${pool.infoConexion.database} (${pool.infoConexion.origen})`);
    let conn;
    try {
        await asegurarBaseDatos();
        conn = await pool.getConnection();
        log('Conexión exitosa');
        try {
            await copiarDesdeOrigen(conn, log);
        } catch (error) {
            // Sin la copia no se crean tablas vacías, para poder reintentar en el próximo arranque
            console.error('[base de datos] No se pudo copiar desde la base anterior:', error.message);
            log('La aplicación arranca, pero sin datos hasta que la copia funcione (¿la base anterior está encendida?).');
            return;
        }
        await aplicarEsquema(conn, log);
        await aplicarMigraciones(conn, {
            superadmin: { email: process.env.SUPERADMIN_EMAIL, password: process.env.SUPERADMIN_PASSWORD },
            soloSiNoHaySuperAdmin: true,
            log,
        });
        log('Base de datos al día');
    } catch (error) {
        console.error('[base de datos] Error:', error.message);
    } finally {
        if (conn) conn.release();
    }
};

let server;
prepararBaseDatos().finally(() => {
    server = app.listen(PORT, () => {
        console.log(` Servidor corriendo en:${PORT}`);
    });
});

process.on('SIGINT', async () => {
    console.log('Cerrando servidor...');
    await pool.end();

    if (!server) process.exit(0);
    server.close(() => {
        console.log(' Proceso terminado');
        process.exit(0);
    });
});
