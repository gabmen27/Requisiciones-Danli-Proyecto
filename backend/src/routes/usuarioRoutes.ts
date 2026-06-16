import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  cambiarPassword,
  deleteUsuario,
} from '../controllers/usuarioController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @openapi
 * /usuarios:
 *   get:
 *     summary: Lista todos los usuarios (solo admin)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios (sin contraseñas)
 *       403:
 *         description: Permisos insuficientes
 *       401:
 *         description: No autorizado
 */
router.get('/', roleMiddleware(['admin']), getUsuarios);

/**
 * @openapi
 * /usuarios/{id}:
 *   get:
 *     summary: Obtiene un usuario por ID (admin o el mismo usuario)
 *     tags: [Usuarios]
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
 *         description: Usuario encontrado
 *       403:
 *         description: No tiene permisos
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:id', getUsuarioById);

/**
 * @openapi
 * /usuarios:
 *   post:
 *     summary: Crea un nuevo usuario (solo admin)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - empleado_dni
 *               - username
 *               - password
 *               - rol
 *             properties:
 *               empleado_dni:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [admin, solicitante, compras, bienes, gerencia, alcaldia]
 *               departamento_id:
 *                 type: integer
 *           example:
 *             empleado_dni: "1234-5678-90123"
 *             username: "nuevo_usuario"
 *             password: "secret123"
 *             rol: "solicitante"
 *             departamento_id: 4
 *     responses:
 *       201:
 *         description: Usuario creado
 *       400:
 *         description: Datos inválidos o duplicados
 *       403:
 *         description: Permisos insuficientes
 */
router.post('/', roleMiddleware(['admin']), createUsuario);

/**
 * @openapi
 * /usuarios/{id}:
 *   put:
 *     summary: Actualiza un usuario (solo admin)
 *     tags: [Usuarios]
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
 *               empleado_dni:
 *                 type: string
 *               username:
 *                 type: string
 *               rol:
 *                 type: string
 *               departamento_id:
 *                 type: integer
 *               activo:
 *                 type: boolean
 *           example:
 *             rol: "compras"
 *             activo: true
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       404:
 *         description: Usuario no encontrado
 *       403:
 *         description: Permisos insuficientes
 */
router.put('/:id', roleMiddleware(['admin']), updateUsuario);

/**
 * @openapi
 * /usuarios/{id}/cambiar-password:
 *   put:
 *     summary: Cambia la contraseña de un usuario (admin o el propio usuario)
 *     tags: [Usuarios]
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
 *               password_actual:
 *                 type: string
 *                 description: Obligatorio si no es admin
 *               password_nuevo:
 *                 type: string
 *           example:
 *             password_actual: "oldPass"
 *             password_nuevo: "newPass123"
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *       400:
 *         description: Falta nueva contraseña
 *       401:
 *         description: Contraseña actual incorrecta
 *       403:
 *         description: No tiene permisos
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/:id/cambiar-password', cambiarPassword);

/**
 * @openapi
 * /usuarios/{id}:
 *   delete:
 *     summary: Desactiva un usuario (solo admin)
 *     tags: [Usuarios]
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
 *         description: Usuario desactivado
 *       400:
 *         description: No puede desactivar su propio usuario
 *       404:
 *         description: Usuario no encontrado
 *       403:
 *         description: Permisos insuficientes
 */
router.delete('/:id', roleMiddleware(['admin']), deleteUsuario);

export default router;