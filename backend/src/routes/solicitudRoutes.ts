import { Router } from 'express';
import {
  createSolicitud,
  getSolicitudes,
  getSolicitudById,
  getSolicitudConRespuesta,
  respondSolicitud,
  cancelSolicitud,
} from '../controllers/solicitudController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
router.use(authMiddleware);

const storagePdf = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = 'uploads/cotizaciones';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${base}_${Date.now()}${ext}`);
  },
});

const uploadPdf = multer({
  storage: storagePdf,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Solo se permiten archivos PDF'));
  },
});

router.get('/',              getSolicitudes);
router.get('/:id',           getSolicitudById);
router.get('/:id/detalle',   getSolicitudConRespuesta); // ← nuevo: solicitud + respuesta + items
router.post('/',             createSolicitud);
router.post('/:id/responder', roleMiddleware(['compras', 'bienes', 'admin']), uploadPdf.single('archivo'), respondSolicitud);
router.put('/:id/cancelar',  cancelSolicitud);

export default router;