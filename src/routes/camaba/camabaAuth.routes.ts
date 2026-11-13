import { Router } from 'express';
import { camabaAuthController } from '../../controllers/camaba/camabaAuth.controller';
import { verifyToken } from '../../middleware/auth.middleware';

const router = Router();

// Pendaftaran akun baru & pilih jalur
router.post('/daftar', camabaAuthController.daftarJalur);

// Info profil akun camaba yang sedang login
router.get('/me', verifyToken, camabaAuthController.getMe);

export default router;

