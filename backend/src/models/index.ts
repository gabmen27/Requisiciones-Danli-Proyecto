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