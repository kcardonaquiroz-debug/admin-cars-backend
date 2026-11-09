const express = require('express');
const router = express.Router();
const u = require('../controllers/usuarioController');
const { verificarToken, soloSuperAdmin } = require('../middleware/authMiddleware');

// Solo el SuperAdmin gestiona usuarios y contraseñas
router.get('/usuarios/roles', verificarToken, soloSuperAdmin, u.getRoles);
router.get('/usuarios', verificarToken, soloSuperAdmin, u.getUsuarios);
router.post('/usuarios', verificarToken, soloSuperAdmin, u.postUsuario);
router.put('/usuarios/:id', verificarToken, soloSuperAdmin, u.putUsuario);
router.delete('/usuarios/:id', verificarToken, soloSuperAdmin, u.deleteUsuario);

module.exports = router;
