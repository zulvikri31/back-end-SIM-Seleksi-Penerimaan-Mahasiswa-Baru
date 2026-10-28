import { Router } from 'express';
import { adminLaporanController } from '../controllers/adminLaporan.controller';
import { optionalAdminAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * Routes untuk Laporan Admin (Screenshot 4)
 */

// Laporan UKT Pendaftar (Screenshot 4)
router.get('/ukt', optionalAdminAuth, adminLaporanController.getLaporanUkt);

// Laporan Biodata Pendaftar
router.get('/biodata', optionalAdminAuth, adminLaporanController.getLaporanBiodata);

// Laporan Rekapitulasi per Program Studi
router.get('/rekapitulasi', optionalAdminAuth, adminLaporanController.getLaporanRekapitulasi);

export default router;
