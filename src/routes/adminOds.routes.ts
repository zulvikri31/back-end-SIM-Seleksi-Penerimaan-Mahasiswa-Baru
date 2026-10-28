import { Router } from 'express';
import { adminOdsController } from '../controllers/adminOds.controller';
import { optionalAdminAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * Routes untuk Modul One Day Service (ODS) SPMB UIKA
 */

// Mengambil statistik ringkasan ODS
router.get('/stats', optionalAdminAuth, adminOdsController.getStats);

// Mengambil list antrean pendaftar ODS dengan filter
router.get('/', optionalAdminAuth, adminOdsController.getList);

// Catat follow up / telepon pendaftar ODS
router.post('/hubungi', optionalAdminAuth, adminOdsController.hubungi);

// Update status tahapan pendaftar ODS (PEMINAT, PENDAFTAR, PESERTA_SELEKSI, DAFTAR_ULANG)
router.post('/update-status', optionalAdminAuth, adminOdsController.updateStatus);

export default router;
