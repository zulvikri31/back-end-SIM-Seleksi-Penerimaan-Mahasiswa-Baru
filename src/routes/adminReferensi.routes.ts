import { Router } from 'express';
import { adminReferensiController } from '../controllers/adminReferensi.controller';
import { optionalAdminAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * Routes untuk Menu Referensi Admin (Screenshots 2 & 3)
 */

// Pendaftaran
router.get('/gelombang', optionalAdminAuth, adminReferensiController.getGelombang);
router.get('/jalur-pendaftaran', optionalAdminAuth, adminReferensiController.getJalurPendaftaran);
router.get('/sistem-kuliah', optionalAdminAuth, adminReferensiController.getSistemKuliah);
router.get('/program-studi', optionalAdminAuth, adminReferensiController.getProgramStudi);
router.get('/periode', optionalAdminAuth, adminReferensiController.getPeriode);
router.get('/jenis-program', optionalAdminAuth, adminReferensiController.getJenisProgram);
router.get('/jenis-pendaftaran', optionalAdminAuth, adminReferensiController.getJenisPendaftaran);

// Wilayah
router.get('/wilayah', optionalAdminAuth, adminReferensiController.getWilayah);

// RPL
router.get('/dokumen-rpl', optionalAdminAuth, adminReferensiController.getJenisDokumenRpl);
router.get('/mata-kuliah-rpl', optionalAdminAuth, adminReferensiController.getMataKuliahRpl);

export default router;
