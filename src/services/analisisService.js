const db = require("../config/db");

const obtenerAnalisis = async () => {
    try {
        const [
            ingresos, gastos, mantens, camiones, conductores, viajes, 
            facturas, liquidaciones, gastosCombustible
        ] = await Promise.all([
            db.query(`SELECT COALESCE(SUM(valor_flete),0) AS total FROM viajes`),
            db.query(`SELECT COALESCE(SUM(monto),0) AS total FROM gastos`),
            db.query(`SELECT COUNT(*) AS total, COALESCE(SUM(costo_total),0) AS total_costo FROM mantenimientos`),
            db.query(`SELECT COUNT(*) AS total FROM camiones WHERE estado = 1`),
            db.query(`SELECT COUNT(*) AS total FROM conductores WHERE estado = 1`),
            db.query(`SELECT COUNT(*) AS total FROM viajes`),
            db.query(`SELECT COUNT(*) AS total FROM facturas`),
            db.query(`SELECT COUNT(*) AS total FROM liquidaciones`),
            db.query(`SELECT COALESCE(SUM(monto),0) AS total FROM gastos WHERE tipo_gasto = 'Combustible'`)
        ]);

        const totalIngresos = Number(ingresos[0][0].total);
        const totalGastos = Number(gastos[0][0].total);
        const gananciaNeta = totalIngresos - totalGastos;
        const rentabilidad = totalIngresos > 0 ? ((gananciaNeta / totalIngresos) * 100).toFixed(1) : 0;

        const totalViajes = Number(viajes[0][0].total);
        const promedioGastoViaje = totalViajes > 0 ? (totalGastos / totalViajes).toFixed(0) : 0;
        const promedioFleteViaje = totalViajes > 0 ? (totalIngresos / totalViajes).toFixed(0) : 0;

        const totalMantenimientos = Number(mantens[0][0].total);
        const totalCostoMantenimiento = Number(mantens[0][0].total_costo);

        const totalCamionesActivos = Number(camiones[0][0].total);
        const totalConductores = Number(conductores[0][0].total);
        const totalFacturas = Number(facturas[0][0].total);
        const totalLiquidaciones = Number(liquidaciones[0][0].total);
        const totalCombustible = Number(gastosCombustible[0][0].total);

        const viajesData = await db.query(`
            SELECT v.* FROM viajes v ORDER BY v.fecha_salida DESC
        `);
        const viajesEnCurso = viajesData[0].filter(v => v.estado === 'en_curso').length;
        const viajesCompletados = viajesData[0].filter(v => v.estado === 'completado').length;

        const camionesData = await db.query(`
            SELECT c.*,
                   (SELECT COUNT(*) FROM viajes v WHERE v.fk_camion = c.id_camion) AS total_viajes,
                   (SELECT COALESCE(SUM(m.costo_total),0) FROM mantenimientos m WHERE m.fk_camion = c.id_camion) AS total_mant
            FROM camiones c
        `);
        const camSinConductor = camionesData[0].filter(c => !c.fk_conductor).length;
        const totalViajesCamion = camionesData[0].reduce((s, c) => s + (c.total_viajes || 0), 0);
        const promedioViajesCamion = totalCamionesActivos > 0 ? (totalViajesCamion / totalCamionesActivos).toFixed(1) : 0;

        const conductorData = await db.query(`
            SELECT con.*,
                   (SELECT COUNT(*) FROM viajes v WHERE v.fk_conductor = con.id_conductor) AS total_viajes_conductor,
                   (SELECT COALESCE(SUM(v.valor_flete),0) FROM viajes v WHERE v.fk_conductor = con.id_conductor) AS total_facturado
            FROM conductores con WHERE con.estado = 1
        `);

        const now = new Date();
        const en30dias = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const hoy = now.toISOString().slice(0, 10);

        const licenciasPorVencer = conductorData[0].filter(c =>
            c.licencia_vence && c.licencia_vence > hoy && c.licencia_vence <= en30dias
        ).length;

        const licenciasVencidas = conductorData[0].filter(c =>
            c.licencia_vence && c.licencia_vence < hoy
        ).length;

        const viajesPorConductor = conductorData[0].reduce((s, c) => s + (c.total_viajes_conductor || 0), 0);
        const promedioViajesConductor = totalConductores > 0 ? (viajesPorConductor / totalConductores).toFixed(1) : 0;

        const mantenimientosProximos = await db.query(`
            SELECT COUNT(*) AS total FROM mantenimientos 
            WHERE fecha_mantenimiento BETWEEN ? AND ?
        `, [hoy, en30dias]);

        const gastosPorTipo = await db.query(`
            SELECT tipo_gasto, COALESCE(SUM(monto),0) AS total 
            FROM gastos GROUP BY tipo_gasto ORDER BY total DESC
        `);

        const mejorRuta = await db.query(`
            SELECT CONCAT(v.origen, ' → ', v.destino) AS ruta, 
                   COUNT(*) AS total_viajes,
                   COALESCE(SUM(v.valor_flete),0) AS total_ingresos
            FROM viajes v
            GROUP BY v.origen, v.destino
            ORDER BY total_ingresos DESC
            LIMIT 1
        `);

        const camionesDepreciacion = camionesData[0].map(c => {
            const anioStr = String(c.modelo || '0').replace(/[^0-9]/g, '');
            const anioModelo = parseInt(anioStr, 10);
            const edad = anioModelo > 1900 ? (new Date().getFullYear() - anioModelo) : 0;
            const valorInicial = 200000;
            const valorActual = Math.max(0, valorInicial - (edad * 0.1 * valorInicial));
            return {
                id_camion: c.id_camion,
                marca: c.marca,
                modelo: c.modelo,
                anio: anioModelo,
                edad,
                valor_inicial: valorInicial,
                valor_actual: Math.round(valorActual)
            };
        });

        const resumenDepreciacionFlota = {
            total_camiones: camionesDepreciacion.length,
            valor_inicial_total: camionesDepreciacion.reduce((s, c) => s + c.valor_inicial, 0),
            valor_actual_total: camionesDepreciacion.reduce((s, c) => s + c.valor_actual, 0),
            depreciacion_total: camionesDepreciacion.reduce((s, c) => s + (c.valor_inicial - c.valor_actual), 0)
        };

        return {
            resumen_financiero: {
                ingresos_totales: totalIngresos,
                gastos_totales: totalGastos,
                ganancia_neta: gananciaNeta,
                rentabilidad_porcentaje: parseFloat(rentabilidad),
                promedio_gasto_por_viaje: parseFloat(promedioGastoViaje),
                promedio_flete_por_viaje: parseFloat(promedioFleteViaje),
                total_facturas: totalFacturas,
                total_liquidaciones: totalLiquidaciones
            },
            flota: {
                camiones_activos: totalCamionesActivos,
                camiones_sin_conductor: camSinConductor,
                promedio_viajes_por_camion: parseFloat(promedioViajesCamion),
                conductores_activos: totalConductores,
                promedio_viajes_por_conductor: parseFloat(promedioViajesConductor)
            },
            viajes: {
                total_viajes: totalViajes,
                viajes_en_curso: viajesEnCurso,
                viajes_completados: viajesCompletados,
                viajes_pendientes: totalViajes - viajesEnCurso - viajesCompletados
            },
            mantenimiento: {
                total_mantenimientos: totalMantenimientos,
                costo_total_mantenimiento: totalCostoMantenimiento,
                mantenimientos_proximos_30dias: Number(mantenimientosProximos[0][0].total)
            },
            conductores: {
                licencias_por_vencer_30dias: licenciasPorVencer,
                licencias_vencidas: licenciasVencidas
            },
            combustible: {
                total_gastado_combustible: totalCombustible,
                porcentaje_combustible_vs_gastos: totalGastos > 0 ? parseFloat(((totalCombustible / totalGastos) * 100).toFixed(1)) : 0
            },
            gastos_por_tipo: gastosPorTipo[0].map(g => ({ tipo: g.tipo_gasto, total: Number(g.total) })),
            mejor_ruta: mejorRuta[0][0] || null,
            depreciacion_flota: {
                resumen: resumenDepreciacionFlota,
                camiones: camionesDepreciacion
            }
        };
    } catch (error) {
        throw error;
    }
};

module.exports = { obtenerAnalisis };
