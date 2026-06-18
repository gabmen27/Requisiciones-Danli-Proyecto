import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';
import authRoutes from './routes/authRoutes';
import proveedorRoutes from './routes/proveedorRoutes';
import solicitudRoutes from './routes/solicitudRoutes';
import ordenCompraRoutes from './routes/ordenCompraRoutes';
import requisicionRoutes from './routes/requisicionRoutes';
import usuarioRoutes from './routes/usuarioRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import configuracionRoutes from './routes/configuracionRoutes';

dotenv.config();

const app = express();

// CORS — permite peticiones desde el frontend
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // permite cargar imágenes desde otro origen
}));

app.use(express.json());

// Archivos estáticos — logos e imágenes subidas
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Ping de prueba
app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// Rutas
app.use('/api/auth',          authRoutes);
app.use('/api/proveedores',   proveedorRoutes);
app.use('/api/solicitudes',   solicitudRoutes);
app.use('/api/ordenes-compra',ordenCompraRoutes);
app.use('/api/requisiciones', requisicionRoutes);
app.use('/api/usuarios',      usuarioRoutes);
app.use('/api/dashboard',     dashboardRoutes);
app.use('/api/configuracion', configuracionRoutes);

export default app;