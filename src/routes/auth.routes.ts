import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// Route untuk registrasi calon mahasiswa baru (CAMABA)
router.post('/register', authController.register);

// Route untuk login akun (CAMABA & ADMIN)
router.post('/login', authController.login);

// Route untuk cek profil user yang sedang login (membutuhkan Bearer Token)
router.get('/me', verifyToken, authController.getProfile);

export default router;
