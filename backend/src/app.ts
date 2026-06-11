import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';
import authRoutes from './routes/authRoutes';
import proveedorRoutes from './routes/proveedorRoutes';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

app.use('/api/auth', authRoutes);
app.use('/api/proveedores', proveedorRoutes);

export default app;