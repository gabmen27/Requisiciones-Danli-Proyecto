import { Router } from 'express';
import {
  createFromRequisicion,
  getOrdenesCompra,
  getOrdenCompraById,
  marcarEntregada,
  cancelarOrden,
} from '../controllers/ordenCompraController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /ordenes-compra/desde-requisicion:
 *   post:
 *     summary: Genera una orden de compra a partir de una requisición aprobada o comprometida
 *     description: Solo los roles `compras` o `admin` pueden generar la OC. La requisición debe tener estado `aprobada` o `comprometida` y un proveedor asociado.
 *     tags: [Órdenes de Compra]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requisicion_id
 *             properties:
 *               requisicion_id:
 *                 type: integer
 *                 description: ID de la requisición aprobada
 *               notas:
 *                 type: string
 *               codigo_presupuestario:
 *                 type: string
 *               expediente:
 *                 type: string
 *           example:
 *             requisicion_id: 10
 *             notas: "Prioridad alta"
 *     responses:
 *       201:
 *         description: Orden de compra generada exitosamente
 *       400:
 *         description: La requisición no está aprobada/comprometida o no tiene proveedor
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Requisición no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.post('/desde-requisicion', roleMiddleware(['compras', 'admin']), createFromRequisicion);

/**
 * @openapi
 * /ordenes-compra:
 *   get:
 *     summary: Lista todas las órdenes de compra
 *     description: Cualquier usuario autenticado puede ver el listado de órdenes. Se incluyen los datos del proveedor y los detalles de cada orden.
 *     tags: [Órdenes de Compra]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de órdenes
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', getOrdenesCompra);

/**
 * @openapi
 * /ordenes-compra/{id}:
 *   get:
 *     summary: Obtiene una orden de compra por ID (con proveedor y detalles)
 *     description: Cualquier usuario autenticado puede consultar una orden específica.
 *     tags: [Órdenes de Compra]
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
 *         description: Orden encontrada
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Orden no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', getOrdenCompraById);

/**
 * @openapi
 * /ordenes-compra/{id}/entregar:
 *   put:
 *     summary: Marca una orden de compra como entregada (solo compras/admin)
 *     description: La orden debe estar en estado `emitida`. Se registra la fecha de entrega.
 *     tags: [Órdenes de Compra]
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
 *         description: Orden marcada como entregada
 *       400:
 *         description: La orden no está emitida o ya fue entregada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Orden no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id/entregar', roleMiddleware(['compras', 'admin']), marcarEntregada);

/**
 * @openapi
 * /ordenes-compra/{id}/cancelar:
 *   put:
 *     summary: Cancela una orden de compra (solo si no está entregada)
 *     description: Solo los roles `compras` o `admin` pueden cancelar. No se puede cancelar una orden ya entregada.
 *     tags: [Órdenes de Compra]
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
 *         description: Orden cancelada
 *       400:
 *         description: La orden no puede cancelarse (está entregada o ya cancelada)
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Orden no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id/cancelar', roleMiddleware(['compras', 'admin']), cancelarOrden);

export default router;