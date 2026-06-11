import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

interface OrdenCompraAttributes {
  id: number;
  numero: string;
  origen_oc: 'desde_requisicion' | 'transcripcion';
  requisicion_id: number | null;
  proveedor_id: number;
  departamento_id: number;
  empleado_dni: string;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  estado: 'emitida' | 'entregada' | 'cancelada';
  codigo_presupuestario: string | null;
  expediente: string | null;
  notas: string | null;
  snap_jefe_compras: string | null;
  snap_gerente: string | null;
  snap_alcalde: string | null;
  creado_por_dni: string;
  fecha_emision: Date;
  fecha_entrega: Date | null;
}

type OrdenCompraCreationAttributes = Optional<OrdenCompraAttributes,
  'id' | 'requisicion_id' | 'notas' | 'snap_jefe_compras' | 'snap_gerente' | 'snap_alcalde' | 'fecha_entrega'
>;

class OrdenCompra extends Model<OrdenCompraAttributes, OrdenCompraCreationAttributes> {
  public id!: number;
  public numero!: string;
  public origen_oc!: OrdenCompraAttributes['origen_oc'];
  public requisicion_id!: number | null;
  public proveedor_id!: number;
  public departamento_id!: number;
  public empleado_dni!: string;
  public subtotal!: number;
  public descuento!: number;
  public impuesto!: number;
  public total!: number;
  public estado!: OrdenCompraAttributes['estado'];
  public codigo_presupuestario!: string | null;
  public expediente!: string | null;
  public notas!: string | null;
  public snap_jefe_compras!: string | null;
  public snap_gerente!: string | null;
  public snap_alcalde!: string | null;
  public creado_por_dni!: string;
  public fecha_emision!: Date;
  public fecha_entrega!: Date | null;
}

OrdenCompra.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    numero: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    origen_oc: { type: DataTypes.ENUM('desde_requisicion', 'transcripcion'), defaultValue: 'desde_requisicion' },
    requisicion_id: { type: DataTypes.INTEGER, allowNull: true },
    proveedor_id: { type: DataTypes.INTEGER, allowNull: false },
    departamento_id: { type: DataTypes.INTEGER, allowNull: false },
    empleado_dni: { type: DataTypes.STRING(15), allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
    descuento: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
    impuesto: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
    estado: { type: DataTypes.ENUM('emitida', 'entregada', 'cancelada'), defaultValue: 'emitida' },
    codigo_presupuestario: { type: DataTypes.STRING(80), allowNull: true },
    expediente: { type: DataTypes.STRING(40), allowNull: true },
    notas: { type: DataTypes.TEXT, allowNull: true },
    snap_jefe_compras: { type: DataTypes.STRING(120), allowNull: true },
    snap_gerente: { type: DataTypes.STRING(120), allowNull: true },
    snap_alcalde: { type: DataTypes.STRING(120), allowNull: true },
    creado_por_dni: { type: DataTypes.STRING(15), allowNull: false },
    fecha_emision: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    fecha_entrega: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: 'ordenes_compra',
    timestamps: false,
    underscored: true,
  }
);

export default OrdenCompra;