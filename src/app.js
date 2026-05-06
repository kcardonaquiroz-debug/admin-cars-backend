const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes');
const authControllers = require('./controllers/authController');
const authMiddlewares = require('./middleware/authMiddleware');
const authService = require('./services/authService');
const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health.routes');

const camionRouthes = require('./routes/camionRoutes');
const condutorRoutes = require('./routes/conductorRoutes'); 
const facturaRoutes = require('./routes/facturaRoutes');
const gastoRoutes = require('./routes/gastoRoutes');
const mantenimientoRoutes = require('./routes/mantenimientoRoutes');
const viajeRoutes = require('./routes/viajeRoutes');

const app = express();

app.use(helmet());
app.use(require('cors')());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', camionRouthes);
app.use('/api/v1', condutorRoutes);
app.use('/api/v1', facturaRoutes);
app.use('/api/v1', gastoRoutes);
app.use('/api/v1', mantenimientoRoutes);
app.use('/api/v1', viajeRoutes);

app.use('/api/v1/auth', authRoutes);
app.use('/api', healthRoutes);
app.use(errorHandler);

module.exports = app;