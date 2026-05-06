const db = require("../config/db");

const obtenerFacturas = async () => {
    const [rows] = await db.query("SELECT * FROM facturas");
    return rows;
};

const crearFactura = async (f) => {
    const [result] = await db.execute(
        `INSERT INTO facturas VALUES(null,?,?,?,?)`,
        [f.fk_conductor, f.nombre_conductor, f.basico, f.fecha_factura]
    );
    return result;
};

const actualizarFactura = async (id, f) => {
    const [result] = await db.execute(
        `UPDATE facturas SET fk_conductor=?, nombre_conductor=?, basico=?, fecha_factura=? WHERE id_factura=?`,
        [f.fk_conductor, f.nombre_conductor, f.basico, f.fecha_factura, id]
    );
    return result;
};

const eliminarFactura = async (id) => {
    const [result] = await db.execute(
        `DELETE FROM facturas WHERE id_factura=?`, [id]
    );
    return result;
};

module.exports = { obtenerFacturas, crearFactura, actualizarFactura, eliminarFactura };