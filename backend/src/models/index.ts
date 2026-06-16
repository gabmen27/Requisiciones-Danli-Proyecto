import User from './User';
import Proveedor from './Proveedor';
import Solicitud from './Solicitud';
import SolicitudRespuesta from './SolicitudRespuesta';
import SolicitudRespuestaItem from './SolicitudRespuestaItem';
import Requisicion from './Requisicion';
import RequisicionDetalle from './RequisicionDetalle';
import OrdenCompra from './OrdenCompra';
import OrdenCompraDetalle from './OrdenCompraDetalle';
import Configuracion from './Configuracion';

// Aquí puedes definir asociaciones si las necesitas. Por ahora, solo exportamos.
Solicitud.hasOne(SolicitudRespuesta, { foreignKey: 'solicitud_id' });
SolicitudRespuesta.belongsTo(Solicitud, { foreignKey: 'solicitud_id' });

SolicitudRespuesta.hasMany(SolicitudRespuestaItem, { foreignKey: 'respuesta_id' });
SolicitudRespuestaItem.belongsTo(SolicitudRespuesta, { foreignKey: 'respuesta_id' });

Requisicion.hasMany(RequisicionDetalle, { foreignKey: 'requisicion_id', as: 'RequisicionDetalles' });
RequisicionDetalle.belongsTo(Requisicion, { foreignKey: 'requisicion_id' });

OrdenCompra.belongsTo(Proveedor, { foreignKey: 'proveedor_id' });
OrdenCompra.hasMany(OrdenCompraDetalle, { foreignKey: 'orden_id', as: 'OrdenCompraDetalles' });
OrdenCompraDetalle.belongsTo(OrdenCompra, { foreignKey: 'orden_id' });

export {
  User,
  Proveedor,
  Solicitud,
  SolicitudRespuesta,
  SolicitudRespuestaItem,
  Requisicion,
  RequisicionDetalle,
  OrdenCompra,
  OrdenCompraDetalle,
  Configuracion,
};

export default function initModels() {
  console.log('Modelos cargados correctamente');
}