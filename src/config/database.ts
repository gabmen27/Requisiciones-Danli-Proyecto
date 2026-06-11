import sequelize from './sequelize';

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a MySQL');
  } catch (error) {
    console.error('❌ Error al conectar:', error);
    process.exit(1);
  }
};