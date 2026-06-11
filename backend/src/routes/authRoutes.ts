import { Router } from 'express';
import { login } from '../controllers/authController';

const router = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Inicia sesión en el sistema
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
 *     responses:
 *       200:
 *         description: Login exitoso, retorna token y datos del usuario
 *       401:
 *         description: Credenciales inválidas
 *       400:
 *         description: Faltan datos
 */
router.post('/login', login);

export default router;