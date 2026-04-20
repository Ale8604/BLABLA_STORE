require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes    = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes   = require('./routes/orders');
const bannerRoutes  = require('./routes/banners');

const app  = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  'https://blabla-store-e933-glzfm3oyw.vercel.app',
];
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
  credentials: true,
}));
app.use(express.json({ limit: '25mb' }));

// Límite para rutas de autenticación: 20 intentos cada 15 min por IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos. Intentá de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/banners',  bannerRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Manejador global de errores — siempre devuelve JSON
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err.message, err.stack);
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

// Evita que el proceso muera por promesas no capturadas
process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err);
});

app.listen(PORT, () => console.log(`Backend corriendo en http://localhost:${PORT}`));
