import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';

// Import sub-modul router modular Camaba
import camabaKatalogRoutes from './camaba/camabaKatalog.routes';
import camabaAuthRoutes from './camaba/camabaAuth.routes';
import camabaBiodataRoutes from './camaba/camabaBiodata.routes';
import camabaRekamMedisRoutes from './camaba/camabaRekamMedis.routes';
import camabaBerkasRoutes from './camaba/camabaBerkas.routes';
import camabaPembayaranRoutes from './camaba/camabaPembayaran.routes';
import camabaSeleksiRoutes from './camaba/camabaSeleksi.routes';

// Import controller untuk backward compatibility flat endpoints
import { camabaKatalogController } from '../controllers/camaba/camabaKatalog.controller';
import { camabaAuthController } from '../controllers/camaba/camabaAuth.controller';
import { camabaBiodataController } from '../controllers/camaba/camabaBiodata.controller';
import { camabaRekamMedisController } from '../controllers/camaba/camabaRekamMedis.controller';

const router = Router();

/* ==========================================================================
   1. MODULAR SUB-ROUTING (Clean Architecture & Scalable ke depan)
   ========================================================================== */
router.use('/katalog', camabaKatalogRoutes);
router.use('/auth', camabaAuthRoutes);
router.use('/biodata', camabaBiodataRoutes);
router.use('/rekam-medis', camabaRekamMedisRoutes);
router.use('/berkas', camabaBerkasRoutes);
router.use('/pembayaran', camabaPembayaranRoutes);
router.use('/seleksi', camabaSeleksiRoutes);

/* ==========================================================================
   2. FLAT LEGACY ENDPOINTS (100% Backward Compatible untuk Front-End & Postman)
   ========================================================================== */
// Data Master & Katalog Publik
router.get('/jenjang', camabaKatalogController.getJenjang);
router.get('/sistem-kuliah', camabaKatalogController.getSistemKuliah);
router.get('/program-studi', camabaKatalogController.getProgramStudi);
router.get('/program-studi/:id', camabaKatalogController.getProgramStudiDetail);
router.get('/jalur-pendaftaran', camabaKatalogController.getJalurPendaftaran);
router.get('/jalur', camabaKatalogController.getJalurPendaftaran);
router.get('/jalur-pendaftaran/:id', camabaKatalogController.getJalurPendaftaranDetail);
router.get('/jalur/:id', camabaKatalogController.getJalurPendaftaranDetail);
router.get('/informasi', camabaKatalogController.getInformasi);
router.get('/informasi/:id', camabaKatalogController.getInformasiDetail);
router.get('/brosur', camabaKatalogController.getBrosur);

// Registrasi Akun Camaba
router.post('/daftar', camabaAuthController.daftarJalur);

// Status & Biodata Pendaftar (Memerlukan Login / Bearer Token)
router.get('/status', verifyToken, camabaBiodataController.getStatusPendaftaran);
router.get('/biodata', verifyToken, camabaBiodataController.getBiodataDetail);
router.put('/biodata', verifyToken, camabaBiodataController.updateBiodata);

// Rekam Medis Camaba (Memerlukan Login / Bearer Token)
router.get('/rekam-medis', verifyToken, camabaRekamMedisController.getRekamMedis);
router.put('/rekam-medis', verifyToken, camabaRekamMedisController.updateRekamMedis);

export default router;
