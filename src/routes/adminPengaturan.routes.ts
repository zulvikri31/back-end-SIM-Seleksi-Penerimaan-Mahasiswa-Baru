import { Router } from 'express';
import { adminPengaturanController } from '../controllers/adminPengaturan.controller';
import { optionalAdminAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * Routes untuk Modul Pengaturan SPMB UIKA (Screenshot 1 Pengaturan)
 */

// Periode Pendaftaran (Jalur yang dibuka, Gelombang, Biaya, Status)
router.get('/periode-pendaftaran', optionalAdminAuth, adminPengaturanController.getPeriodePendaftaran);
router.post('/periode-pendaftaran', optionalAdminAuth, adminPengaturanController.createPeriodePendaftaran);
router.patch('/periode-pendaftaran/:id/toggle', optionalAdminAuth, adminPengaturanController.toggleStatus);
router.delete('/periode-pendaftaran/:id', optionalAdminAuth, adminPengaturanController.deletePeriodePendaftaran);

// UKT (Uang Kuliah Tunggal)
router.get('/ukt', optionalAdminAuth, adminPengaturanController.getUkt);

// Pengaturan Umum PMB
router.get('/umum', optionalAdminAuth, adminPengaturanController.getUmum);

export default router;
