import { Router } from 'express';
import { camabaKatalogController } from '../../controllers/camaba/camabaKatalog.controller';

const router = Router();

// Master Jenjang & Sistem Kuliah
router.get('/jenjang', camabaKatalogController.getJenjang);
router.get('/sistem-kuliah', camabaKatalogController.getSistemKuliah);

// Program Studi
router.get('/program-studi', camabaKatalogController.getProgramStudi);
router.get('/program-studi/:id', camabaKatalogController.getProgramStudiDetail);

// Jalur Pendaftaran
router.get('/jalur-pendaftaran', camabaKatalogController.getJalurPendaftaran);
router.get('/jalur', camabaKatalogController.getJalurPendaftaran);
router.get('/jalur-pendaftaran/:id', camabaKatalogController.getJalurPendaftaranDetail);
router.get('/jalur/:id', camabaKatalogController.getJalurPendaftaranDetail);

// Informasi, Berita, & Brosur
router.get('/informasi', camabaKatalogController.getInformasi);
router.get('/informasi/:id', camabaKatalogController.getInformasiDetail);
router.get('/brosur', camabaKatalogController.getBrosur);

export default router;

