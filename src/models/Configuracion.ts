import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/sequelize';

interface ConfiguracionAttributes {
  id: number;
  municipalidad_nombre: string;
  municipalidad_dir: string;
  municipalidad_tel: string;
  alcalde_nombre: string;
  alcalde_cargo: string;
  gerente_nombre: string;
  gerente_cargo: string;
  jefe_compras_nombre: string;
  jefe_compras_cargo: string;
  jefe_bienes_nombre: string;
  jefe_bienes_cargo: string;
  logo_path: string | null;
  escudo_path: string | null;
  pie_documento: string | null;
  req_prefijo: string;
  req_siguiente: number;
  oc_prefijo: string;
  oc_siguiente: number;
  sol_prefijo: string;
  sol_siguiente: number;
  inv_prefijo: string;
  inv_siguiente: number;
  traslado_prefijo: string;
  traslado_siguiente: number;
  tasa_impuesto: number;
  moneda_simbolo: string;
  req_filas_base: number;
  oc_filas_base: number;
  dias_alerta_stock: number;
  sistema_version: string;
  updated_at: Date;
}

type ConfiguracionCreationAttributes = Optional<ConfiguracionAttributes, 'id' | 'logo_path' | 'escudo_path' | 'pie_documento'>;

class Configuracion extends Model<ConfiguracionAttributes, ConfiguracionCreationAttributes> {
  public id!: number;
  public municipalidad_nombre!: string;
  public municipalidad_dir!: string;
  public municipalidad_tel!: string;
  public alcalde_nombre!: string;
  public alcalde_cargo!: string;
  public gerente_nombre!: string;
  public gerente_cargo!: string;
  public jefe_compras_nombre!: string;
  public jefe_compras_cargo!: string;
  public jefe_bienes_nombre!: string;
  public jefe_bienes_cargo!: string;
  public logo_path!: string | null;
  public escudo_path!: string | null;
  public pie_documento!: string | null;
  public req_prefijo!: string;
  public req_siguiente!: number;
  public oc_prefijo!: string;
  public oc_siguiente!: number;
  public sol_prefijo!: string;
  public sol_siguiente!: number;
  public inv_prefijo!: string;
  public inv_siguiente!: number;
  public traslado_prefijo!: string;
  public traslado_siguiente!: number;
  public tasa_impuesto!: number;
  public moneda_simbolo!: string;
  public req_filas_base!: number;
  public oc_filas_base!: number;
  public dias_alerta_stock!: number;
  public sistema_version!: string;
  public updated_at!: Date;
}

Configuracion.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    municipalidad_nombre: { type: DataTypes.STRING(150), defaultValue: 'Municipalidad de Danlí' },
    municipalidad_dir: { type: DataTypes.STRING(255), defaultValue: 'Danlí, Departamento de El Paraíso, Honduras, C.A.' },
    municipalidad_tel: { type: DataTypes.STRING(80), defaultValue: '2763-2080 / 2763-2405  Telefax: 2763-2638' },
    alcalde_nombre: { type: DataTypes.STRING(120), defaultValue: 'Abraham Kafati Díaz' },
    alcalde_cargo: { type: DataTypes.STRING(100), defaultValue: 'Alcalde Municipal' },
    gerente_nombre: { type: DataTypes.STRING(120), defaultValue: 'Maria Fernanda Sauceda' },
    gerente_cargo: { type: DataTypes.STRING(100), defaultValue: 'Gerente Administrativo Financiero' },
    jefe_compras_nombre: { type: DataTypes.STRING(120), defaultValue: 'Jorge Ayestas' },
    jefe_compras_cargo: { type: DataTypes.STRING(100), defaultValue: 'Jefe de Compras y Suministros' },
    jefe_bienes_nombre: { type: DataTypes.STRING(120), defaultValue: '' },
    jefe_bienes_cargo: { type: DataTypes.STRING(100), defaultValue: 'Jefe de Bienes y Proveeduría' },
    logo_path: { type: DataTypes.STRING(300), allowNull: true },
    escudo_path: { type: DataTypes.STRING(300), allowNull: true },
    pie_documento: { type: DataTypes.TEXT, allowNull: true },
    req_prefijo: { type: DataTypes.STRING(10), defaultValue: 'R' },
    req_siguiente: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 91310 },
    oc_prefijo: { type: DataTypes.STRING(10), defaultValue: 'OC' },
    oc_siguiente: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 80003 },
    sol_prefijo: { type: DataTypes.STRING(10), defaultValue: 'SOL' },
    sol_siguiente: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 10 },
    inv_prefijo: { type: DataTypes.STRING(10), defaultValue: 'INV' },
    inv_siguiente: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 11 },
    traslado_prefijo: { type: DataTypes.STRING(10), defaultValue: 'NT' },
    traslado_siguiente: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 1 },
    tasa_impuesto: { type: DataTypes.DECIMAL(5, 2), defaultValue: 15.0 },
    moneda_simbolo: { type: DataTypes.STRING(5), defaultValue: 'L.' },
    req_filas_base: { type: DataTypes.TINYINT, defaultValue: 12 },
    oc_filas_base: { type: DataTypes.TINYINT, defaultValue: 12 },
    dias_alerta_stock: { type: DataTypes.TINYINT, defaultValue: 30 },
    sistema_version: { type: DataTypes.STRING(10), defaultValue: '1.2' },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'configuracion',
    timestamps: false,
    underscored: true,
  }
);

export default Configuracion;