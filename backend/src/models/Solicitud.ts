import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

interface SolicitudAttributes {
  id: number;
  numero: string;
  tipo: 'cotizacion' | 'precios_bienes';
  departamento_id: number;
  empleado_dni: string;
  observaciones: string;
  estado: 'pendiente' | 'respondida' | 'cancelada';
  fecha_solicitud: Date;
  fecha_respuesta: Date | null;
}

type SolicitudCreationAttributes = Optional<SolicitudAttributes, 'id' | 'fecha_respuesta' | 'fecha_solicitud'>;

class Solicitud extends Model<SolicitudAttributes, SolicitudCreationAttributes> {
  public id!: number;
  public numero!: string;
  public tipo!: SolicitudAttributes['tipo'];
  public departamento_id!: number;
  public empleado_dni!: string;
  public observaciones!: string;
  public estado!: SolicitudAttributes['estado'];
  public fecha_solicitud!: Date;
  public fecha_respuesta!: Date | null;
}

Solicitud.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    numero: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    tipo: { type: DataTypes.ENUM('cotizacion', 'precios_bienes'), allowNull: false },
    departamento_id: { type: DataTypes.INTEGER, allowNull: false },
    empleado_dni: { type: DataTypes.STRING(15), allowNull: false },
    observaciones: { type: DataTypes.TEXT, allowNull: false },
    estado: { type: DataTypes.ENUM('pendiente', 'respondida', 'cancelada'), defaultValue: 'pendiente' },
    fecha_solicitud: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    fecha_respuesta: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: 'solicitudes',
    timestamps: false,
    underscored: true,
  }
);

export default Solicitud;