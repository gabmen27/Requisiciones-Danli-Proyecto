import api from './api';

export interface RequisicionDetalle {
  id?: number;
  requisicion_id?: number;
  numero_linea: number;
  descripcion: string;
  unidad?: string;
  cantidad: number;
  precio_unitario: number;
  aplica_isv?: boolean;
  valor_total?: number;
}

export interface Requisicion {
  id: number;
  numero: string;
  tipo: 'compras' | 'bienes';
  departamento_id: number;
  empleado_dni: string;
  dirigida_a: 'compras' | 'bienes';
  solicitud_id?: number | null;
  proveedor_id?: number | null;
  proveedor_nombre_snap?: string | null;
  rtn_proveedor_snap?: string | null;
  codigo_presupuestario?: string | null;
  expediente?: string | null;
  subtotal: number;
  total_isv: number;
  total: number;
  estado: 'borrador' | 'pendiente' | 'aprobada' | 'rechazada' | 'comprometida' | 'anulada';
  aprobado_por?: 'gerencia' | 'alcaldia' | null;
  aprobado_por_dni?: string | null;
  motivo_rechazo?: string | null;
  observaciones?: string | null;
  fecha_creacion: string;
  fecha_aprobacion?: string | null;
  RequisicionDetalles?: RequisicionDetalle[];
}

export const getRequisiciones = async (): Promise<Requisicion[]> => {
  const res = await api.get('/requisiciones');
  return res.data;
};

export const getRequisicionById = async (id: number): Promise<Requisicion> => {
  const res = await api.get('/requisiciones/' + id);
  return res.data;
};

export const createRequisicion = async (data: {
  tipo: string;
  departamento_id: number;
  dirigida_a: string;
  solicitud_id?: number | null;
  proveedor_id?: number | null;
  observaciones?: string;
  detalles: Omit<RequisicionDetalle, 'id' | 'requisicion_id' | 'valor_total'>[];
}): Promise<Requisicion> => {
  const res = await api.post('/requisiciones', data);
  return res.data;
};

export const enviarAprobacion = async (id: number): Promise<Requisicion> => {
  const res = await api.put('/requisiciones/' + id + '/enviar-aprobacion');
  return res.data;
};

export const aprobarRequisicion = async (id: number, aprobado_por: 'gerencia' | 'alcaldia'): Promise<Requisicion> => {
  const res = await api.put('/requisiciones/' + id + '/aprobar', { aprobado_por });
  return res.data;
};

export const rechazarRequisicion = async (id: number, motivo?: string): Promise<Requisicion> => {
  const res = await api.put('/requisiciones/' + id + '/rechazar', { motivo: motivo || '' });
  return res.data;
};

export const comprometerRequisicion = async (id: number): Promise<Requisicion> => {
  const res = await api.put('/requisiciones/' + id + '/comprometer');
  return res.data;
};