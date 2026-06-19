import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Requisicion from '../models/Requisicion';
import RequisicionDetalle from '../models/RequisicionDetalle';
import Proveedor from '../models/Proveedor';
import Configuracion from '../models/Configuracion';
import { getNextNumber } from '../services/sequenceService';
import { registrarBitacora } from '../services/bitacoraService';
import sequelize from '../config/sequelize';

export const createRequisicion = async (req: AuthRequest, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
    const { tipo, departamento_id, dirigida_a, solicitud_id, proveedor_id, observaciones, detalles } = req.body;

    if (!tipo || !departamento_id || !dirigida_a) {
      return res.status(400).json({ message: 'Faltan datos obligatorios' });
    }

    if (proveedor_id) {
      const proveedor = await Proveedor.findByPk(proveedor_id);
      if (!proveedor || !proveedor.activo) {
        return res.status(400).json({ message: 'Proveedor no encontrado o inactivo' });
      }
    }

    const numero = await getNextNumber('req');
    const requisicion = await Requisicion.create({
      numero, tipo, departamento_id,
      empleado_dni: req.user!.empleado_dni,
      dirigida_a,
      solicitud_id: solicitud_id || null,
      proveedor_id: proveedor_id || null,
      observaciones: observaciones || null,
      estado: 'borrador',
    }, { transaction });

    let subtotal = 0;
    let totalIsv = 0;

    if (detalles && detalles.length > 0) {
      const config = await Configuracion.findByPk(1);
      const tasa = config ? Number(config.tasa_impuesto) / 100 : 0.15;

      const detallesData = detalles.map((det: {
        descripcion: string; unidad?: string;
        cantidad: number; precio_unitario: number; aplica_isv?: boolean; numero_linea?: number;
      }, idx: number) => {
        const cantidad = Number(det.cantidad);
        const precio   = Number(det.precio_unitario || 0);
        const aplica   = det.aplica_isv !== undefined ? det.aplica_isv : true;
        const valor    = cantidad * precio;
        subtotal += valor;
        if (aplica) totalIsv += valor * tasa;
        return {
          requisicion_id: requisicion.id,
          numero_linea:   det.numero_linea ?? idx + 1,
          descripcion:    det.descripcion,
          unidad:         det.unidad || 'Unidad',
          cantidad, precio_unitario: precio,
          aplica_isv:     aplica,
          valor_total:    valor,
        };
      });

      await RequisicionDetalle.bulkCreate(detallesData, { transaction });
    }

    await requisicion.update({ subtotal, total_isv: totalIsv, total: subtotal + totalIsv }, { transaction });
    await transaction.commit();

    await registrarBitacora({
      tabla_afectada: 'requisiciones', registro_id: requisicion.id,
      accion: 'crear',
      descripcion: `Requisicion ${numero} creada en borrador`,
      empleado_dni: req.user!.empleado_dni, ip_address: req.ip,
    });

    res.status(201).json(requisicion);
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: 'Error al crear requisicion', error });
  }
};

export const getRequisiciones = async (req: AuthRequest, res: Response) => {
  try {
    const requisiciones = await Requisicion.findAll({
      include: [{ model: RequisicionDetalle, as: 'RequisicionDetalles', required: false }],
      order: [['fecha_creacion', 'DESC']],
    });
    res.json(requisiciones);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener requisiciones', error });
  }
};

export const getRequisicionById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const requisicion = await Requisicion.findByPk(parseInt(id as string), {
      include: [{ model: RequisicionDetalle, as: 'RequisicionDetalles' }],
    });
    if (!requisicion) return res.status(404).json({ message: 'Requisicion no encontrada' });
    res.json(requisicion);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener requisicion', error });
  }
};

export const enviarAprobacion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const requisicion = await Requisicion.findByPk(parseInt(id as string));
    if (!requisicion) return res.status(404).json({ message: 'Requisicion no encontrada' });
    if (requisicion.estado !== 'borrador') {
      return res.status(400).json({ message: 'Solo se puede enviar a aprobacion una requisicion en borrador' });
    }
    await requisicion.update({ estado: 'pendiente' });
    await registrarBitacora({
      tabla_afectada: 'requisiciones', registro_id: requisicion.id,
      accion: 'editar',
      descripcion: `Requisicion ${requisicion.numero} enviada a aprobacion`,
      empleado_dni: req.user!.empleado_dni, ip_address: req.ip,
    });
    res.json({ message: 'Requisicion enviada a aprobacion', requisicion });
  } catch (error) {
    res.status(500).json({ message: 'Error al enviar a aprobacion', error });
  }
};

export const aprobarRequisicion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { aprobado_por } = req.body;
    const requisicion = await Requisicion.findByPk(parseInt(id as string));
    if (!requisicion) return res.status(404).json({ message: 'Requisicion no encontrada' });
    if (requisicion.estado !== 'pendiente') {
      return res.status(400).json({ message: 'Solo se pueden aprobar requisiciones pendientes' });
    }
    await requisicion.update({
      estado: 'aprobada',
      aprobado_por,
      aprobado_por_dni: req.user!.empleado_dni,
      fecha_aprobacion: new Date(),
    });
    await registrarBitacora({
      tabla_afectada: 'requisiciones', registro_id: requisicion.id,
      accion: 'aprobar',
      descripcion: `Requisicion ${requisicion.numero} aprobada por ${aprobado_por}`,
      empleado_dni: req.user!.empleado_dni, ip_address: req.ip,
    });
    res.json({ message: 'Requisicion aprobada', requisicion });
  } catch (error) {
    res.status(500).json({ message: 'Error al aprobar requisicion', error });
  }
};

export const rechazarRequisicion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const requisicion = await Requisicion.findByPk(parseInt(id as string));
    if (!requisicion) return res.status(404).json({ message: 'Requisicion no encontrada' });
    if (requisicion.estado !== 'pendiente') {
      return res.status(400).json({ message: 'Solo se pueden rechazar requisiciones pendientes' });
    }
    await requisicion.update({
      estado: 'rechazada',
      motivo_rechazo: motivo || 'Sin motivo especificado',
    });
    await registrarBitacora({
      tabla_afectada: 'requisiciones', registro_id: requisicion.id,
      accion: 'rechazar',
      descripcion: `Requisicion ${requisicion.numero} rechazada`,
      empleado_dni: req.user!.empleado_dni, ip_address: req.ip,
    });
    res.json({ message: 'Requisicion rechazada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al rechazar requisicion', error });
  }
};

// Solo requisiciones dirigidas a compras pueden ser comprometidas
export const comprometerRequisicion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const requisicion = await Requisicion.findByPk(parseInt(id as string));
    if (!requisicion) return res.status(404).json({ message: 'Requisicion no encontrada' });
    if (requisicion.estado !== 'aprobada') {
      return res.status(400).json({ message: 'Solo se pueden comprometer requisiciones aprobadas' });
    }
    if (requisicion.dirigida_a !== 'compras') {
      return res.status(400).json({ message: 'Solo las requisiciones dirigidas a Compras requieren compromiso presupuestario' });
    }
    await requisicion.update({ estado: 'comprometida' });
    await registrarBitacora({
      tabla_afectada: 'requisiciones', registro_id: requisicion.id,
      accion: 'editar',
      descripcion: `Requisicion ${requisicion.numero} comprometida presupuestariamente`,
      empleado_dni: req.user!.empleado_dni, ip_address: req.ip,
    });
    res.json({ message: 'Requisicion comprometida', requisicion });
  } catch (error) {
    res.status(500).json({ message: 'Error al comprometer requisicion', error });
  }
};