import { Router } from 'express';
import { camabaBiodataController } from '../../controllers/camaba/camabaBiodata.controller';
import { verifyToken } from '../../middleware/auth.middleware';

const router = Router();

// Semua rute biodata memerlukan login Camaba
router.use(verifyToken);

router.get('/status', camabaBiodataController.getStatusPendaftaran);
router.get('/', camabaBiodataController.getBiodataDetail);
router.put('/', camabaBiodataController.updateBiodata);
router.post('/finalisasi', camabaBiodataController.finalisasi);

export default router;

