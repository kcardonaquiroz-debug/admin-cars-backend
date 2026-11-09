const db = require("../config/db");

// Avisos de vencimiento: licencias de conductores y documentos de camiones
// (seguro y tecnomecánica) que vencen dentro de los próximos DIAS_AVISO días o ya vencieron.
const DIAS_AVISO = 15;

const consultaLicencias = (filtro = '') => `
    SELECT 'licencia' AS tipo, con.id_conductor AS id_referencia,
           con.nombre AS titulo, con.licencia_nro AS detalle,
           DATE_FORMAT(con.licencia_vence, '%Y-%m-%d') AS vence,
           DATEDIFF(con.licencia_vence, CURDATE()) AS dias_restantes
    FROM conductores con
    WHERE con.estado = 1 AND con.licencia_vence IS NOT NULL
      AND con.licencia_vence <= DATE_ADD(CURDATE(), INTERVAL ? DAY) ${filtro}`;

const consultaDocumentoCamion = (tipo, columna, detalle, filtro = '') => `
    SELECT '${tipo}' AS tipo, c.id_camion AS id_referencia,
           CONCAT(COALESCE(c.placa, ''), ' — ', COALESCE(c.marca, ''), ' ', COALESCE(c.modelo, '')) AS titulo,
           ${detalle} AS detalle,
           DATE_FORMAT(c.${columna}, '%Y-%m-%d') AS vence,
           DATEDIFF(c.${columna}, CURDATE()) AS dias_restantes
    FROM camiones c
    WHERE c.estado = 1 AND c.${columna} IS NOT NULL
      AND c.${columna} <= DATE_ADD(CURDATE(), INTERVAL ? DAY) ${filtro}`;

const obtenerAlertas = async (usuario) => {
    const esConductor = usuario.rol === 'Conductor';

    // Un conductor solo ve su licencia y los documentos del camión que tiene asignado
    const filtroLicencia = esConductor ? 'AND con.fk_usuario = ?' : '';
    const filtroCamion = esConductor
        ? 'AND c.fk_conductor IN (SELECT id_conductor FROM conductores WHERE fk_usuario = ?)'
        : '';
    const extra = esConductor ? [usuario.id] : [];

    const [licencias] = await db.query(consultaLicencias(filtroLicencia), [DIAS_AVISO, ...extra]);
    const [seguros] = await db.query(
        consultaDocumentoCamion('seguro', 'seguro_vence',
            "CONCAT_WS(' · ', NULLIF(c.seguro_aseguradora, ''), NULLIF(c.seguro_poliza, ''))", filtroCamion),
        [DIAS_AVISO, ...extra]
    );
    const [tecnos] = await db.query(
        consultaDocumentoCamion('tecnomecanica', 'tecnomecanica_vence', 'c.tecnomecanica_nro', filtroCamion),
        [DIAS_AVISO, ...extra]
    );

    return [...licencias, ...seguros, ...tecnos]
        .map(a => ({ ...a, dias_restantes: Number(a.dias_restantes), vencido: Number(a.dias_restantes) < 0 }))
        .sort((a, b) => a.dias_restantes - b.dias_restantes);
};

module.exports = { obtenerAlertas, DIAS_AVISO };
