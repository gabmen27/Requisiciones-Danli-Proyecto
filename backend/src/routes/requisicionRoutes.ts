import { Router } from 'express';
import {
  createRequisicion,
  getRequisiciones,
  getRequisicionById,
  enviarAprobacion,
  aprobarRequisicion,
  rechazarRequisicion,
  comprometerRequisicion,
} from '../controllers/requisicionController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();
router.use(authMiddleware);

router.post('/',                                                          createRequisicion);
router.get('/',                                                           getRequisiciones);
router.get('/:id',                                                        getRequisicionById);
router.put('/:id/enviar-aprobacion',                                      enviarAprobacion);
router.put('/:id/aprobar',  roleMiddleware(['gerencia','alcaldia','admin']), aprobarRequisicion);
router.put('/:id/rechazar', roleMiddleware(['gerencia','alcaldia','admin']), rechazarRequisicion);
router.put('/:id/comprometer', roleMiddleware(['contabilidad','admin']),     comprometerRequisicion);

export default router;