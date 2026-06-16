import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Solicitud from '../models/Solicitud';
import SolicitudRespuesta from '../models/SolicitudRespuesta';
import SolicitudRespuestaItem from '../models/SolicitudRespuestaItem';
import { getNextNumber } from '../services/sequenceService';
import { registrarBitacora } from '../services/bitacoraService';
import sequelize from '../config/sequelize';

// Crear solicitud (cualquier usuario autenticado)
export const createSolicitud = async (req: AuthRequest, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
    const { tipo, departamento_id, observaciones } = req.body;
    if (!tipo || !departamento_id || !observaciones) {
      return res.status(400).json({ message: 'Faltan datos obligatorios' });
    }
    const numero = await getNextNumber('sol');
    const solicitud = await Solicitud.create({
      numero,
      tipo,
      departamento_id,
      empleado_dni: req.user!.empleado_dni,
      observaciones,
      estado: 'pendiente',
    }, { transaction });
    await transaction.commit();

    await registrarBitacora({
      tabla_afectada: 'solicitudes',
      registro_id: solicitud.id,
      accion: 'crear',
      descripcion: `Solicitud ${numero} creada - tipo: ${tipo}`,
      empleado_dni: req.user!.empleado_dni,
      ip_address: req.ip,
    });
    res.status(201).json(solicitud);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Error al crear solicitud', error });
  }
};

// Listar solicitudes (sin include para evitar errores de asociación)
export const getSolicitudes = async (req: AuthRequest, res: Response) => {
  try {
    const solicitudes = await Solicitud.findAll({
      order: [['fecha_solicitud', 'DESC']],
    });
    res.json(solicitudes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener solicitudes', error });
  }
};

// Obtener solicitud por ID (sin include por ahora)
export const getSolicitudById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') return res.status(400).json({ message: 'ID inválido' });
    const solicitud = await Solicitud.findByPk(parseInt(id));
    if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada' });
    res.json(solicitud);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener solicitud', error });
  }
};

// Responder una solicitud (solo compras, bienes o admin)
export const respondSolicitud = async (req: AuthRequest, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    if (typeof id !== 'string') return res.status(400).json({ message: 'ID inválido' });
    const { tipo_respuesta, archivo_pdf, observaciones, items } = req.body;
    const solicitud = await Solicitud.findByPk(parseInt(id));
    if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada' });
    if (solicitud.estado !== 'pendiente') {
      return res.status(400).json({ message: 'La solicitud ya fue respondida o cancelada' });
    }

    const respuesta = await SolicitudRespuesta.create({
      solicitud_id: solicitud.id,
      tipo_respuesta,
      archivo_pdf: archivo_pdf || null,
      respondido_por_dni: req.user!.empleado_dni,
      observaciones: observaciones || null,
    }, { transaction });

    if (tipo_respuesta === 'listado_precios' && items && items.length) {
      const itemsData = items.map((item: any, idx: number) => ({
        respuesta_id: respuesta.id,
        numero_linea: idx + 1,
        descripcion: item.descripcion,
        unidad: item.unidad || 'Unidad',
        precio_unitario: item.precio_unitario,
        cantidad_disponible: item.cantidad_disponible,
      }));
      await SolicitudRespuestaItem.bulkCreate(itemsData, { transaction });
    }

    await solicitud.update({ estado: 'respondida', fecha_respuesta: new Date() }, { transaction });
    await transaction.commit();

    await registrarBitacora({
      tabla_afectada: 'solicitudes',
      registro_id: solicitud.id,
      accion: 'editar',
      descripcion: `Solicitud ${solicitud.numero} respondida con tipo ${tipo_respuesta}`,
      empleado_dni: req.user!.empleado_dni,
      ip_address: req.ip,
    });
    res.json({ message: 'Respuesta registrada', respuesta });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Error al responder solicitud', error });
  }
};

// Cancelar solicitud (solo el creador o admin)
export const cancelSolicitud = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string') return res.status(400).json({ message: 'ID inválido' });
    const solicitud = await Solicitud.findByPk(parseInt(id));
    if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada' });
    if (solicitud.estado !== 'pendiente') {
      return res.status(400).json({ message: 'Solo se pueden cancelar solicitudes pendientes' });
    }
    await solicitud.update({ estado: 'cancelada' });
    await registrarBitacora({
      tabla_afectada: 'solicitudes',
      registro_id: solicitud.id,
      accion: 'anular',
      descripcion: `Solicitud ${solicitud.numero} cancelada`,
      empleado_dni: req.user!.empleado_dni,
      ip_address: req.ip,
    });
    res.json({ message: 'Solicitud cancelada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al cancelar solicitud', error });
  }
};