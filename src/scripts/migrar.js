/**
 * Migración: toneladas en viajes, catálogo de tipos de gasto y rol SuperAdmin.
 * Se puede ejecutar varias veces sin problema (solo aplica lo que falte).
 *
 * Uso (desde la carpeta Backend):
 *   npm run migrar                                  -> solo aplica los cambios a la base de datos
 *   npm run migrar -- correo@empresa.com Clave123   -> además crea (o asciende) ese usuario como SuperAdmin
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const TIPOS_INICIALES = [
    'Combustible (ACPM)', 'Peaje', 'Viáticos / Liga', 'Comisión', 'Porcentaje',
    'Engrasado', 'Aceite de motor', 'Repuestos', 'Seguridad', 'Seguimiento',
    'Planilla', 'Plástico', 'Alimentación', 'Hospedaje', 'Reparación menor', 'Otro'
];

const columnaExiste = async (conn, tabla, columna) => {
    const [rows] = await conn.query(
        `SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [tabla, columna]
    );
    return rows.length > 0;
};

(async () => {
    const [email, password] = process.argv.slice(2);
    if (email && (!password || password.length < 6)) {
        console.error('La contraseña del SuperAdmin debe tener mínimo 6 caracteres.');
        process.exit(1);
    }

    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        ssl: { rejectUnauthorized: false }
    });

    try {
        // 1. Toneladas en viajes
        if (!(await columnaExiste(conn, 'viajes', 'toneladas'))) {
            await conn.query(`ALTER TABLE viajes ADD COLUMN toneladas DECIMAL(10,2) NULL AFTER producto_carga`);
            console.log('✓ Columna viajes.toneladas creada');
        } else console.log('· viajes.toneladas ya existía');

        // 2. Catálogo de tipos de gasto
        await conn.query(`
            CREATE TABLE IF NOT EXISTS tipos_gasto (
                id_tipo_gasto INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                descripcion VARCHAR(255) NULL,
                estado TINYINT NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_tipos_gasto_nombre (nombre)
            )`);
        // gastos.tipo_gasto debe aceptar cualquier nombre del catálogo (por si era ENUM o muy corto)
        const [[colTipo]] = await conn.query(
            `SELECT DATA_TYPE AS tipo, CHARACTER_MAXIMUM_LENGTH AS largo FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gastos' AND COLUMN_NAME = 'tipo_gasto'`);
        if (colTipo && (colTipo.tipo === 'enum' || Number(colTipo.largo) < 100)) {
            await conn.query('ALTER TABLE gastos MODIFY tipo_gasto VARCHAR(100) NULL');
            console.log('✓ gastos.tipo_gasto ajustado a VARCHAR(100)');
        }

        const [[{ total }]] = await conn.query('SELECT COUNT(*) AS total FROM tipos_gasto');
        if (Number(total) === 0) {
            for (const nombre of TIPOS_INICIALES) {
                await conn.query('INSERT IGNORE INTO tipos_gasto (nombre) VALUES (?)', [nombre]);
            }
            // Incluye también los tipos que ya se usan en gastos registrados
            await conn.query(`
                INSERT IGNORE INTO tipos_gasto (nombre)
                SELECT DISTINCT TRIM(tipo_gasto) FROM gastos
                WHERE tipo_gasto IS NOT NULL AND TRIM(tipo_gasto) <> ''`);
            console.log('✓ Tabla tipos_gasto creada y cargada con los tipos iniciales');
        } else console.log('· tipos_gasto ya tenía datos');

        // 3. Estado (activo/inactivo) en usuarios
        if (!(await columnaExiste(conn, 'usuarios', 'estado'))) {
            await conn.query(`ALTER TABLE usuarios ADD COLUMN estado TINYINT NOT NULL DEFAULT 1`);
            console.log('✓ Columna usuarios.estado creada');
        } else console.log('· usuarios.estado ya existía');

        // 4. Rol SuperAdmin
        let [[rolSuper]] = await conn.query(`SELECT id_rol FROM rol WHERE nombre = 'SuperAdmin'`);
        if (!rolSuper) {
            const [[{ siguiente }]] = await conn.query('SELECT COALESCE(MAX(id_rol), 0) + 1 AS siguiente FROM rol');
            await conn.query(`INSERT INTO rol (id_rol, nombre) VALUES (?, 'SuperAdmin')`, [siguiente]);
            rolSuper = { id_rol: siguiente };
            console.log(`✓ Rol SuperAdmin creado (id_rol = ${siguiente})`);
        } else console.log(`· Rol SuperAdmin ya existía (id_rol = ${rolSuper.id_rol})`);

        // 5. Usuario SuperAdmin (opcional)
        if (email) {
            const correo = email.trim().toLowerCase();
            const hash = await bcrypt.hash(password, 10);
            const [existentes] = await conn.query('SELECT id_usuario FROM usuarios WHERE LOWER(email) = ?', [correo]);
            if (existentes.length > 0) {
                await conn.query(
                    'UPDATE usuarios SET fk_rol = ?, password_hash = ?, estado = 1 WHERE id_usuario = ?',
                    [rolSuper.id_rol, hash, existentes[0].id_usuario]
                );
                console.log(`✓ ${correo} ahora es SuperAdmin (se actualizó su contraseña)`);
            } else {
                await conn.query(
                    'INSERT INTO usuarios (email, password_hash, fk_rol, estado) VALUES (?, ?, ?, 1)',
                    [correo, hash, rolSuper.id_rol]
                );
                console.log(`✓ Usuario SuperAdmin ${correo} creado`);
            }
        }

        const [[{ supers }]] = await conn.query('SELECT COUNT(*) AS supers FROM usuarios WHERE fk_rol = ?', [rolSuper.id_rol]);
        if (Number(supers) === 0) {
            console.log('\n⚠ Aún no hay ningún SuperAdmin. Ejecuta: npm run migrar -- correo@empresa.com TuClave');
        }
        console.log('\nMigración terminada.');
    } catch (error) {
        console.error('Error en la migración:', error.message);
        process.exitCode = 1;
    } finally {
        await conn.end();
    }
})();
