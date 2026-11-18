const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Conexión a la base de datos.
 * - Si existe DATABASE_URL (ej. TiDB Cloud: mysql://usuario:clave@host:4000/admincars) se usa esa.
 * - Si no, se usan DB_HOST, DB_USER, DB_PASSWORD, DB_NAME y DB_PORT (Aiven u otro MySQL).
 */
const desdeUrl = (url) => {
    const u = new URL(url);
    return {
        host: u.hostname,
        port: Number(u.port) || 4000,
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
        database: decodeURIComponent(u.pathname.replace(/^\//, '')) || 'admincars',
        // TiDB Cloud exige TLS con certificado válido
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    };
};

const desdeVariables = () => ({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
});

const configuracion = process.env.DATABASE_URL ? desdeUrl(process.env.DATABASE_URL) : desdeVariables();

const pool = mysql.createPool({
    ...configuracion,
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 20000,
    enableKeepAlive: true,
});

// Datos de conexión (sin contraseña) para el arranque y los logs
pool.infoConexion = {
    origen: process.env.DATABASE_URL ? 'DATABASE_URL' : 'DB_*',
    host: configuracion.host,
    database: configuracion.database,
};
pool.configuracion = configuracion;

module.exports = pool;
