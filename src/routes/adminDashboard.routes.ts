import { Router } from 'express';
import { adminDashboardController } from '../controllers/adminDashboard.controller';
import { optionalAdminAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/admin/dashboard/charts
 * @desc    Mengambil seluruh data grafik siap pakai untuk Dashboard Admin:
 *          1. Grafik Frekuensi Bulanan (Pendaftar, Finalisasi, Lulus, Daftar Ulang)
 *          2. Sumber Trafik Pendaftar (Instagram, Website UIKA, Guru BK, dll.)
 *          3. Funnel 8 Tahapan (Peminat -> Generate NIM)
 *          4. Pie Chart Jenis Kelamin (Laki-laki / Perempuan)
 *          5. Pie Chart Tahun Lulus (2026, 2025, dst.)
 *          6. Pie Chart Jenis Pendidikan (SMA, SMK, MA)
 *          7. Pie Chart Jurusan Pendidikan (IPA, IPS, RPL, TKJ, Akuntansi, dll.)
 * @query   periodeId (opsional), kodePeriode (opsional), tahun (opsional)
 */
// Endpoint utama Dashboard Admin (mendukung GET / dan GET /charts)
router.get('/', optionalAdminAuth, adminDashboardController.getCharts);
router.get('/charts', optionalAdminAuth, adminDashboardController.getCharts);

// Endpoint ringkasan KPI statistik (bisa diakses via /summary atau /stats)
router.get('/summary', optionalAdminAuth, adminDashboardController.getSummary);
router.get('/stats', optionalAdminAuth, adminDashboardController.getSummary);

export default router;

