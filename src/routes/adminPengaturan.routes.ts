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

// Pengaturan Informasi & Berita Portal Camaba (Screenshot 3 Informasi)
router.get('/informasi', optionalAdminAuth, adminPengaturanController.getInformasiList);
router.get('/informasi/:id', optionalAdminAuth, adminPengaturanController.getInformasiDetail);
router.post('/informasi', optionalAdminAuth, adminPengaturanController.createInformasi);
router.put('/informasi/:id', optionalAdminAuth, adminPengaturanController.updateInformasi);
router.patch('/informasi/:id/toggle', optionalAdminAuth, adminPengaturanController.toggleInformasiStatus);
router.delete('/informasi/:id', optionalAdminAuth, adminPengaturanController.deleteInformasi);

export default router;
