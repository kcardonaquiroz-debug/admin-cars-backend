const AuthService = require('../services/authService');

class AuthController {           

    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await AuthService.login(email, password);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            if (error.statusCode) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            next(error);
        }
    }

    static async registrar(req, res, next) {
        try {
            const result = await AuthService.registrarUsuario(req.body);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

}                             

module.exports = AuthController; 