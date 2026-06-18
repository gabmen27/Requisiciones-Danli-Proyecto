import { Router, Response } from 'express';
import { QueryTypes } from 'sequelize';
import sequelize from '../config/sequelize';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Multer con nombre temporal
const upload = multer({
  dest: 'uploads/logos/',
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /jpeg|jpg|png|gif|webp|svg/.test(
      path.extname(file.originalname).toLowerCase()
    );
    cb(null, ok);
  },
});

// GET configuración completa
router.get('/', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const [config] = await sequelize.query(
      'SELECT * FROM configuracion WHERE id = 1',
      { type: QueryTypes.SELECT }
    );
    res.json(config || {});
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener configuración', error });
  }
});

// PUT actualizar campos de texto
router.put('/', authMiddleware, roleMiddleware(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const f = req.body;
    await sequelize.query(`
      UPDATE configuracion SET
        municipalidad_nombre  = :municipalidad_nombre,
        municipalidad_dir     = :municipalidad_dir,
        municipalidad_tel     = :municipalidad_tel,
        alcalde_nombre        = :alcalde_nombre,
        alcalde_cargo         = :alcalde_cargo,
        gerente_nombre        = :gerente_nombre,
        gerente_cargo         = :gerente_cargo,
        jefe_compras_nombre   = :jefe_compras_nombre,
        jefe_compras_cargo    = :jefe_compras_cargo,
        jefe_bienes_nombre    = :jefe_bienes_nombre,
        jefe_bienes_cargo     = :jefe_bienes_cargo,
        pie_documento         = :pie_documento,
        tasa_impuesto         = :tasa_impuesto,
        moneda_simbolo        = :moneda_simbolo,
        req_prefijo           = :req_prefijo,
        req_siguiente         = :req_siguiente,
        oc_prefijo            = :oc_prefijo,
        oc_siguiente          = :oc_siguiente,
        sol_prefijo           = :sol_prefijo,
        sol_siguiente         = :sol_siguiente,
        inv_prefijo           = :inv_prefijo,
        inv_siguiente         = :inv_siguiente,
        traslado_prefijo      = :traslado_prefijo,
        traslado_siguiente    = :traslado_siguiente,
        req_filas_base        = :req_filas_base,
        oc_filas_base         = :oc_filas_base,
        dias_alerta_stock     = :dias_alerta_stock,
        sistema_version       = :sistema_version
      WHERE id = 1
    `, { replacements: f, type: QueryTypes.UPDATE });

    res.json({ message: 'Configuración actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar', error });
  }
});

// POST subir logo o escudo
router.post('/upload-logo', authMiddleware, roleMiddleware(['admin']), upload.single('archivo'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se recibió archivo' });
    }

    const campo = req.body.campo as string;
    if (campo !== 'logo_path' && campo !== 'escudo_path') {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Campo inválido' });
    }

    const nombre      = campo === 'escudo_path' ? 'escudo' : 'logo';
    const ext         = path.extname(req.file.originalname).toLowerCase();
    const destino     = path.join('uploads', 'logos', `${nombre}${ext}`);
    const rutaDB      = `uploads/logos/${nombre}${ext}`;

    // Eliminar archivo anterior si existe
    if (fs.existsSync(destino)) {
      fs.unlinkSync(destino);
    }

    // Mover archivo temporal al destino final
    fs.renameSync(req.file.path, destino);

    // Guardar ruta en BD
    await sequelize.query(
      `UPDATE configuracion SET ${campo} = :ruta WHERE id = 1`,
      { replacements: { ruta: rutaDB }, type: QueryTypes.UPDATE }
    );

    res.json({ message: 'Imagen subida correctamente', ruta: rutaDB });
  } catch (error) {
    console.error('Error upload:', error);
    res.status(500).json({ message: 'Error al subir imagen', error });
  }
});

export default router;