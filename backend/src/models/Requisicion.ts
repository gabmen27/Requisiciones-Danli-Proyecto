import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

interface RequisicionAttributes {
  id: number;
  numero: string;
  tipo: 'compras' | 'bienes';
  departamento_id: number;
  empleado_dni: string;
  dirigida_a: 'compras' | 'bienes';
  solicitud_id: number | null;
  proveedor_id: number | null;
  proveedor_nombre_snap: string | null;
  rtn_proveedor_snap: string | null;
  codigo_presupuestario: string | null;
  expediente: string | null;
  subtotal: number;
  total_isv: number;
  total: number;
  estado: 'borrador' | 'pendiente' | 'aprobada' | 'rechazada' | 'comprometida' | 'anulada';
  aprobado_por: 'gerencia' | 'alcaldia' | null;
  aprobado_por_dni: string | null;
  motivo_rechazo: string | null;
  observaciones: string | null;
  fecha_creacion: Date;
  fecha_aprobacion: Date | null;
}

type RequisicionCreationAttributes = Optional<RequisicionAttributes,
  | 'id'
  | 'solicitud_id'
  | 'proveedor_id'
  | 'proveedor_nombre_snap'
  | 'rtn_proveedor_snap'
  | 'codigo_presupuestario'
  | 'expediente'
  | 'subtotal'
  | 'total_isv'
  | 'total'
  | 'aprobado_por'
  | 'aprobado_por_dni'
  | 'motivo_rechazo'
  | 'observaciones'
  | 'fecha_aprobacion'
>;

class Requisicion extends Model<RequisicionAttributes, RequisicionCreationAttributes> {
  public id!: number;
  public numero!: string;
  public tipo!: RequisicionAttributes['tipo'];
  public departamento_id!: number;
  public empleado_dni!: string;
  public dirigida_a!: RequisicionAttributes['dirigida_a'];
  public solicitud_id!: number | null;
  public proveedor_id!: number | null;
  public proveedor_nombre_snap!: string | null;
  public rtn_proveedor_snap!: string | null;
  public codigo_presupuestario!: string | null;
  public expediente!: string | null;
  public subtotal!: number;
  public total_isv!: number;
  public total!: number;
  public estado!: RequisicionAttributes['estado'];
  public aprobado_por!: 'gerencia' | 'alcaldia' | null;
  public aprobado_por_dni!: string | null;
  public motivo_rechazo!: string | null;
  public observaciones!: string | null;
  public fecha_creacion!: Date;
  public fecha_aprobacion!: Date | null;
}

Requisicion.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    numero: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    tipo: { type: DataTypes.ENUM('compras', 'bienes'), allowNull: false },
    departamento_id: { type: DataTypes.INTEGER, allowNull: false },
    empleado_dni: { type: DataTypes.STRING(15), allowNull: false },
    dirigida_a: { type: DataTypes.ENUM('compras', 'bienes'), allowNull: false },
    solicitud_id: { type: DataTypes.INTEGER, allowNull: true },
    proveedor_id: { type: DataTypes.INTEGER, allowNull: true },
    proveedor_nombre_snap: { type: DataTypes.STRING(150), allowNull: true },
    rtn_proveedor_snap: { type: DataTypes.STRING(20), allowNull: true },
    codigo_presupuestario: { type: DataTypes.STRING(80), allowNull: true },
    expediente: { type: DataTypes.STRING(40), allowNull: true },
    subtotal: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
    total_isv: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
    estado: { type: DataTypes.ENUM('borrador','pendiente','aprobada','rechazada','comprometida','anulada'), defaultValue: 'borrador' },
    aprobado_por: { type: DataTypes.ENUM('gerencia', 'alcaldia'), allowNull: true },
    aprobado_por_dni: { type: DataTypes.STRING(15), allowNull: true },
    motivo_rechazo: { type: DataTypes.TEXT, allowNull: true },
    observaciones: { type: DataTypes.TEXT, allowNull: true },
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    fecha_aprobacion: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: 'requisiciones',
    timestamps: false,
    underscored: true,
  }
);

export default Requisicion;