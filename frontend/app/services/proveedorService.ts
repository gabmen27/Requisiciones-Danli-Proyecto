import api from './api';

// Interfaz básica de proveedor (coincide con lo que devuelve el backend)
export interface Proveedor {
  id: number;
  nombre: string;
  rtn: string;
  direccion?: string;
  correo?: string;
  telefono?: string;
  activo: boolean;
}

// Obtener todos los proveedores activos
export const getProveedores = async (): Promise<Proveedor[]> => {
  const response = await api.get('/proveedores');
  return response.data;
};

// Obtener un proveedor por ID
export const getProveedorById = async (id: number): Promise<Proveedor> => {
  const response = await api.get(`/proveedores/${id}`);
  return response.data;
};

// Crear un proveedor (si lo necesitas)
export const createProveedor = async (data: Omit<Proveedor, 'id' | 'activo'>): Promise<Proveedor> => {
  const response = await api.post('/proveedores', data);
  return response.data;
};