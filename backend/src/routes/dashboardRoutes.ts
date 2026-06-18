import { Router } from 'express';
import { getStats, getConfiguracionPublica } from '../controllers/dashboardController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/stats',   authMiddleware, getStats);
router.get('/publica', getConfiguracionPublica); // sin auth, para el login

export default router;