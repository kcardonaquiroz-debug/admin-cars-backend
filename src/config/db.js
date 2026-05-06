const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10
});

// Test conexión
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Conexión a MySQL exitosa');
        connection.release();
    } catch (error) {
        console.error('Error conectando a MySQL:');
        console.error(error.message);
        process.exit(1);
    }
})();

module.exports = pool;