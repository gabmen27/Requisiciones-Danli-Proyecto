import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { QueryTypes } from 'sequelize';
import sequelize from '../config/sequelize';

// Stats del dashboard (requiere auth)
export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const [resProveedores] = await sequelize.query(
      'SELECT COUNT(*) as total FROM proveedores WHERE activo = true',
      { type: QueryTypes.SELECT }
    ) as { total: string }[];

    const [resSolicitudes] = await sequelize.query(
      'SELECT COUNT(*) as total FROM solicitudes',
      { type: QueryTypes.SELECT }
    ) as { total: string }[];

    const [resRequisiciones] = await sequelize.query(
      'SELECT COUNT(*) as total FROM requisiciones',
      { type: QueryTypes.SELECT }
    ) as { total: string }[];

    const [resOrdenes] = await sequelize.query(
      'SELECT COUNT(*) as total FROM ordenes_compra',
      { type: QueryTypes.SELECT }
    ) as { total: string }[];

    const requisicionesPorEstado = await sequelize.query(
      'SELECT estado, COUNT(*) as total FROM requisiciones GROUP BY estado ORDER BY total DESC',
      { type: QueryTypes.SELECT }
    ) as { estado: string; total: string }[];

    const ordenesPorMes = await sequelize.query(`
      SELECT 
        DATE_FORMAT(fecha_emision, '%b %Y') as mes,
        COUNT(*) as total
      FROM ordenes_compra
      WHERE fecha_emision >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(fecha_emision, '%Y-%m'), DATE_FORMAT(fecha_emision, '%b %Y')
      ORDER BY MIN(fecha_emision) ASC
    `, { type: QueryTypes.SELECT }
    ) as { mes: string; total: string }[];

    const solicitudesPorTipo = await sequelize.query(
      'SELECT tipo, COUNT(*) as total FROM solicitudes GROUP BY tipo ORDER BY total DESC',
      { type: QueryTypes.SELECT }
    ) as { tipo: string; total: string }[];

    res.json({
      proveedores:   Number(resProveedores.total),
      solicitudes:   Number(resSolicitudes.total),
      requisiciones: Number(resRequisiciones.total),
      ordenes:       Number(resOrdenes.total),
      requisicionesPorEstado: requisicionesPorEstado.map(r => ({ estado: r.estado, total: Number(r.total) })),
      ordenesPorMes:          ordenesPorMes.map(o => ({ mes: o.mes, total: Number(o.total) })),
      solicitudesPorTipo:     solicitudesPorTipo.map(s => ({ tipo: s.tipo, total: Number(s.total) })),
    });
  } catch (error) {
    console.error('Error en dashboard stats:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas', error });
  }
};

// Configuración pública — sin auth, para el login
export const getConfiguracionPublica = async (req: Request, res: Response) => {
  try {
    const [config] = await sequelize.query(
      'SELECT municipalidad_nombre, escudo_path, logo_path FROM configuracion WHERE id = 1',
      { type: QueryTypes.SELECT }
    ) as { municipalidad_nombre: string; escudo_path: string | null; logo_path: string | null }[];
    res.json(config || {});
  } catch (error) {
    res.status(500).json({ message: 'Error', error });
  }
};