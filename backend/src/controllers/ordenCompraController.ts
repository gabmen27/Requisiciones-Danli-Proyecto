import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import OrdenCompra from '../models/OrdenCompra';
import OrdenCompraDetalle from '../models/OrdenCompraDetalle';
import Requisicion from '../models/Requisicion';
import RequisicionDetalle from '../models/RequisicionDetalle';
import Proveedor from '../models/Proveedor';
import Configuracion from '../models/Configuracion';
import { getNextNumber } from '../services/sequenceService';
import { registrarBitacora } from '../services/bitacoraService';
import sequelize from '../config/sequelize';

// ==============================
// 1. Generar orden de compra desde una requisición aprobada/comprometida
// ==============================
export const createFromRequisicion = async (req: AuthRequest, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
    const { requisicion_id, notas, codigo_presupuestario, expediente } = req.body;

    // Buscar requisición con sus detalles (usando el alias definido en index.ts)
    const requisicion = await Requisicion.findByPk(requisicion_id, {
      include: [{ model: RequisicionDetalle, as: 'RequisicionDetalles' }]
    });
    if (!requisicion) {
      return res.status(404).json({ message: 'Requisición no encontrada' });
    }
    if (requisicion.estado !== 'aprobada' && requisicion.estado !== 'comprometida') {
      return res.status(400).json({ message: 'La requisición debe estar aprobada o comprometida' });
    }

    // Obtener configuración para los snapshots de firmas
    const config = await Configuracion.findByPk(1);
    if (!config) {
      return res.status(500).json({ message: 'Configuración no encontrada' });
    }

    // Generar número de OC
    const numero = await getNextNumber('oc');
    const empleado_dni = requisicion.empleado_dni;

    // Crear cabecera de la orden de compra
    const orden = await OrdenCompra.create({
      numero,
      origen_oc: 'desde_requisicion',
      requisicion_id: requisicion.id,
      proveedor_id: requisicion.proveedor_id!,
      departamento_id: requisicion.departamento_id,
      empleado_dni,
      estado: 'emitida',
      codigo_presupuestario: codigo_presupuestario || requisicion.codigo_presupuestario,
      expediente: expediente || requisicion.expediente,
      notas: notas || null,
      snap_jefe_compras: config.jefe_compras_nombre,
      snap_gerente: config.gerente_nombre,
      snap_alcalde: config.alcalde_nombre,
      creado_por_dni: req.user!.empleado_dni,
    }, { transaction });

    // Copiar los detalles de la requisición a la orden de compra
    if (requisicion.RequisicionDetalles && requisicion.RequisicionDetalles.length) {
      const detalles = requisicion.RequisicionDetalles.map((det: any, idx: number) => ({
        orden_id: orden.id,
        numero_linea: idx + 1,
        descripcion: det.descripcion,
        unidad: det.unidad,
        cantidad: det.cantidad,
        precio_unitario: det.precio_unitario,
        aplica_isv: det.aplica_isv,
        valor_total: det.valor_total,
        articulo_kardex_id: det.articulo_kardex_id,
      }));
      await OrdenCompraDetalle.bulkCreate(detalles, { transaction });
    }

    // Cambiar el estado de la requisición a "comprometida" si no lo estaba
    if (requisicion.estado !== 'comprometida') {
      await requisicion.update({ estado: 'comprometida' }, { transaction });
    }

    await transaction.commit();

    // Registrar en bitácora
    await registrarBitacora({
      tabla_afectada: 'ordenes_compra',
      registro_id: orden.id,
      accion: 'crear',
      descripcion: `OC ${numero} generada desde requisición ${requisicion.numero}`,
      empleado_dni: req.user!.empleado_dni,
      ip_address: req.ip,
    });

    res.status(201).json(orden);
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: 'Error al generar orden de compra', error });
  }
};

// ==============================
// 2. Listar todas las órdenes de compra
// ==============================
export const getOrdenesCompra = async (req: AuthRequest, res: Response) => {
  try {
    const ordenes = await OrdenCompra.findAll({
      include: [
        { model: Proveedor, attributes: ['id', 'nombre', 'rtn'] },
        { model: OrdenCompraDetalle, as: 'OrdenCompraDetalles', required: false }
      ],
      order: [['fecha_emision', 'DESC']],
    });
    res.json(ordenes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener órdenes de compra', error });
  }
};

// ==============================
// 3. Obtener una orden de compra por ID (con detalles y proveedor)
// ==============================
export const getOrdenCompraById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const orden = await OrdenCompra.findByPk(parseInt(id), {
      include: [
        { model: Proveedor },
        { model: OrdenCompraDetalle, as: 'OrdenCompraDetalles' }
      ]
    });
    if (!orden) {
      return res.status(404).json({ message: 'Orden de compra no encontrada' });
    }
    res.json(orden);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la orden de compra', error });
  }
};

// ==============================
// 4. Marcar orden como entregada (solo compras/admin)
// ==============================
export const marcarEntregada = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const orden = await OrdenCompra.findByPk(parseInt(id));
    if (!orden) {
      return res.status(404).json({ message: 'Orden de compra no encontrada' });
    }
    if (orden.estado !== 'emitida') {
      return res.status(400).json({ message: 'Solo se puede entregar una orden en estado "emitida"' });
    }
    await orden.update({ estado: 'entregada', fecha_entrega: new Date() });

    await registrarBitacora({
      tabla_afectada: 'ordenes_compra',
      registro_id: orden.id,
      accion: 'editar',
      descripcion: `OC ${orden.numero} marcada como entregada`,
      empleado_dni: req.user!.empleado_dni,
      ip_address: req.ip,
    });
    res.json({ message: 'Orden marcada como entregada', orden });
  } catch (error) {
    res.status(500).json({ message: 'Error al marcar orden como entregada', error });
  }
};

// ==============================
// 5. Cancelar orden de compra (solo si no está entregada)
// ==============================
export const cancelarOrden = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const orden = await OrdenCompra.findByPk(parseInt(id));
    if (!orden) {
      return res.status(404).json({ message: 'Orden de compra no encontrada' });
    }
    if (orden.estado === 'entregada') {
      return res.status(400).json({ message: 'No se puede cancelar una orden ya entregada' });
    }
    await orden.update({ estado: 'cancelada' });

    await registrarBitacora({
      tabla_afectada: 'ordenes_compra',
      registro_id: orden.id,
      accion: 'anular',
      descripcion: `OC ${orden.numero} cancelada`,
      empleado_dni: req.user!.empleado_dni,
      ip_address: req.ip,
    });
    res.json({ message: 'Orden cancelada', orden });
  } catch (error) {
    res.status(500).json({ message: 'Error al cancelar orden', error });
  }
};