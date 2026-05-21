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
const liquidacionRoutes = require('./routes/liquidacionRoutes');

const allowedOrigins = [
  'http://localhost:5173',
  'https://admin-cars.vercel.app'
];

const app = express();

// 🛡️ Configuración de Helmet adaptada para permitir la exportación de recursos cross-origin
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// Usamos directamente tu constante allowedOrigins de forma limpia
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', camionRouthes);
app.use('/api/v1', condutorRoutes);
app.use('/api/v1', facturaRoutes);
app.use('/api/v1', gastoRoutes);
app.use('/api/v1', mantenimientoRoutes);
app.use('/api/v1', viajeRoutes);
app.use('/api/v1', liquidacionRoutes);

app.use('/api/v1/auth', authRoutes);
app.use('/api', healthRoutes);
app.use(errorHandler);

module.exports = app;