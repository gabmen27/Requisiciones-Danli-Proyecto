import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

interface OrdenCompraDetalleAttributes {
  id: number;
  orden_id: number;
  numero_linea: number;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  aplica_isv: boolean;
  valor_total: number;
  articulo_kardex_id: number | null;
}

type OrdenCompraDetalleCreationAttributes = Optional<OrdenCompraDetalleAttributes, 'id' | 'valor_total'>;

class OrdenCompraDetalle extends Model<OrdenCompraDetalleAttributes, OrdenCompraDetalleCreationAttributes> {
  public id!: number;
  public orden_id!: number;
  public numero_linea!: number;
  public descripcion!: string;
  public unidad!: string;
  public cantidad!: number;
  public precio_unitario!: number;
  public aplica_isv!: boolean;
  public valor_total!: number;
  public articulo_kardex_id!: number | null;
}

OrdenCompraDetalle.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orden_id: { type: DataTypes.INTEGER, allowNull: false },
    numero_linea: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    unidad: { type: DataTypes.STRING(30), defaultValue: 'Unidad' },
    cantidad: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    precio_unitario: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
    aplica_isv: { type: DataTypes.BOOLEAN, defaultValue: true },
    valor_total: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
    articulo_kardex_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    sequelize,
    tableName: 'orden_compra_detalles',
    timestamps: false,
    underscored: true,
  }
);

export default OrdenCompraDetalle;