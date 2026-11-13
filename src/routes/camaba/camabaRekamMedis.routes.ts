import { Router } from 'express';
import { camabaRekamMedisController } from '../../controllers/camaba/camabaRekamMedis.controller';
import { verifyToken } from '../../middleware/auth.middleware';

const router = Router();

// Semua endpoint rekam medis wajib login Camaba
router.use(verifyToken);

router.get('/', camabaRekamMedisController.getRekamMedis);
router.put('/', camabaRekamMedisController.updateRekamMedis);

export default router;

