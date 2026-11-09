/**
 * Migraciones de la base de datos (toneladas en viajes, documentos de camiones,
 * catálogo de tipos de gasto, estado de usuarios y rol SuperAdmin).
 *
 * Se ejecutan automáticamente cada vez que arranca el servidor (server.js) y solo
 * aplican lo que falte, así que se pueden correr muchas veces sin problema.
 */
const bcrypt = require('bcrypt');

const TIPOS_INICIALES = [
    'Combustible (ACPM)', 'Peaje', 'Viáticos / Liga', 'Comisión', 'Porcentaje',
    'Engrasado', 'Aceite de motor', 'Repuestos', 'Seguridad', 'Seguimiento',
    'Planilla', 'Plástico', 'Alimentación', 'Hospedaje', 'Reparación menor', 'Otro'
];

const COLUMNAS_CAMION = [
    ['matricula_nro', 'VARCHAR(50) NULL'],
    ['matricula_fecha', 'DATE NULL'],
    ['seguro_aseguradora', 'VARCHAR(100) NULL'],
    ['seguro_poliza', 'VARCHAR(50) NULL'],
    ['seguro_vence', 'DATE NULL'],
    ['tecnomecanica_nro', 'VARCHAR(50) NULL'],
    ['tecnomecanica_vence', 'DATE NULL'],
];

const columnaExiste = async (conn, tabla, columna) => {
    const [rows] = await conn.query(
        `SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [tabla, columna]
    );
    return rows.length > 0;
};

/**
 * @param conn  conexión mysql2/promise
 * @param opciones.superadmin  { email, password } para crear o ascender un SuperAdmin
 * @param opciones.soloSiNoHaySuperAdmin  si es true, solo lo crea cuando todavía no existe ninguno
 */
const aplicarMigraciones = async (conn, { superadmin = null, soloSiNoHaySuperAdmin = false, log = console.log } = {}) => {
    // 1. Toneladas en viajes
    if (!(await columnaExiste(conn, 'viajes', 'toneladas'))) {
        await conn.query(`ALTER TABLE viajes ADD COLUMN toneladas DECIMAL(10,2) NULL AFTER producto_carga`);
        log('✓ Columna viajes.toneladas creada');
    }

    // 2. Documentos del camión: matrícula, seguro y tecnomecánica
    for (const [columna, definicion] of COLUMNAS_CAMION) {
        if (!(await columnaExiste(conn, 'camiones', columna))) {
            await conn.query(`ALTER TABLE camiones ADD COLUMN ${columna} ${definicion}`);
            log(`✓ Columna camiones.${columna} creada`);
        }
    }

    // 2b. Fotos de camiones (se guardan en la BD porque el disco de Render es temporal)
    await conn.query(`
        CREATE TABLE IF NOT EXISTS camion_fotos (
            fk_camion INT PRIMARY KEY,
            data MEDIUMBLOB NOT NULL,
            mime VARCHAR(50) NOT NULL,
            actualizado TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`);

    // foto_url debe aceptar URLs largas
    const [[colFoto]] = await conn.query(
        `SELECT CHARACTER_MAXIMUM_LENGTH AS largo FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'camiones' AND COLUMN_NAME = 'foto_url'`);
    if (colFoto && colFoto.largo !== null && Number(colFoto.largo) < 500) {
        await conn.query('ALTER TABLE camiones MODIFY foto_url VARCHAR(500) NULL');
        log('✓ camiones.foto_url ampliado a 500 caracteres');
    }

    // 3. Catálogo de tipos de gasto
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
        log('✓ gastos.tipo_gasto ajustado a VARCHAR(100)');
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
        log('✓ Catálogo tipos_gasto creado con los tipos iniciales');
    }

    // 4. Estado (activo/inactivo) en usuarios
    if (!(await columnaExiste(conn, 'usuarios', 'estado'))) {
        await conn.query(`ALTER TABLE usuarios ADD COLUMN estado TINYINT NOT NULL DEFAULT 1`);
        log('✓ Columna usuarios.estado creada');
    }

    // 5. Rol SuperAdmin
    let [[rolSuper]] = await conn.query(`SELECT id_rol FROM rol WHERE nombre = 'SuperAdmin'`);
    if (!rolSuper) {
        const [[{ siguiente }]] = await conn.query('SELECT COALESCE(MAX(id_rol), 0) + 1 AS siguiente FROM rol');
        await conn.query(`INSERT INTO rol (id_rol, nombre) VALUES (?, 'SuperAdmin')`, [siguiente]);
        rolSuper = { id_rol: siguiente };
        log(`✓ Rol SuperAdmin creado (id_rol = ${siguiente})`);
    }

    // 6. Usuario SuperAdmin
    const contarSupers = async () => {
        const [[{ n }]] = await conn.query('SELECT COUNT(*) AS n FROM usuarios WHERE fk_rol = ?', [rolSuper.id_rol]);
        return Number(n);
    };

    if (superadmin && superadmin.email && superadmin.password) {
        if (String(superadmin.password).length < 6) {
            log('⚠ La contraseña del SuperAdmin debe tener mínimo 6 caracteres; no se creó.');
        } else if (!soloSiNoHaySuperAdmin || (await contarSupers()) === 0) {
            const correo = superadmin.email.trim().toLowerCase();
            const hash = await bcrypt.hash(String(superadmin.password), 10);
            const [existentes] = await conn.query('SELECT id_usuario FROM usuarios WHERE LOWER(email) = ?', [correo]);
            if (existentes.length > 0) {
                await conn.query(
                    'UPDATE usuarios SET fk_rol = ?, password_hash = ?, estado = 1 WHERE id_usuario = ?',
                    [rolSuper.id_rol, hash, existentes[0].id_usuario]
                );
                log(`✓ ${correo} ahora es SuperAdmin`);
            } else {
                await conn.query(
                    'INSERT INTO usuarios (email, password_hash, fk_rol, estado) VALUES (?, ?, ?, 1)',
                    [correo, hash, rolSuper.id_rol]
                );
                log(`✓ Usuario SuperAdmin ${correo} creado`);
            }
        }
    }

    if ((await contarSupers()) === 0) {
        log('⚠ Aún no hay ningún SuperAdmin. Configura SUPERADMIN_EMAIL y SUPERADMIN_PASSWORD en Render o ejecuta: npm run migrar -- correo clave');
    }
};

module.exports = { aplicarMigraciones };
