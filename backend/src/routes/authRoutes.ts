import { Router } from 'express';
import { login } from '../controllers/authController';

const router = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Inicia sesión en el sistema y obtiene un token JWT
 *     description: Cualquier usuario puede usar este endpoint. Retorna un token.
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *           example:
 *             username: admin
 *             password: admin123
 *     responses:
 *       200:
 *         description: Login exitoso
 *       400:
 *         description: Faltan datos
 *       401:
 *         description: Credenciales inválidas
 *       500:
 *         description: Error interno
 */
router.post('/login', login);

export default router;