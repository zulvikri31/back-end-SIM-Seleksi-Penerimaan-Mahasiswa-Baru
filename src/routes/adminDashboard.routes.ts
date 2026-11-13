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

// Dropdown Hierarki Unit / Program Studi (Screenshot 1: Tree Checkbox)
router.get('/unit-tree', optionalAdminAuth, adminDashboardController.getUnitTree);

// Opsi Filter Lanjutan untuk Modal (Screenshot 2)
router.get('/filter-options', optionalAdminAuth, adminDashboardController.getFilterOptions);

// Endpoint ringkasan KPI statistik (bisa diakses via /summary atau /stats)
router.get('/summary', optionalAdminAuth, adminDashboardController.getSummary);
router.get('/stats', optionalAdminAuth, adminDashboardController.getSummary);

// Tab 3: Funnel Pendaftaran Tree (Universitas -> Fakultas -> Prodi)
router.get('/funnel-pendaftaran', optionalAdminAuth, adminDashboardController.getFunnelPendaftaran);

// Tab 4: Funnel Bulanan Tree (Jan - Des)
router.get('/funnel-bulanan', optionalAdminAuth, adminDashboardController.getFunnelBulanan);

// Tab 5: Mahasiswa Baru Komparasi Multi-Tahun (2023 - 2027)
router.get('/mahasiswa-tahunan', optionalAdminAuth, adminDashboardController.getMahasiswaTahunan);
router.get('/mahasiswa', optionalAdminAuth, adminDashboardController.getMahasiswaTahunan);

// Tab 6: Wilayah (Tabel & Peta Leaflet Screenshot 7)
router.get('/wilayah', optionalAdminAuth, adminDashboardController.getWilayah);
router.get('/wilayah/peta', optionalAdminAuth, adminDashboardController.getPetaWilayah);
router.get('/peta-wilayah', optionalAdminAuth, adminDashboardController.getPetaWilayah);

// Tab 7: Sekolah (Nama Sekolah Asal & Kota)
router.get('/sekolah', optionalAdminAuth, adminDashboardController.getSekolah);

// Tab Pelengkap: Perguruan Tinggi, Perusahaan, Seleksi, Kuesioner, Orang Tua
router.get('/perguruan-tinggi', optionalAdminAuth, adminDashboardController.getPerguruanTinggi);
router.get('/perusahaan', optionalAdminAuth, adminDashboardController.getPerusahaan);
router.get('/seleksi', optionalAdminAuth, adminDashboardController.getSeleksi);
router.get('/kuesioner', optionalAdminAuth, adminDashboardController.getKuesioner);
router.get('/orang-tua', optionalAdminAuth, adminDashboardController.getOrangTua);

export default router;

