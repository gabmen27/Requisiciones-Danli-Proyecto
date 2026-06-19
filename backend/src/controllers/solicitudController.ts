import { Response } from 'express';
import { Op } from 'sequelize';
import { AuthRequest } from '../middleware/authMiddleware';
import Solicitud from '../models/Solicitud';
import SolicitudRespuesta from '../models/SolicitudRespuesta';
import SolicitudRespuestaItem from '../models/SolicitudRespuestaItem';
import { getNextNumber } from '../services/sequenceService';
import { registrarBitacora } from '../services/bitacoraService';
import sequelize from '../config/sequelize';

// ─── Roles que ven TODAS las solicitudes (para responder) ────────────────────
const ROLES_GLOBALES = ['admin', 'compras', 'bienes'];

// ─── Roles que responden solicitudes de cotización (a Compras) ───────────────
const ROLES_COMPRAS = ['admin', 'compras'];

// ─── Roles que responden solicitudes de bienes ───────────────────────────────
const ROLES_BIENES = ['admin', 'bienes'];

// ─────────────────────────────────────────────────────────────────────────────
// CREAR SOLICITUD
// Cualquier usuario puede crear. El departamento_id se toma del usuario
// autenticado para garantizar que nadie cree a nombre de otro departamento.
// ─────────────────────────────────────────────────────────────────────────────
export const createSolicitud = async (req: AuthRequest, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
    const { tipo, observaciones } = req.body;

    if (!tipo || !observaciones) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Faltan datos obligatorios: tipo y observaciones' });
    }

    if (!['cotizacion', 'precios_bienes'].includes(tipo)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Tipo inválido. Use: cotizacion | precios_bienes' });
    }

    // El departamento_id siempre viene del usuario autenticado — nunca del body.
    // Esto garantiza privacidad: cada quien solo solicita a nombre de su depto.
    const departamento_id = req.user!.departamento_id;
    if (!departamento_id) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Tu usuario no tiene departamento asignado' });
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
      registro_id:    solicitud.id,
      accion:         'crear',
      descripcion:    `Solicitud ${numero} creada - tipo: ${tipo} - depto: ${departamento_id}`,
      empleado_dni:   req.user!.empleado_dni,
      ip_address:     req.ip,
    });

    res.status(201).json(solicitud);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Error al crear solicitud', error });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LISTAR SOLICITUDES
// - Compras/Bienes/Admin: ven TODAS (para poder responder)
// - Todos los demás: solo ven las de su propio departamento
// ─────────────────────────────────────────────────────────────────────────────
export const getSolicitudes = async (req: AuthRequest, res: Response) => {
  try {
    const { rol, departamento_id } = req.user!;

    // Construir filtro de privacidad
    const where: Record<string, unknown> = {};

    if (!ROLES_GLOBALES.includes(rol)) {
      // Usuario normal: solo ve las solicitudes de su departamento
      where['departamento_id'] = departamento_id;
    }

    // Filtros opcionales por query string
    if (req.query.estado) {
      where['estado'] = req.query.estado;
    }
    if (req.query.tipo) {
      where['tipo'] = req.query.tipo;
    }

    const solicitudes = await Solicitud.findAll({
      where,
      order: [['fecha_solicitud', 'DESC']],
    });

    res.json(solicitudes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener solicitudes', error });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// OBTENER SOLICITUD POR ID
// Valida que el usuario tenga acceso (su depto o rol global).
// Si Compras/Bienes la abre y está en 'pendiente', cambia a 'en_espera'
// para que el solicitante sepa que ya fue vista.
// ─────────────────────────────────────────────────────────────────────────────
export const getSolicitudById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rol, departamento_id } = req.user!;

    const solicitud = await Solicitud.findByPk(parseInt(id as string));
    if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada' });

    // Verificar acceso: si no es rol global, debe ser del mismo departamento
    if (!ROLES_GLOBALES.includes(rol) && solicitud.departamento_id !== departamento_id) {
      return res.status(403).json({ message: 'No tienes acceso a esta solicitud' });
    }

    // Si Compras o Bienes la abre y está pendiente → marcar como en_espera
    // Esto le avisa al solicitante que ya fue recibida y está siendo atendida
    const esResponsable =
      (rol === 'compras' && solicitud.tipo === 'cotizacion') ||
      (rol === 'bienes'  && solicitud.tipo === 'precios_bienes') ||
      rol === 'admin';

    if (esResponsable && solicitud.estado === 'pendiente') {
      await solicitud.update({ estado: 'en_espera' });

      await registrarBitacora({
        tabla_afectada: 'solicitudes',
        registro_id:    solicitud.id,
        accion:         'editar',
        descripcion:    `Solicitud ${solicitud.numero} vista por ${rol} — estado: en_espera`,
        empleado_dni:   req.user!.empleado_dni,
        ip_address:     req.ip,
      });
    }

    res.json(solicitud);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener solicitud', error });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// OBTENER SOLICITUD CON RESPUESTA E ÍTEMS (para vista de detalle)
// ─────────────────────────────────────────────────────────────────────────────
export const getSolicitudConRespuesta = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rol, departamento_id } = req.user!;

    const solicitud = await Solicitud.findByPk(parseInt(id as string));
    if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada' });

    // Verificar acceso
    if (!ROLES_GLOBALES.includes(rol) && solicitud.departamento_id !== departamento_id) {
      return res.status(403).json({ message: 'No tienes acceso a esta solicitud' });
    }

    // Buscar respuesta
    const respuesta = await SolicitudRespuesta.findOne({
      where: { solicitud_id: solicitud.id },
    });

    // Si tiene respuesta, buscar ítems (solo aplica a listado_precios de Bienes)
    let items: unknown[] = [];
    if (respuesta) {
      items = await SolicitudRespuestaItem.findAll({
        where: { respuesta_id: respuesta.id },
        order: [['numero_linea', 'ASC']],
      });
    }

    res.json({ solicitud, respuesta, items });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener detalle de solicitud', error });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RESPONDER SOLICITUD
// - cotizacion      → solo Compras/Admin, sube PDF, estado → respondida
// - precios_bienes  → solo Bienes/Admin,  guarda tabla de ítems, estado → respondida
// ─────────────────────────────────────────────────────────────────────────────
export const respondSolicitud = async (req: AuthRequest, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { rol } = req.user!;

    const solicitud = await Solicitud.findByPk(parseInt(id as string));
    if (!solicitud) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    // Solo se puede responder si está pendiente o en_espera
    if (!['pendiente', 'en_espera'].includes(solicitud.estado)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'La solicitud ya fue respondida o cancelada' });
    }

    // Validar que el rol tenga permiso para responder este tipo
    if (solicitud.tipo === 'cotizacion' && !ROLES_COMPRAS.includes(rol)) {
      await transaction.rollback();
      return res.status(403).json({ message: 'Solo Compras puede responder cotizaciones' });
    }
    if (solicitud.tipo === 'precios_bienes' && !ROLES_BIENES.includes(rol)) {
      await transaction.rollback();
      return res.status(403).json({ message: 'Solo Bienes puede responder listados de precios' });
    }

    const { tipo_respuesta, observaciones, items } = req.body;

    // ── Respuesta tipo PDF (Compras) ────────────────────────────────────────
    let rutaPdf: string | null = null;
    if (req.file) {
      rutaPdf = `uploads/cotizaciones/${req.file.filename}`;
    }

    if (tipo_respuesta === 'pdf_cotizacion' && !rutaPdf) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Debes subir un archivo PDF o imagen' });
    }

    const respuesta = await SolicitudRespuesta.create({
      solicitud_id:       solicitud.id,
      tipo_respuesta,
      archivo_pdf:        rutaPdf,
      respondido_por_dni: req.user!.empleado_dni,
      observaciones:      observaciones || null,
    }, { transaction });

    // ── Respuesta tipo listado (Bienes) ─────────────────────────────────────
    if (tipo_respuesta === 'listado_precios') {
      let itemsParseados = items;
      if (typeof items === 'string') {
        try { itemsParseados = JSON.parse(items); } catch { itemsParseados = []; }
      }

      if (!itemsParseados || itemsParseados.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Agrega al menos un artículo al listado' });
      }

      const itemsData = (itemsParseados as {
        descripcion:         string;
        unidad:              string;
        precio_unitario:     number;
        cantidad_disponible: number;
        aplica_isv:          boolean;
      }[]).map((item, idx) => ({
        respuesta_id:        respuesta.id,
        numero_linea:        idx + 1,
        descripcion:         item.descripcion,
        unidad:              item.unidad || 'Unidad',
        precio_unitario:     item.precio_unitario,
        cantidad_disponible: item.cantidad_disponible,
        // Si no se especifica aplica_isv, por defecto es true (gravado)
        aplica_isv: item.aplica_isv !== undefined ? item.aplica_isv : true,
      }));

      await SolicitudRespuestaItem.bulkCreate(itemsData, { transaction });
    }

    // Marcar solicitud como respondida y registrar fecha
    await solicitud.update({
      estado:          'respondida',
      fecha_respuesta: new Date(),
    }, { transaction });

    await transaction.commit();

    await registrarBitacora({
      tabla_afectada: 'solicitudes',
      registro_id:    solicitud.id,
      accion:         'editar',
      descripcion:    `Solicitud ${solicitud.numero} respondida - ${tipo_respuesta}`,
      empleado_dni:   req.user!.empleado_dni,
      ip_address:     req.ip,
    });

    res.json({ message: 'Respuesta registrada correctamente', respuesta });
  } catch (error) {
    await transaction.rollback();
    console.error('Error respondSolicitud:', error);
    res.status(500).json({ message: 'Error al responder solicitud', error });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CANCELAR SOLICITUD
// Solo el propio departamento puede cancelar, y solo si está pendiente/en_espera
// ─────────────────────────────────────────────────────────────────────────────
export const cancelSolicitud = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rol, departamento_id } = req.user!;

    const solicitud = await Solicitud.findByPk(parseInt(id as string));
    if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada' });

    // Solo el departamento que la creó o admin puede cancelarla
    if (rol !== 'admin' && solicitud.departamento_id !== departamento_id) {
      return res.status(403).json({ message: 'No puedes cancelar una solicitud de otro departamento' });
    }

    if (!['pendiente', 'en_espera'].includes(solicitud.estado)) {
      return res.status(400).json({ message: 'Solo se pueden cancelar solicitudes pendientes o en espera' });
    }

    await solicitud.update({ estado: 'cancelada' });

    await registrarBitacora({
      tabla_afectada: 'solicitudes',
      registro_id:    solicitud.id,
      accion:         'anular',
      descripcion:    `Solicitud ${solicitud.numero} cancelada por ${rol}`,
      empleado_dni:   req.user!.empleado_dni,
      ip_address:     req.ip,
    });

    res.json({ message: 'Solicitud cancelada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al cancelar solicitud', error });
  }
};