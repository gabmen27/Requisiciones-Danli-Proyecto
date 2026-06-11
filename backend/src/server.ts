import app from './app';
import { connectDB } from './config/database';

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📖 Documentación Swagger: http://localhost:${PORT}/api-docs`);
  });
};

startServer();