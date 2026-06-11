import { Router } from 'express';
import {
  getProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor,
} from '../controllers/proveedorController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @openapi
 * /proveedores:
 *   get:
 *     tags:
 *       - Proveedores
 *     summary: Lista todos los proveedores activos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de proveedores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Proveedor'
 *       401:
 *         description: No autorizado
 */
router.get('/', getProveedores);

/**
 * @openapi
 * /proveedores/{id}:
 *   get:
 *     tags:
 *       - Proveedores
 *     summary: Obtiene un proveedor por ID
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
 *         description: Proveedor encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Proveedor'
 *       404:
 *         description: Proveedor no encontrado
 *       401:
 *         description: No autorizado
 */
router.get('/:id', getProveedorById);

/**
 * @openapi
 * /proveedores:
 *   post:
 *     tags:
 *       - Proveedores
 *     summary: Crea un nuevo proveedor (solo admin o compras)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - rtn
 *             properties:
 *               nombre:
 *                 type: string
 *               rtn:
 *                 type: string
 *               direccion:
 *                 type: string
 *               correo:
 *                 type: string
 *               telefono:
 *                 type: string
 *     responses:
 *       201:
 *         description: Proveedor creado exitosamente
 *       400:
 *         description: Datos inválidos o RTN duplicado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permisos insuficientes
 */
router.post('/', roleMiddleware(['admin', 'compras']), createProveedor);

/**
 * @openapi
 * /proveedores/{id}:
 *   put:
 *     tags:
 *       - Proveedores
 *     summary: Actualiza un proveedor existente (solo admin o compras)
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
 *             properties:
 *               nombre:
 *                 type: string
 *               rtn:
 *                 type: string
 *               direccion:
 *                 type: string
 *               correo:
 *                 type: string
 *               telefono:
 *                 type: string
 *     responses:
 *       200:
 *         description: Proveedor actualizado
 *       404:
 *         description: Proveedor no encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permisos insuficientes
 */
router.put('/:id', roleMiddleware(['admin', 'compras']), updateProveedor);

/**
 * @openapi
 * /proveedores/{id}:
 *   delete:
 *     tags:
 *       - Proveedores
 *     summary: Elimina (desactiva) un proveedor (solo admin)
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
 *         description: Proveedor eliminado (desactivado)
 *       404:
 *         description: Proveedor no encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permisos insuficientes
 */
router.delete('/:id', roleMiddleware(['admin']), deleteProveedor);

export default router;