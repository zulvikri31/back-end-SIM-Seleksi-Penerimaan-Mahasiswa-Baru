import { Router } from 'express';
import { adminSeleksiController } from '../controllers/adminSeleksi.controller';
import { optionalAdminAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * Routes untuk Modul Seleksi SPMB UIKA (Screenshot 2 Seleksi)
 */

// 1. Syarat Seleksi & Verifikasi Dokumen
router.get('/syarat-seleksi', optionalAdminAuth, adminSeleksiController.getSyaratSeleksi);
router.post('/verifikasi-berkas', optionalAdminAuth, adminSeleksiController.verifikasiBerkas);

// 2. Pengisian & Generate Nilai Seleksi
router.post('/input-nilai', optionalAdminAuth, adminSeleksiController.inputNilai);
router.post('/generate-nilai', optionalAdminAuth, adminSeleksiController.generateNilai);
router.post('/batal-nilai', optionalAdminAuth, adminSeleksiController.batalNilai);

// 3. KIP Kuliah
router.get('/kip-kuliah', optionalAdminAuth, adminSeleksiController.getKipKuliah);

export default router;
