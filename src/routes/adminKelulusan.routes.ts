import { Router } from 'express';
import { adminKelulusanController } from '../controllers/adminKelulusan.controller';
import { optionalAdminAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * Routes Modul Kelulusan Admin (Screenshot 1)
 */

// 1. Rekomendasi Prodi
router.get('/rekomendasi-prodi', optionalAdminAuth, adminKelulusanController.getRekomendasiProdi);
router.post('/tetapkan', optionalAdminAuth, adminKelulusanController.tetapkan);
router.post('/kirim-email', optionalAdminAuth, adminKelulusanController.kirimEmail);

// 2. Registrasi Ulang
router.get('/registrasi-ulang', optionalAdminAuth, adminKelulusanController.getRegistrasiUlang);
router.post('/registrasi-ulang/update', optionalAdminAuth, adminKelulusanController.updateRegistrasiUlang);

// 3. Generate Mahasiswa / NIM
router.post('/generate-nim', optionalAdminAuth, adminKelulusanController.generateNim);

// 4. Pembatalan NIM
router.post('/batalkan-nim', optionalAdminAuth, adminKelulusanController.batalkanNim);

export default router;
