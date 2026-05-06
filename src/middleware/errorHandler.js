const errorHandler = (err, req, res, next) => {

    console.error(`[ERROR] ${err.message}`);

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        error: {
            message: err.message || 'Error Interno del Servidor',
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }
    });
};

module.exports = errorHandler;