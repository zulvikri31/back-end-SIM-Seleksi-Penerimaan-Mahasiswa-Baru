import { Router } from 'express';
import { camabaController } from '../controllers/camaba.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// 1. Data Master & Filter Publik untuk Portal Camaba
router.get('/jenjang', camabaController.getJenjang);
router.get('/sistem-kuliah', camabaController.getSistemKuliah);
router.get('/program-studi', camabaController.getProgramStudi);
router.get('/program-studi/:id', camabaController.getProgramStudiDetail);

// 2. Jalur Pendaftaran
router.get('/jalur-pendaftaran', camabaController.getJalurPendaftaran);
router.get('/jalur', camabaController.getJalurPendaftaran);
router.get('/jalur-pendaftaran/:id', camabaController.getJalurPendaftaranDetail);
router.get('/jalur/:id', camabaController.getJalurPendaftaranDetail);

// 3. Informasi & Brosur
router.get('/informasi', camabaController.getInformasi);
router.get('/informasi/:id', camabaController.getInformasiDetail);
router.get('/brosur', camabaController.getBrosur);

// 4. Pendaftaran Online Akun & Jalur Camaba
router.post('/daftar', camabaController.daftarJalur);

// 5. Dashboard Pendaftaran Camaba (Memerlukan Login / Bearer Token)
router.get('/status', verifyToken, camabaController.getStatusPendaftaran);
router.get('/biodata', verifyToken, camabaController.getStatusPendaftaran);
router.put('/biodata', verifyToken, camabaController.updateBiodata);

// 6. Rekam Medis Camaba (Memerlukan Login / Bearer Token)
router.get('/rekam-medis', verifyToken, camabaController.getRekamMedis);
router.put('/rekam-medis', verifyToken, camabaController.updateRekamMedis);

export default router;
