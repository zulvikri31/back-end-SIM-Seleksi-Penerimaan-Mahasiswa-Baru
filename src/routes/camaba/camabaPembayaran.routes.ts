import { Router } from 'express';
import { camabaPembayaranController } from '../../controllers/camaba/camabaPembayaran.controller';
import { verifyToken } from '../../middleware/auth.middleware';

const router = Router();

// Semua endpoint pembayaran memerlukan login Camaba
router.use(verifyToken);

router.get('/tagihan', camabaPembayaranController.getTagihan);
router.post('/simulasi', camabaPembayaranController.simulasiBayar);

export default router;

