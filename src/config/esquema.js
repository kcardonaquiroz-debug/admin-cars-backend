/**
 * Tablas base de AdminCARS. Se crean solo si no existen, así una base de datos
 * nueva (por ejemplo en TiDB Cloud) queda lista para usarse sin pasos manuales.
 * El comentario /*T![auto_id_cache] AUTO_ID_CACHE=1 *\/ solo lo entiende TiDB
 * (mantiene los id consecutivos); MySQL lo ignora.
 */
const AUTO_ID = '/*T![auto_id_cache] AUTO_ID_CACHE=1 */';

const TABLAS = [
    `CREATE TABLE IF NOT EXISTS rol (
        id_rol INT PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS usuarios (
        id_usuario INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(150) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        fk_rol INT NOT NULL,
        estado TINYINT NOT NULL DEFAULT 1,
        UNIQUE KEY uq_usuarios_email (email),
        CONSTRAINT fk_usuarios_rol FOREIGN KEY (fk_rol) REFERENCES rol(id_rol)
    ) ${AUTO_ID}`,
    `CREATE TABLE IF NOT EXISTS conductores (
        id_conductor INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        telefono VARCHAR(30) NULL,
        licencia_nro VARCHAR(50) NULL,
        licencia_vence DATE NULL,
        fk_usuario INT NULL,
        estado INT DEFAULT 1,
        CONSTRAINT fk_conductores_usuario FOREIGN KEY (fk_usuario) REFERENCES usuarios(id_usuario)
    ) ${AUTO_ID}`,
    `CREATE TABLE IF NOT EXISTS camiones (
        id_camion INT AUTO_INCREMENT PRIMARY KEY,
        marca VARCHAR(80) NULL,
        placa VARCHAR(20) NULL,
        modelo VARCHAR(80) NULL,
        capacidad DECIMAL(10,2) NULL,
        estado INT DEFAULT 1,
        fk_conductor INT NULL,
        foto_url VARCHAR(500) NULL,
        CONSTRAINT fk_camiones_conductor FOREIGN KEY (fk_conductor) REFERENCES conductores(id_conductor)
    ) ${AUTO_ID}`,
    `CREATE TABLE IF NOT EXISTS viajes (
        id_viaje INT AUTO_INCREMENT PRIMARY KEY,
        fk_camion INT NULL,
        fk_conductor INT NULL,
        nro_guia VARCHAR(50) NULL,
        fecha_salida DATE NULL,
        fecha_llegada DATE NULL,
        producto_carga VARCHAR(150) NULL,
        origen VARCHAR(100) NULL,
        destino VARCHAR(100) NULL,
        valor_flete DOUBLE DEFAULT 0,
        estado VARCHAR(20) DEFAULT 'en_curso',
        KEY idx_viajes_fecha (fecha_salida),
        CONSTRAINT fk_viajes_camion FOREIGN KEY (fk_camion) REFERENCES camiones(id_camion),
        CONSTRAINT fk_viajes_conductor FOREIGN KEY (fk_conductor) REFERENCES conductores(id_conductor)
    ) ${AUTO_ID}`,
    `CREATE TABLE IF NOT EXISTS gastos (
        id_gastos INT AUTO_INCREMENT PRIMARY KEY,
        fk_viaje INT NOT NULL,
        tipo_gasto VARCHAR(100) NULL,
        categoria VARCHAR(255) NULL,
        monto DOUBLE DEFAULT 0,
        CONSTRAINT fk_gastos_viaje FOREIGN KEY (fk_viaje) REFERENCES viajes(id_viaje)
    ) ${AUTO_ID}`,
    `CREATE TABLE IF NOT EXISTS liquidaciones (
        id_liquidacion INT AUTO_INCREMENT PRIMARY KEY,
        fk_viaje INT NOT NULL,
        valor_flete DOUBLE DEFAULT 0,
        total_gastos DOUBLE DEFAULT 0,
        saldo_camion DOUBLE DEFAULT 0,
        fecha_liquidacion DATE NULL,
        observaciones TEXT NULL,
        CONSTRAINT fk_liquidaciones_viaje FOREIGN KEY (fk_viaje) REFERENCES viajes(id_viaje)
    ) ${AUTO_ID}`,
    // El orden de columnas importa: el código inserta con VALUES(null,?,?,?,?)
    `CREATE TABLE IF NOT EXISTS facturas (
        id_factura INT AUTO_INCREMENT PRIMARY KEY,
        fk_conductor INT NULL,
        nombre_conductor VARCHAR(150) NULL,
        basico DOUBLE DEFAULT 0,
        fecha_factura DATE NULL,
        CONSTRAINT fk_facturas_conductor FOREIGN KEY (fk_conductor) REFERENCES conductores(id_conductor)
    ) ${AUTO_ID}`,
    `CREATE TABLE IF NOT EXISTS mantenimientos (
        id_mantenimiento INT AUTO_INCREMENT PRIMARY KEY,
        fk_camion INT NULL,
        descripcion VARCHAR(255) NULL,
        costo_total DOUBLE DEFAULT 0,
        fecha_mantenimiento DATE NULL,
        CONSTRAINT fk_mantenimientos_camion FOREIGN KEY (fk_camion) REFERENCES camiones(id_camion)
    ) ${AUTO_ID}`,
];

const aplicarEsquema = async (conn, log = console.log) => {
    const [antes] = await conn.query(`SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()`);
    for (const sql of TABLAS) await conn.query(sql);
    await conn.query(`INSERT IGNORE INTO rol (id_rol, nombre) VALUES (1, 'Administrador'), (2, 'co_administrador'), (3, 'Conductor')`);
    if (Number(antes[0].n) === 0) log('✓ Base de datos nueva: tablas base creadas');
};

module.exports = { aplicarEsquema, AUTO_ID };
