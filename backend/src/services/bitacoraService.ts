import { QueryTypes } from 'sequelize';
import sequelize from '../config/sequelize';

interface BitacoraData {
  tabla_afectada: string;    // nombre de la tabla (ej. 'proveedores')
  registro_id: number;       // id del registro afectado
  accion: 'crear' | 'editar' | 'aprobar' | 'rechazar' | 'anular' | 'login' | 'logout' | 'config' | 'inventario';
  descripcion: string;       // descripción legible de lo ocurrido
  empleado_dni: string;      // DNI del usuario que ejecutó la acción
  ip_address?: string;       // IP del cliente (opcional)
}

/**
 * Registra un evento en la bitácora del sistema
 */
export async function registrarBitacora(data: BitacoraData): Promise<void> {
  const query = `
    INSERT INTO bitacora 
      (tabla_afectada, registro_id, accion, descripcion, empleado_dni, ip_address)
    VALUES 
      (?, ?, ?, ?, ?, ?)
  `;
  await sequelize.query(query, {
    replacements: [
      data.tabla_afectada,
      data.registro_id,
      data.accion,
      data.descripcion,
      data.empleado_dni,
      data.ip_address || null,
    ],
    type: QueryTypes.INSERT,
  });
}