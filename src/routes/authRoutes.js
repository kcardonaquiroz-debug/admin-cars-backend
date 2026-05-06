const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { verificarToken, autorizarRoles } = require('../middleware/authMiddleware');

// Rutas públicas
router.post('/register', AuthController.registrar);
router.post('/login',    AuthController.login);

// Ruta protegida — requiere token
router.get('/perfil', verificarToken, (req, res) => {
    res.json({
        success: true,
        data: `Hola ${req.user.email}, tu rol es ${req.user.rol}`
    });
});

// Ruta protegida por rol
router.get(
    '/admin-dashboard',
    verificarToken,
    autorizarRoles('Administrador', 'co_administrador'),
    (req, res) => {
        res.json({
            success: true,
            data: 'Bienvenido al panel de administración.'
        });
    }
);

module.exports = router;