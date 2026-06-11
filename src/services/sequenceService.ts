import Configuracion from '../models/Configuracion';

/**
 * Obtiene el siguiente número para un tipo de documento
 * @param tipo 'req' | 'oc' | 'sol'
 * @returns número formateado (ej. 'R-91310', 'OC-080003', 'SOL-2026-010')
 */
export async function getNextNumber(tipo: 'req' | 'oc' | 'sol'): Promise<string> {
  // Buscamos la configuración (solo debe haber un registro con id=1)
  const config = await Configuracion.findByPk(1);
  if (!config) throw new Error('Configuración no encontrada');

  let prefijo: string;
  let siguiente: number;
  let año: string = '';

  switch (tipo) {
    case 'req':
      prefijo = config.req_prefijo;
      siguiente = config.req_siguiente;
      // Incrementamos el contador para la próxima vez
      config.req_siguiente = siguiente + 1;
      await config.save();
      // Formato: R-91310 (5 dígitos)
      return `${prefijo}-${siguiente.toString().padStart(5, '0')}`;

    case 'oc':
      prefijo = config.oc_prefijo;
      siguiente = config.oc_siguiente;
      config.oc_siguiente = siguiente + 1;
      await config.save();
      // Formato: OC-080003 (6 dígitos)
      return `${prefijo}-${siguiente.toString().padStart(6, '0')}`;

    case 'sol':
      prefijo = config.sol_prefijo;
      siguiente = config.sol_siguiente;
      año = new Date().getFullYear().toString();
      config.sol_siguiente = siguiente + 1;
      await config.save();
      // Formato: SOL-2026-010 (3 dígitos)
      return `${prefijo}-${año}-${siguiente.toString().padStart(3, '0')}`;

    default:
      throw new Error('Tipo de secuencia inválido');
  }
}