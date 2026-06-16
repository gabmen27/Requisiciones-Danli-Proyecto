import { Router } from 'express';
import {
  createRequisicion,
  getRequisiciones,
  getRequisicionById,
  enviarAprobacion,
  aprobarRequisicion,
  rechazarRequisicion,
} from '../controllers/requisicionController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /requisiciones:
 *   post:
 *     summary: Crea una nueva requisición (estado borrador)
 *     tags: [Requisiciones]
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
 *               - dirigida_a
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [compras, bienes]
 *               departamento_id:
 *                 type: integer
 *               dirigida_a:
 *                 type: string
 *                 enum: [compras, bienes]
 *               solicitud_id:
 *                 type: integer
 *                 description: ID de la solicitud que originó esta requisición (opcional)
 *               proveedor_id:
 *                 type: integer
 *               observaciones:
 *                 type: string
 *               detalles:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     descripcion:
 *                       type: string
 *                     unidad:
 *                       type: string
 *                     cantidad:
 *                       type: number
 *                     precio_unitario:
 *                       type: number
 *                     aplica_isv:
 *                       type: boolean
 *           examples:
 *             basica:
 *               summary: Requisición simple sin solicitud previa
 *               value:
 *                 tipo: "compras"
 *                 departamento_id: 4
 *                 dirigida_a: "compras"
 *                 proveedor_id: 1
 *                 observaciones: "Compra de equipos para TI"
 *                 detalles:
 *                   - descripcion: "Switch 24 puertos"
 *                     cantidad: 1
 *                     precio_unitario: 3622
 *                     aplica_isv: true
 *             desde_solicitud:
 *               summary: Requisición basada en una solicitud (con proveedor)
 *               value:
 *                 tipo: "compras"
 *                 departamento_id: 4
 *                 dirigida_a: "compras"
 *                 solicitud_id: 1
 *                 proveedor_id: 1
 *                 observaciones: "Se utiliza la cotización respondida"
 *                 detalles:
 *                   - descripcion: "Laptop HP ProBook 450"
 *                     cantidad: 2
 *                     precio_unitario: 850
 *                     aplica_isv: true
 *     responses:
 *       201:
 *         description: Requisición creada exitosamente
 *       400:
 *         description: Datos inválidos (faltan campos, proveedor no existe, etc.)
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', createRequisicion);

/**
 * @openapi
 * /requisiciones:
 *   get:
 *     summary: Lista todas las requisiciones
 *     tags: [Requisiciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de requisiciones
 *       401:
 *         description: No autorizado
 */
router.get('/', getRequisiciones);

/**
 * @openapi
 * /requisiciones/{id}:
 *   get:
 *     summary: Obtiene una requisición por ID
 *     tags: [Requisiciones]
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
 *         description: Requisición encontrada
 *       404:
 *         description: No encontrada
 */
router.get('/:id', getRequisicionById);

/**
 * @openapi
 * /requisiciones/{id}/enviar-aprobacion:
 *   put:
 *     summary: Envía a aprobación (borrador → pendiente)
 *     tags: [Requisiciones]
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
 *         description: Enviada a aprobación
 *       400:
 *         description: No está en borrador
 *       404:
 *         description: No encontrada
 */
router.put('/:id/enviar-aprobacion', enviarAprobacion);

/**
 * @openapi
 * /requisiciones/{id}/aprobar:
 *   put:
 *     summary: Aprueba una requisición (solo gerencia/alcaldía/admin)
 *     tags: [Requisiciones]
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
 *               - aprobado_por
 *             properties:
 *               aprobado_por:
 *                 type: string
 *                 enum: [gerencia, alcaldia]
 *           example:
 *             aprobado_por: "gerencia"
 *     responses:
 *       200:
 *         description: Requisición aprobada
 *       400:
 *         description: No está pendiente
 *       403:
 *         description: Permisos insuficientes
 */
router.put('/:id/aprobar', roleMiddleware(['gerencia', 'alcaldia', 'admin']), aprobarRequisicion);

/**
 * @openapi
 * /requisiciones/{id}/rechazar:
 *   put:
 *     summary: Rechaza una requisición (solo gerencia/alcaldía/admin)
 *     tags: [Requisiciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               motivo:
 *                 type: string
 *           example:
 *             motivo: "Sin presupuesto"
 *     responses:
 *       200:
 *         description: Requisición rechazada
 *       400:
 *         description: No está pendiente
 *       403:
 *         description: Permisos insuficientes
 */
router.put('/:id/rechazar', roleMiddleware(['gerencia', 'alcaldia', 'admin']), rechazarRequisicion);

export default router;