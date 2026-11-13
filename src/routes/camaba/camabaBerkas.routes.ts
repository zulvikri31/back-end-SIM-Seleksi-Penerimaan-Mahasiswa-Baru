import { Router } from 'express';
import { camabaBerkasController } from '../../controllers/camaba/camabaBerkas.controller';
import { verifyToken } from '../../middleware/auth.middleware';
import { uploadDocument } from '../../middleware/upload.middleware';

const router = Router();

// Semua endpoint berkas memerlukan autentikasi login Camaba
router.use(verifyToken);

// GET /api/camaba/berkas
router.get('/', camabaBerkasController.getBerkasList);

// POST /api/camaba/berkas/upload
router.post('/upload', uploadDocument.single('file'), camabaBerkasController.uploadBerkas);

// DELETE /api/camaba/berkas/:id
router.delete('/:id', camabaBerkasController.deleteBerkas);

export default router;

