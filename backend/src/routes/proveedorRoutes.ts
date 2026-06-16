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

router.use(authMiddleware); // Todas las rutas requieren autenticación

/**
 * @openapi
 * /proveedores:
 *   get:
 *     summary: Lista todos los proveedores activos
 *     description: Cualquier usuario autenticado puede ver la lista de proveedores (solo los que están activos).
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de proveedores (vacía si no hay)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Proveedor'
 *       401:
 *         description: No autorizado (token inválido o faltante)
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', getProveedores);

/**
 * @openapi
 * /proveedores/{id}:
 *   get:
 *     summary: Obtiene un proveedor por su ID
 *     description: Cualquier usuario autenticado puede consultar un proveedor específico.
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID numérico del proveedor
 *     responses:
 *       200:
 *         description: Proveedor encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Proveedor'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Proveedor no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', getProveedorById);

/**
 * @openapi
 * /proveedores:
 *   post:
 *     summary: Crea un nuevo proveedor
 *     description: Solo los roles `admin` o `compras` pueden crear proveedores. El RTN debe ser único y tener exactamente 14 dígitos.
 *     tags: [Proveedores]
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
 *                 description: Razón social o nombre comercial
 *               rtn:
 *                 type: string
 *                 description: Registro Tributario Nacional (14 dígitos sin guiones)
 *               direccion:
 *                 type: string
 *                 description: Dirección física (opcional)
 *               correo:
 *                 type: string
 *                 description: Correo electrónico de contacto (opcional)
 *               telefono:
 *                 type: string
 *                 description: Número de teléfono (opcional)
 *           example:
 *             nombre: "Papelería El Estudiante"
 *             rtn: "06019887200321"
 *             direccion: "Danlí, El Paraíso"
 *             correo: "info@elestudiante.hn"
 *             telefono: "2763-5678"
 *     responses:
 *       201:
 *         description: Proveedor creado exitosamente
 *       400:
 *         description: Datos inválidos (nombre vacío, RTN duplicado o con formato incorrecto)
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permisos insuficientes (rol no autorizado)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', roleMiddleware(['admin', 'compras']), createProveedor);

/**
 * @openapi
 * /proveedores/{id}:
 *   put:
 *     summary: Actualiza un proveedor existente
 *     description: Solo `admin` o `compras` pueden modificar proveedores. Se puede actualizar cualquier campo.
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del proveedor a modificar
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
 *           example:
 *             nombre: "Papelería Central Actualizada"
 *             telefono: "2763-9999"
 *     responses:
 *       200:
 *         description: Proveedor actualizado correctamente
 *       400:
 *         description: Datos inválidos (ej. RTN duplicado)
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Proveedor no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id', roleMiddleware(['admin', 'compras']), updateProveedor);

/**
 * @openapi
 * /proveedores/{id}:
 *   delete:
 *     summary: Elimina (desactiva) un proveedor
 *     description: Solo `admin` puede eliminar proveedores. El registro no se borra físicamente, solo se marca como inactivo.
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del proveedor a eliminar
 *     responses:
 *       200:
 *         description: Proveedor desactivado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Permisos insuficientes (solo admin)
 *       404:
 *         description: Proveedor no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:id', roleMiddleware(['admin']), deleteProveedor);

export default router;