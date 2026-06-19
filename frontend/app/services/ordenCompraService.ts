import api from './api';

export interface OrdenCompraDetalle {
  id?: number;
  orden_id?: number;
  numero_linea: number;
  descripcion: string;
  unidad?: string;
  cantidad: number;
  precio_unitario: number;
  aplica_isv?: boolean;
  valor_total?: number;
}

export interface OrdenCompra {
  id: number;
  numero: string;
  origen_oc: 'desde_requisicion' | 'transcripcion';
  requisicion_id?: number | null;
  proveedor_id: number;
  departamento_id: number;
  empleado_dni: string;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  estado: 'emitida' | 'entregada' | 'cancelada';
  codigo_presupuestario?: string | null;
  expediente?: string | null;
  notas?: string | null;
  snap_jefe_compras?: string | null;
  snap_gerente?: string | null;
  snap_alcalde?: string | null;
  creado_por_dni: string;
  fecha_emision: string;
  fecha_entrega?: string | null;
  proveedor?: { id: number; nombre: string; rtn: string };
  OrdenCompraDetalles?: OrdenCompraDetalle[];
}

// Obtener todas las órdenes de compra
export const getOrdenesCompra = async (): Promise<OrdenCompra[]> => {
  const response = await api.get('/ordenes-compra');
  return response.data;
};

// Obtener una orden por ID
export const getOrdenCompraById = async (id: number): Promise<OrdenCompra> => {
  const response = await api.get(`/ordenes-compra/${id}`);
  return response.data;
};

// Generar orden de compra desde una requisición aprobada
export const generarOrdenCompra = async (data: {
  requisicion_id: number;
  notas?: string;
  codigo_presupuestario?: string;
  expediente?: string;
}): Promise<OrdenCompra> => {
  const response = await api.post('/ordenes-compra/desde-requisicion', data);
  return response.data;
};

// Marcar orden como entregada
export const marcarEntregada = async (id: number): Promise<OrdenCompra> => {
  const response = await api.put(`/ordenes-compra/${id}/entregar`);
  return response.data;
};

// Cancelar orden (solo si está emitida)
export const cancelarOrden = async (id: number): Promise<OrdenCompra> => {
  const response = await api.put(`/ordenes-compra/${id}/cancelar`);
  return response.data;
};