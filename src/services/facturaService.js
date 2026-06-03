const db = require("../config/db");

const obtenerFacturas = async () => {
    const [rows] = await db.query("SELECT * FROM facturas");
    return rows;
};

const validarBasico = (basico) => {
    if (basico == null || isNaN(basico) || Number(basico) < 0) {
        throw new Error('El básico no puede ser negativo ni estar vacío');
    }
};

const crearFactura = async (f) => {
    validarBasico(f.basico);
    const [result] = await db.execute(
        `INSERT INTO facturas VALUES(null,?,?,?,?)`,
        [f.fk_conductor, f.nombre_conductor, f.basico, f.fecha_factura]
    );
    return result;
};

const actualizarFactura = async (id, f) => {
    validarBasico(f.basico);
    const [result] = await db.execute(
        `UPDATE facturas SET fk_conductor=?, nombre_conductor=?, basico=?, fecha_factura=? WHERE id_factura=?`,
        [f.fk_conductor, f.nombre_conductor, f.basico, f.fecha_factura, id]
    );
    return result;
};

const eliminarFactura = async (id) => {
    try {
        const [result] = await db.execute(
            `DELETE FROM facturas WHERE id_factura=?`, [id]
        );
        return result;
    } catch (error) {
        if (error.errno === 1451) {
            throw new Error('No se puede eliminar la factura porque tiene registros asociados.');
        }
        throw error;
    }
};

module.exports = { obtenerFacturas, crearFactura, actualizarFactura, eliminarFactura };