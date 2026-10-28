import { Router } from 'express';
import { adminPendaftarController } from '../controllers/adminPendaftar.controller';
import { optionalAdminAuth } from '../middleware/auth.middleware';

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

// Mengambil list pendaftar dengan 8 filter (Screenshot 1 & Screenshot Pendaftar)
router.get('/', optionalAdminAuth, adminPendaftarController.getList);

// Detail pendaftar
router.get('/:id', optionalAdminAuth, adminPendaftarController.getDetail);

// Hapus pendaftar
router.delete('/:id', optionalAdminAuth, adminPendaftarController.deletePendaftar);

export default router;
