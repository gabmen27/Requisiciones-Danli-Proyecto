import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

// 1. Definimos la estructura que tendrá un usuario
interface UserAttributes {
  id: number;
  empleado_dni: string;
  username: string;
  password_hash: string;
  rol: 'admin' | 'solicitante' | 'compras' | 'bienes' | 'gerencia' | 'alcaldia';
  departamento_id: number | null;
  activo: boolean;
  ultimo_acceso: Date | null;
  created_at: Date;
}

// 2. Definimos qué atributos son opcionales al crear (id, ultimo_acceso, created_at)
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'ultimo_acceso' | 'created_at'> {}

// 3. Clase del modelo
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public empleado_dni!: string;
  public username!: string;
  public password_hash!: string;
  public rol!: UserAttributes['rol'];
  public departamento_id!: number | null;
  public activo!: boolean;
  public ultimo_acceso!: Date | null;
  public created_at!: Date;
}

// 4. Inicializamos el modelo con la estructura de la tabla
User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    empleado_dni: { type: DataTypes.STRING(15), allowNull: false, unique: true },
    username: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    rol: { type: DataTypes.ENUM('admin','solicitante','compras','bienes','gerencia','alcaldia'), allowNull: false },
    departamento_id: { type: DataTypes.INTEGER, allowNull: true },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
    ultimo_acceso: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,          // la conexión
    tableName: 'usuarios', // nombre exacto en la BD
    timestamps: false,     // porque ya tenemos created_at manual
    underscored: true,     // usa snake_case para columnas
  }
);

export default User;