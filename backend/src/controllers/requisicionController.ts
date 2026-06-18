import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Requisicion from '../models/Requisicion';
import RequisicionDetalle from '../models/RequisicionDetalle';
import Proveedor from '../models/Proveedor';
import Configuracion from '../models/Configuracion';
import { getNextNumber } from '../services/sequenceService';
import { registrarBitacora } from '../services/bitacoraService';
import sequelize from '../config/sequelize';

// Crear requisición (borrador) con validación de proveedor y cálculo de totales
export const createRequisicion = async (req: AuthRequest, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      tipo,
      departamento_id,
      dirigida_a,
      solicitud_id,
      proveedor_id,
      observaciones,
      detalles,
    } = req.body;

    // Validaciones básicas
    if (!tipo || !departamento_id || !dirigida_a) {
      return res.status(400).json({ message: 'Faltan datos obligatorios (tipo, departamento_id, dirigida_a)' });
    }

    // Validar proveedor si se envía
    if (proveedor_id) {
      const proveedor = await Proveedor.findByPk(proveedor_id);
      if (!proveedor || !proveedor.activo) {
        return res.status(400).json({ message: 'Proveedor no encontrado o inactivo' });
      }
    }

    // Generar número de requisición
    const numero = await getNextNumber('req');

    // Crear cabecera
    const requisicion = await Requisicion.create(
      {
        numero,
        tipo,
        departamento_id,
        empleado_dni: req.user!.empleado_dni,
        dirigida_a,
        solicitud_id: solicitud_id || null,
        proveedor_id: proveedor_id || null,
        observaciones: observaciones || null,
        estado: 'borrador',
      },
      { transaction }
    );

    // Crear detalles y calcular totales
    let detallesConReq: any[] = [];
    let subtotal = 0;
    let totalIsv = 0;

    if (detalles && detalles.length > 0) {
      detallesConReq = detalles.map((det: any, idx: number) => {
        const cantidad = Number(det.cantidad);
        const precio = Number(det.precio_unitario || 0);
        const aplicaIsv = det.aplica_isv !== undefined ? det.aplica_isv : true;
        const valor = cantidad * precio;

        // Acumular totales para la cabecera
        subtotal += valor;
        if (aplicaIsv) {
          totalIsv += valor; // Se aplicará la tasa después
        }

        return {
          requisicion_id: requisicion.id,
          numero_linea: idx + 1,
          descripcion: det.descripcion,
          unidad: det.unidad || 'Unidad',
          cantidad,
          precio_unitario: precio,
          aplica_isv: aplicaIsv,
          valor_total: valor, // Valor sin ISV todavía, pero se guarda como base
        };
      });

      await RequisicionDetalle.bulkCreate(detallesConReq, { transaction });
    }

    // Obtener tasa de impuesto desde configuración
    const config = await Configuracion.findByPk(1);
    const tasaImpuesto = config ? Number(config.tasa_impuesto) : 15;

    // Calcular ISV y total final (considerando que los detalles con ISV suman en totalIsv)
    const impuesto = totalIsv * (tasaImpuesto / 100);
    const total = subtotal + impuesto;

    // Actualizar la requisición con los totales calculados
    await requisicion.update(
      {
        subtotal,
        total_isv: impuesto,
        total,
      },
      { transaction }
    );

    await transaction.commit();

    await registrarBitacora({
      tabla_afectada: 'requisiciones',
      registro_id: requisicion.id,
      accion: 'crear',
      descripcion: `Requisición ${numero} creada en estado borrador`,
      empleado_dni: req.user!.empleado_dni,
      ip_address: req.ip,
    });

    res.status(201).json(requisicion);
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: 'Error al crear requisición', error });
  }
};

// Listar todas las requisiciones (con detalles)
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

// Obtener una requisición por ID (con detalles)
export const getRequisicionById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const requisicion = await Requisicion.findByPk(parseInt(id), {
      include: [{ model: RequisicionDetalle, as: 'RequisicionDetalles' }],
    });
    if (!requisicion) {
      return res.status(404).json({ message: 'Requisición no encontrada' });
    }
    res.json(requisicion);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener requisición', error });
  }
};

// Enviar a aprobación (borrador → pendiente)
export const enviarAprobacion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const requisicion = await Requisicion.findByPk(parseInt(id));
    if (!requisicion) {
      return res.status(404).json({ message: 'Requisición no encontrada' });
    }
    if (requisicion.estado !== 'borrador') {
      return res.status(400).json({ message: 'Solo se puede enviar a aprobación una requisición en estado borrador' });
    }
    await requisicion.update({ estado: 'pendiente' });
    await registrarBitacora({
      tabla_afectada: 'requisiciones',
      registro_id: requisicion.id,
      accion: 'editar',
      descripcion: `Requisición ${requisicion.numero} enviada a aprobación`,
      empleado_dni: req.user!.empleado_dni,
      ip_address: req.ip,
    });
    res.json({ message: 'Requisición enviada a aprobación', requisicion });
  } catch (error) {
    res.status(500).json({ message: 'Error al enviar a aprobación', error });
  }
};

// Aprobar requisición (solo gerencia, alcaldía o admin)
export const aprobarRequisicion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { aprobado_por } = req.body; // 'gerencia' o 'alcaldia'
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const requisicion = await Requisicion.findByPk(parseInt(id));
    if (!requisicion) {
      return res.status(404).json({ message: 'Requisición no encontrada' });
    }
    if (requisicion.estado !== 'pendiente') {
      return res.status(400).json({ message: 'Solo se pueden aprobar requisiciones en estado pendiente' });
    }
    await requisicion.update({
      estado: 'aprobada',
      aprobado_por,
      aprobado_por_dni: req.user!.empleado_dni,
      fecha_aprobacion: new Date(),
    });
    await registrarBitacora({
      tabla_afectada: 'requisiciones',
      registro_id: requisicion.id,
      accion: 'aprobar',
      descripcion: `Requisición ${requisicion.numero} aprobada por ${aprobado_por}`,
      empleado_dni: req.user!.empleado_dni,
      ip_address: req.ip,
    });
    res.json({ message: 'Requisición aprobada', requisicion });
  } catch (error) {
    res.status(500).json({ message: 'Error al aprobar requisición', error });
  }
};

// Rechazar requisición
export const rechazarRequisicion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const requisicion = await Requisicion.findByPk(parseInt(id));
    if (!requisicion) {
      return res.status(404).json({ message: 'Requisición no encontrada' });
    }
    if (requisicion.estado !== 'pendiente') {
      return res.status(400).json({ message: 'Solo se pueden rechazar requisiciones en estado pendiente' });
    }
    await requisicion.update({
      estado: 'rechazada',
      motivo_rechazo: motivo || 'Sin motivo especificado',
    });
    await registrarBitacora({
      tabla_afectada: 'requisiciones',
      registro_id: requisicion.id,
      accion: 'rechazar',
      descripcion: `Requisición ${requisicion.numero} rechazada`,
      empleado_dni: req.user!.empleado_dni,
      ip_address: req.ip,
    });
    res.json({ message: 'Requisición rechazada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al rechazar requisición', error });
  }
};