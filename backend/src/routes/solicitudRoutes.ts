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
router.use(authMiddleware);

/**
 * @openapi
 * /solicitudes:
 *   get:
 *     summary: Lista todas las solicitudes
 *     tags: [Solicitudes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de solicitudes
 *       401:
 *         description: No autorizado
 */
router.get('/', getSolicitudes);

/**
 * @openapi
 * /solicitudes/{id}:
 *   get:
 *     summary: Obtiene una solicitud por ID
 *     tags: [Solicitudes]
 *     security:
 *       - bearerAuth: []
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
 *     summary: Crea una nueva solicitud
 *     tags: [Solicitudes]
 *     security:
 *       - bearerAuth: []
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
 *           example:
 *             tipo: "cotizacion"
 *             departamento_id: 4
 *             observaciones: "Se requiere cotización de 2 impresoras"
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
 *     summary: Responde una solicitud pendiente (solo compras, bienes o admin)
 *     tags: [Solicitudes]
 *     security:
 *       - bearerAuth: []
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
 *                 description: Ruta del archivo PDF (obligatorio si tipo_respuesta = pdf_cotizacion)
 *               observaciones:
 *                 type: string
 *               items:
 *                 type: array
 *                 description: Lista de productos/precios (obligatorio si tipo_respuesta = listado_precios)
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
 *           examples:
 *             pdf_cotizacion:
 *               summary: Respuesta con archivo PDF
 *               value:
 *                 tipo_respuesta: pdf_cotizacion
 *                 archivo_pdf: "cotizacion.pdf"
 *                 observaciones: "Cotización recibida de proveedor X"
 *             listado_precios:
 *               summary: Respuesta con listado de precios
 *               value:
 *                 tipo_respuesta: listado_precios
 *                 observaciones: "Productos disponibles en bodega"
 *                 items:
 *                   - descripcion: "Resma de papel carta"
 *                     unidad: "Resma"
 *                     precio_unitario: 150
 *                     cantidad_disponible: 45
 *     responses:
 *       200:
 *         description: Respuesta registrada
 *       400:
 *         description: Datos inválidos o solicitud ya respondida
 *       403:
 *         description: Permisos insuficientes
 */
router.post('/:id/responder', roleMiddleware(['compras', 'bienes', 'admin']), respondSolicitud);

/**
 * @openapi
 * /solicitudes/{id}/cancelar:
 *   put:
 *     summary: Cancela una solicitud pendiente
 *     tags: [Solicitudes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cancelada
 *       400:
 *         description: No se puede cancelar (ya respondida)
 *       404:
 *         description: No encontrada
 */
router.put('/:id/cancelar', cancelSolicitud);

export default router;