import api from './api';

// =============================================
// 1. Definición de tipos (interfaces)
// =============================================

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
  // Relación con los detalles (se incluye cuando se consulta por ID o con include)
  RequisicionDetalles?: RequisicionDetalle[];
}

// =============================================
// 2. Funciones para consumir la API
// =============================================

// Obtener todas las requisiciones
export const getRequisiciones = async (): Promise<Requisicion[]> => {
  const response = await api.get('/requisiciones');
  return response.data;
};

// Obtener una requisición por ID (incluye sus detalles)
export const getRequisicionById = async (id: number): Promise<Requisicion> => {
  const response = await api.get(`/requisiciones/${id}`);
  return response.data;
};

// Crear una nueva requisición (estado borrador)
export const createRequisicion = async (data: {
  tipo: string;
  departamento_id: number;
  dirigida_a: string;
  solicitud_id?: number | null;
  proveedor_id?: number | null;
  observaciones?: string;
  detalles: Omit<RequisicionDetalle, 'id' | 'requisicion_id' | 'valor_total'>[];
}): Promise<Requisicion> => {
  const response = await api.post('/requisiciones', data);
  return response.data;
};

// Enviar a aprobación (borrador → pendiente)
export const enviarAprobacion = async (id: number): Promise<Requisicion> => {
  const response = await api.put(`/requisiciones/${id}/enviar-aprobacion`);
  return response.data;
};

// Aprobar requisición (solo gerencia/alcaldía/admin)
export const aprobarRequisicion = async (id: number, aprobado_por: 'gerencia' | 'alcaldia'): Promise<Requisicion> => {
  const response = await api.put(`/requisiciones/${id}/aprobar`, { aprobado_por });
  return response.data;
};

// Rechazar requisición
export const rechazarRequisicion = async (id: number, motivo?: string): Promise<Requisicion> => {
  const response = await api.put(`/requisiciones/${id}/rechazar`, { motivo: motivo || '' });
  return response.data;
};