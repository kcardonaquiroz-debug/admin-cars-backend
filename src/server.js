require('dotenv').config();

const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
    console.log(` Servidor corriendo en http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
    console.log('Cerrando servidor...');
    await pool.end();

    server.close(() => {
        console.log(' Proceso terminado');
        process.exit(0);
    });
    
});