import { Router } from 'express';
import {
  createSolicitud,
  getSolicitudes,
  getSolicitudById,
  respondSolicitud,
  cancelSolicitud,
} from '../controllers/solicitudController';

import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @openapi
 * /solicitudes:
 *   get:
 *     tags:
 *       - Solicitudes
 *     summary: Lista todas las solicitudes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de solicitudes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Solicitud'
 */
router.get('/', getSolicitudes);

/**
 * @openapi
 * /solicitudes/{id}:
 *   get:
 *     tags:
 *       - Solicitudes
 *     summary: Obtiene una solicitud por ID con su respuesta
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Solicitud encontrada
 *       404:
 *         description: No encontrada
 */
router.get('/:id', getSolicitudById);

/**
 * @openapi
 * /solicitudes:
 *   post:
 *     tags:
 *       - Solicitudes
 *     summary: Crea una nueva solicitud (cualquier usuario autenticado)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo
 *               - departamento_id
 *               - observaciones
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [cotizacion, precios_bienes]
 *               departamento_id:
 *                 type: integer
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/', createSolicitud);

/**
 * @openapi
 * /solicitudes/{id}/responder:
 *   post:
 *     tags:
 *       - Solicitudes
 *     summary: Responde una solicitud (solo compras, bienes o admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo_respuesta
 *             properties:
 *               tipo_respuesta:
 *                 type: string
 *                 enum: [pdf_cotizacion, listado_precios]
 *               archivo_pdf:
 *                 type: string
 *               observaciones:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     descripcion:
 *                       type: string
 *                     unidad:
 *                       type: string
 *                     precio_unitario:
 *                       type: number
 *                     cantidad_disponible:
 *                       type: number
 *     responses:
 *       200:
 *         description: Respuesta registrada
 *       400:
 *         description: Datos inválidos o solicitud ya respondida
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Solicitud no encontrada
 */
router.post(
  '/:id/responder',
  roleMiddleware(['compras', 'bienes', 'admin']),
  respondSolicitud
);

/**
 * @openapi
 * /solicitudes/{id}/cancelar:
 *   put:
 *     tags:
 *       - Solicitudes
 *     summary: Cancela una solicitud pendiente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cancelada exitosamente
 *       400:
 *         description: No se puede cancelar (ya respondida)
 *       404:
 *         description: No encontrada
 */
router.put('/:id/cancelar', cancelSolicitud);

export default router;