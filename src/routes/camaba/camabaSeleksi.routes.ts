import { Router } from 'express';
import { camabaSeleksiController } from '../../controllers/camaba/camabaSeleksi.controller';
import { verifyToken } from '../../middleware/auth.middleware';

const router = Router();

// Semua rute seleksi memerlukan login Camaba
router.use(verifyToken);

router.get('/kartu-ujian', camabaSeleksiController.getKartuUjian);
router.get('/hasil', camabaSeleksiController.getHasilSeleksi);

export default router;

