import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

interface SolicitudRespuestaItemAttributes {
  id: number;
  respuesta_id: number;
  numero_linea: number;
  descripcion: string;
  unidad: string;
  precio_unitario: number;
  cantidad_disponible: number;
}

type SolicitudRespuestaItemCreationAttributes = Optional<SolicitudRespuestaItemAttributes, 'id'>;

class SolicitudRespuestaItem extends Model<SolicitudRespuestaItemAttributes, SolicitudRespuestaItemCreationAttributes> {
  public id!: number;
  public respuesta_id!: number;
  public numero_linea!: number;
  public descripcion!: string;
  public unidad!: string;
  public precio_unitario!: number;
  public cantidad_disponible!: number;
}

SolicitudRespuestaItem.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    respuesta_id: { type: DataTypes.INTEGER, allowNull: false },
    numero_linea: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    unidad: { type: DataTypes.STRING(30), defaultValue: 'Unidad' },
    precio_unitario: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
    cantidad_disponible: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  },
  {
    sequelize,
    tableName: 'solicitud_respuesta_items',
    timestamps: false,
    underscored: true,
  }
);

export default SolicitudRespuestaItem;