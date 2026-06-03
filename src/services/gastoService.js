const db = require("../config/db");

const obtenerGastos = async () => {
    const [rows] = await db.query("SELECT * FROM gastos");
    return rows;
};

const validarMonto = (monto) => {
    if (monto == null || isNaN(monto) || Number(monto) < 0) {
        throw new Error('El monto no puede ser negativo ni estar vacío');
    }
};

const crearGasto = async (g) => {
    validarMonto(g.monto);
    const [result] = await db.execute(
        `INSERT INTO gastos (fk_viaje, tipo_gasto, categoria, monto) VALUES(?,?,?,?)`,
        [g.fk_viaje, g.tipo_gasto, g.categoria || null, g.monto]
    );
    return result;
};

const actualizarGasto = async (id, g) => {
    validarMonto(g.monto);
    const [result] = await db.execute(
        `UPDATE gastos SET fk_viaje=?, tipo_gasto=?, categoria=?, monto=? WHERE id_gastos=?`,
        [g.fk_viaje, g.tipo_gasto, g.categoria || null, g.monto, id]
    );
    return result;
};

const eliminarGasto = async (id) => {
    const [result] = await db.execute(
        `DELETE FROM gastos WHERE id_gastos=?`, [id]
    );
    return result;
};

module.exports = { obtenerGastos, crearGasto, actualizarGasto, eliminarGasto };