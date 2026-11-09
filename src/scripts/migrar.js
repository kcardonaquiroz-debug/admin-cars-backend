/**
 * Aplica las migraciones a mano (el servidor también las aplica solo al arrancar).
 *
 * Uso (desde la carpeta Backend):
 *   npm run migrar                                  -> solo aplica los cambios a la base de datos
 *   npm run migrar -- correo@empresa.com Clave123   -> además crea (o asciende) ese usuario como SuperAdmin
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const { aplicarMigraciones } = require('../config/migraciones');

(async () => {
    const [email, password] = process.argv.slice(2);
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await aplicarMigraciones(conn, { superadmin: email ? { email, password } : null });
        console.log('\nMigración terminada.');
    } catch (error) {
        console.error('Error en la migración:', error.message);
        process.exitCode = 1;
    } finally {
        await conn.end();
    }
})();
