import { Router } from 'express';
import { adminPendaftarController } from '../controllers/adminPendaftar.controller';
import { optionalAdminAuth } from '../middleware/auth.middleware';
import { uploadExcel } from '../middleware/upload.middleware';

const router = Router();

/**
 * Routes untuk Admin Pendaftar & Login As
 */

// Pencarian Pendaftar khusus untuk fitur Login As (Screenshot 5)
// Letakkan sebelum /:id agar tidak tertimpa
router.get('/login-as/search', optionalAdminAuth, adminPendaftarController.searchLoginAs);

// Eksekusi Login As Camaba
router.post('/login-as', optionalAdminAuth, adminPendaftarController.executeLoginAs);

// Seluruh opsi dropdown filter pendaftar (Periode, Gelombang, Jalur, Sistem, Prodi, Status, Kategori Search)
router.get('/dropdown-options', optionalAdminAuth, adminPendaftarController.getDropdownOptions);

// ==========================================
// FITUR-FITUR DROPDOWN "AKSI" (SCREENSHOT 1-5)
// ==========================================

// 1. Review Data Pendaftar (Screenshot 2: Modal Review Data Pendaftaran 15 Status)
router.get('/review-data', optionalAdminAuth, adminPendaftarController.getReviewData);

// 2. Set KIP Kuliah (Screenshot 3: Modal Konfirmasi Set KIP Kuliah All)
router.post('/set-kip', optionalAdminAuth, adminPendaftarController.setKip);

// 3. Set Finalisasi (Screenshot 4: Modal Konfirmasi Set Finalisasi All)
router.post('/set-finalisasi', optionalAdminAuth, adminPendaftarController.setFinalisasi);

// 4a. Download Template Excel untuk Update Data Pendaftar (Screenshot 5: Tombol Download)
router.get('/template/update', optionalAdminAuth, adminPendaftarController.downloadUpdateTemplate);

// 4b. Update Batch Data Pendaftar dari Excel (Screenshot 5: Tombol Update)
router.post('/update-batch-excel', optionalAdminAuth, uploadExcel.single('file'), adminPendaftarController.updateBatchExcel);

// 5. Reset Password Pendaftar (Dropdown Aksi: Reset Password Pendaftar)
router.post('/reset-password', optionalAdminAuth, adminPendaftarController.resetPassword);

// 6a. Download Template Excel untuk Import Pendaftar Baru (Dropdown Aksi: Import)
router.get('/template/import', optionalAdminAuth, adminPendaftarController.downloadImportTemplate);

// 6b. Import Data Pendaftar Baru dari Excel (Dropdown Aksi: Import)
router.post('/import', optionalAdminAuth, uploadExcel.single('file'), adminPendaftarController.importExcel);

// ==========================================
// SUB-MODUL: LEADS MAUKULIAH (Tombol Leads Maukuliah di Halaman Pendaftar)
// Breadcrumb: Pendaftar > Data Pendaftar berasal dari data Leads Maukuliah
// ==========================================
router.get('/leads/dropdown-options', optionalAdminAuth, adminPendaftarController.getLeadsDropdownOptions);
router.get('/leads', optionalAdminAuth, adminPendaftarController.getLeadsList);
router.post('/leads', optionalAdminAuth, adminPendaftarController.createLeads);
router.get('/leads/:id', optionalAdminAuth, adminPendaftarController.getLeadsDetail);
router.post('/leads/:id/hubungi', optionalAdminAuth, adminPendaftarController.hubungiLeads);

// ==========================================
// CRUD PENDAFTAR & BULK DELETE
// ==========================================

// Mengambil list pendaftar dengan 8 filter (Screenshot 1 & Screenshot Pendaftar)
router.get('/', optionalAdminAuth, adminPendaftarController.getList);

// Tambah pendaftar baru oleh admin (Screenshot 2: Tombol + Tambah)
router.post('/', optionalAdminAuth, adminPendaftarController.create);

// Hapus masal (Bulk Delete) saat mencentang checkbox (Screenshot 1 & 3: Tombol Hapus Atas)
router.post('/bulk-delete', optionalAdminAuth, adminPendaftarController.bulkDelete);
router.delete('/', optionalAdminAuth, adminPendaftarController.bulkDelete);

// Detail pendaftar (Mengembalikan 8 + 1 Vertical Tabs lengkap)
router.get('/:id', optionalAdminAuth, adminPendaftarController.getDetail);
router.get('/:id/detail', optionalAdminAuth, adminPendaftarController.getDetail);

// Sub-fitur Vertical Tab 9: Rekam Medis Pendaftar
router.get('/:id/rekam-medis', optionalAdminAuth, adminPendaftarController.getRekamMedis);
router.put('/:id/rekam-medis', optionalAdminAuth, adminPendaftarController.updateRekamMedis);

// Update data spesifik per Vertical Tab (data-pendaftar, keluarga, pendidikan, rekam-medis)
router.put('/:id/tab/:tabName', optionalAdminAuth, adminPendaftarController.updateVerticalTab);

// Update data pendaftar & biodata diri (Screenshot 2: Tombol Simpan)
router.put('/:id', optionalAdminAuth, adminPendaftarController.update);

// Hapus 1 pendaftar via icon tempat sampah di tabel (Screenshot 1 & 3: Tombol Aksi Hapus)
router.delete('/:id', optionalAdminAuth, adminPendaftarController.deletePendaftar);

export default router;
