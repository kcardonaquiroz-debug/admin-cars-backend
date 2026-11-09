require('dotenv').config();

const app = require('./app');
const pool = require('./config/db');
const { aplicarMigraciones } = require('./config/migraciones');

const PORT = process.env.PORT || 4000;

// Aplica a la base de datos los cambios que falten (columnas y tablas nuevas).
// Si se configuran SUPERADMIN_EMAIL y SUPERADMIN_PASSWORD, crea el SuperAdmin cuando aún no hay ninguno.
const migrar = async () => {
    const conn = await pool.getConnection();
    try {
        await aplicarMigraciones(conn, {
            superadmin: { email: process.env.SUPERADMIN_EMAIL, password: process.env.SUPERADMIN_PASSWORD },
            soloSiNoHaySuperAdmin: true,
            log: (m) => console.log('[migraciones]', m)
        });
        console.log('[migraciones] Base de datos al día');
    } catch (error) {
        console.error('[migraciones] Error:', error.message);
    } finally {
        conn.release();
    }
};

let server;
migrar().finally(() => {
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
