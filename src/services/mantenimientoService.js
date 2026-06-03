const db = require("../config/db");

const obtenerMantenimientos = async () => {
    const [rows] = await db.query("SELECT * FROM mantenimientos");
    return rows;
};

const validarCosto = (costo) => {
    if (costo == null || isNaN(costo) || Number(costo) < 0) {
        throw new Error('El costo total no puede ser negativo ni estar vacío');
    }
};

const crearMantenimiento = async (m) => {
    validarCosto(m.costo_total);
    const [result] = await db.execute(
        `INSERT INTO mantenimientos VALUES(null,?,?,?,?)`,
        [m.fk_camion, m.descripcion, m.costo_total, m.fecha_mantenimiento]
    );
    return result;
};

const actualizarMantenimiento = async (id, m) => {
    validarCosto(m.costo_total);
    const [result] = await db.execute(
        `UPDATE mantenimientos SET fk_camion=?, descripcion=?, costo_total=?, fecha_mantenimiento=? WHERE id_mantenimiento=?`,
        [m.fk_camion, m.descripcion, m.costo_total, m.fecha_mantenimiento, id]
    );
    return result;
};

const eliminarMantenimiento = async (id) => {
    try {
        const [result] = await db.execute(
            `DELETE FROM mantenimientos WHERE id_mantenimiento=?`, [id]
        );
        return result;
    } catch (error) {
        if (error.errno === 1451) {
            throw new Error('No se puede eliminar el mantenimiento porque tiene registros asociados.');
        }
        throw error;
    }
};

module.exports = { obtenerMantenimientos, crearMantenimiento, actualizarMantenimiento, eliminarMantenimiento };