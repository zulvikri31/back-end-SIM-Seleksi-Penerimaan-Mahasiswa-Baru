import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import adminDashboardRoutes from './routes/adminDashboard.routes';
import adminPendaftarRoutes from './routes/adminPendaftar.routes';
import adminKelulusanRoutes from './routes/adminKelulusan.routes';
import adminReferensiRoutes from './routes/adminReferensi.routes';
import adminLaporanRoutes from './routes/adminLaporan.routes';
import adminOdsRoutes from './routes/adminOds.routes';
import adminPengaturanRoutes from './routes/adminPengaturan.routes';
import adminSeleksiRoutes from './routes/adminSeleksi.routes';
import camabaRoutes from './routes/camaba.routes';

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint Utama / Health Check REST API (Mengembalikan respon JSON murni)
const apiInfoHandler = (req: Request, res: Response) => {
  res.json({
    app: 'SIM Seleksi Penerimaan Mahasiswa Baru (SPMB) - UIKA Bogor',
    type: 'REST API Server (Pure Backend)',
    status: 'Online',
    version: '1.0.0 (TypeScript)',
    message: 'Backend server berjalan dengan baik. Silakan gunakan Postman atau aplikasi Front-End untuk mengakses endpoint data.',
    modules: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/me',
      },
      camaba: {
        modularArchitecture: 'Clean & Scalable Domain-Driven Architecture (7 Sub-Modules)',
        katalog: 'GET /api/camaba/katalog/program-studi, /jalur, /informasi, /brosur',
        auth: 'POST /api/camaba/auth/daftar, GET /api/camaba/auth/me',
        biodata: 'GET /api/camaba/biodata/status, PUT /api/camaba/biodata, POST /api/camaba/biodata/finalisasi',
        rekamMedis: 'GET & PUT /api/camaba/rekam-medis (Kuesioner G-Form)',
        berkas: 'GET /api/camaba/berkas, POST /api/camaba/berkas/upload (Multer 5MB), DELETE /api/camaba/berkas/:id',
        pembayaran: 'GET /api/camaba/pembayaran/tagihan, POST /api/camaba/pembayaran/simulasi',
        seleksi: 'GET /api/camaba/seleksi/kartu-ujian, GET /api/camaba/seleksi/hasil',
        legacyFlatEndpoints: 'All old endpoints (/status, /biodata, /jalur, dll.) 100% backward-compatible',
      },
      admin: {
        dashboard: {
          kpiSummary: 'GET /api/admin/dashboard/summary (4 Kartu Utama: Peminat, Pendaftar, Lulus, Daftar Ulang)',
          analyticsCharts: 'GET /api/admin/dashboard/charts (8 Seksi Visual: Funnel, Donut, Line, 5 Pie, Bar PT/Kerja, Peta, Tabel)',
          filters: 'GET /api/admin/dashboard/filter-options & /unit-tree (Multi-select Checkbox & Modal Filter)',
          tabs: 'GET /api/admin/dashboard/funnel-pendaftaran, /funnel-bulanan, /mahasiswa-tahunan, /wilayah, /wilayah/peta, /sekolah, /perguruan-tinggi, /perusahaan, /seleksi, /kuesioner, /orang-tua',
        },
        pendaftar: 'GET /api/admin/pendaftar (Termasuk Leads Maukuliah: /api/admin/pendaftar/leads)',
        loginAs: 'POST /api/admin/pendaftar/login-as',
        oneDayService: 'GET /api/admin/ods & /stats',
        pengaturan: 'GET /api/admin/pengaturan/periode-pendaftaran',
        seleksi: 'GET /api/admin/seleksi/syarat-seleksi & /input-nilai',
        kelulusan: 'GET /api/admin/kelulusan/rekomendasi-prodi & /tetapkan',
        referensi: 'GET /api/admin/referensi/gelombang & /wilayah',
        laporanUkt: 'GET /api/admin/laporan/ukt',
      },
    },
  });
};

app.get('/', apiInfoHandler);
app.get('/api', apiInfoHandler);

// API Routes (1 Modul = 1 File Route)
app.use('/api/auth', authRoutes);
app.use('/api/camaba', camabaRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/pendaftar', adminPendaftarRoutes);

// Backward-compatible alias untuk Leads Maukuliah (baik /api/admin/pendaftar/leads maupun /api/admin/leads)
app.use('/api/admin/leads', (req: Request, res: Response, next: any) => {
  req.url = '/leads' + (req.url === '/' ? '' : req.url);
  adminPendaftarRoutes(req, res, next);
});
app.use('/api/admin/leads-maukuliah', (req: Request, res: Response, next: any) => {
  req.url = '/leads' + (req.url === '/' ? '' : req.url);
  adminPendaftarRoutes(req, res, next);
});

app.use('/api/admin/ods', adminOdsRoutes);
app.use('/api/admin/pengaturan', adminPengaturanRoutes);
app.use('/api/admin/informasi', (req: Request, res: Response, next: any) => {
  req.url = '/informasi' + (req.url === '/' ? '' : req.url);
  adminPengaturanRoutes(req, res, next);
});
app.use('/api/admin/seleksi', adminSeleksiRoutes);
app.use('/api/admin/kelulusan', adminKelulusanRoutes);
app.use('/api/admin/referensi', adminReferensiRoutes);
app.use('/api/admin/laporan', adminLaporanRoutes);

// 404 Handler untuk route yang tidak ditemukan (Respon JSON)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan di server backend.`,
  });
});

// Global Error Handler agar server tidak crash jika ada kesalahan tak terduga
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('[SERVER ERROR]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada server backend.',
  });
});

export default app;
