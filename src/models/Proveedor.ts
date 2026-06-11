import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

interface ProveedorAttributes {
  id: number;
  nombre: string;
  rtn: string;
  direccion: string | null;
  correo: string | null;
  telefono: string | null;
  activo: boolean;
  created_at: Date;
}

type ProveedorCreationAttributes = Optional<ProveedorAttributes, 'id' | 'activo' | 'created_at'> & {
  direccion?: string | null;
  correo?: string | null;
  telefono?: string | null;
};

class Proveedor extends Model<ProveedorAttributes, ProveedorCreationAttributes> {
  public id!: number;
  public nombre!: string;
  public rtn!: string;
  public direccion!: string | null;
  public correo!: string | null;
  public telefono!: string | null;
  public activo!: boolean;
  public created_at!: Date;
}

Proveedor.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING(150), allowNull: false },
    rtn: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    direccion: { type: DataTypes.STRING(255), allowNull: true },
    correo: { type: DataTypes.STRING(100), allowNull: true },
    telefono: { type: DataTypes.STRING(50), allowNull: true },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'proveedores',
    timestamps: false,
    underscored: true,
  }
);

export default Proveedor;