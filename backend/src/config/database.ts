import sequelize from './sequelize';
import initModels from '../models';


export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    initModels();
    console.log('✅ Conectado a MySQL');
  } catch (error) {
    console.error('❌ Error al conectar:', error);
    process.exit(1);
  }
};