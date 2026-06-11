import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

interface SolicitudRespuestaAttributes {
  id: number;
  solicitud_id: number;
  tipo_respuesta: 'pdf_cotizacion' | 'listado_precios';
  archivo_pdf: string | null;
  respondido_por_dni: string;
  observaciones: string | null;
  fecha_respuesta: Date;
}

type SolicitudRespuestaCreationAttributes = Optional<SolicitudRespuestaAttributes, 'id' | 'archivo_pdf' | 'observaciones'>;

class SolicitudRespuesta extends Model<SolicitudRespuestaAttributes, SolicitudRespuestaCreationAttributes> {
  public id!: number;
  public solicitud_id!: number;
  public tipo_respuesta!: SolicitudRespuestaAttributes['tipo_respuesta'];
  public archivo_pdf!: string | null;
  public respondido_por_dni!: string;
  public observaciones!: string | null;
  public fecha_respuesta!: Date;
}

SolicitudRespuesta.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    solicitud_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    tipo_respuesta: { type: DataTypes.ENUM('pdf_cotizacion', 'listado_precios'), allowNull: false },
    archivo_pdf: { type: DataTypes.STRING(300), allowNull: true },
    respondido_por_dni: { type: DataTypes.STRING(15), allowNull: false },
    observaciones: { type: DataTypes.TEXT, allowNull: true },
    fecha_respuesta: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'solicitud_respuestas',
    timestamps: false,
    underscored: true,
  }
);

export default SolicitudRespuesta;