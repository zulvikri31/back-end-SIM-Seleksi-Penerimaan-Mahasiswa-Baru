import { Router } from 'express';
import { adminOdsController } from '../controllers/adminOds.controller';
import { optionalAdminAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * Routes untuk Modul One Day Service (ODS) SPMB UIKA
 */

// 1. Mengambil statistik ringkasan ODS
router.get('/stats', optionalAdminAuth, adminOdsController.getStats);

// 2. Mengambil list antrean pendaftar ODS dengan filter (sesuai tabel screenshot)
router.get('/', optionalAdminAuth, adminOdsController.getList);

// 3. Mengambil detail berkas pendaftar untuk Modal "Informasi Pendaftar [Berkas Perlu Diverifikasi]"
router.get('/pendaftar/:id/verifikasi-berkas', optionalAdminAuth, adminOdsController.getDetailVerifikasiBerkas);
router.get('/verifikasi-berkas/:id', optionalAdminAuth, adminOdsController.getDetailVerifikasiBerkas);

// 4. Verifikasi berkas (Tombol "Simpan" & "Simpan & Kirim Notifikasi") - memicu notifikasi WA otomatis
router.post('/verifikasi-berkas', optionalAdminAuth, adminOdsController.verifikasiBerkas);

// 5. Follow    -up Calon Mahasiswa yang Belum Finalisasi (Tombol "Hubungi Pendaftar")
router.post('/hubungi-belum-finalisasi', optionalAdminAuth, adminOdsController.hubungiBelumFinalisasi);

// 6. Modal Set Kelulusan Peserta Seleksi ODS (Informasi Pendaftar [Pengumuman Kelulusan])
router.get('/set-kelulusan/:id', optionalAdminAuth, adminOdsController.getDetailKelulusanModal);
router.post('/set-kelulusan', optionalAdminAuth, adminOdsController.setKelulusan);

// 7. Modal Masukkan Nilai Peserta Seleksi ODS (Informasi Pendaftar [Proses Seleksi])
router.get('/proses-seleksi/:id', optionalAdminAuth, adminOdsController.getDetailProsesSeleksiModal);
router.post('/simpan-nilai', optionalAdminAuth, adminOdsController.simpanNilaiSeleksi);

// 8. Halaman Detail Pendaftar ODS (Biodata, Berkas, Seleksi, Pembayaran, Daftar Ulang)
router.get('/detail-pendaftar/:id', optionalAdminAuth, adminOdsController.getDetailPendaftarOds);
router.get('/detail/:id', optionalAdminAuth, adminOdsController.getDetailPendaftarOds);
router.get('/ods_biodata/detail/:id', optionalAdminAuth, adminOdsController.getDetailPendaftarOds);

// 9. Preview isi template pesan WhatsApp berkas ODS
router.get('/preview-wa/:id', optionalAdminAuth, adminOdsController.previewWaNotifikasi);

// 10. Catat follow up / telepon pendaftar ODS
router.post('/hubungi', optionalAdminAuth, adminOdsController.hubungi);

// 11. Update status tahapan pendaftar ODS (PEMINAT, PENDAFTAR, PESERTA_SELEKSI, DAFTAR_ULANG)
router.post('/update-status', optionalAdminAuth, adminOdsController.updateStatus);

export default router;
