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
import path from 'path';

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Endpoint utama / Health check API
app.get('/api', (req: Request, res: Response) => {
  res.json({
    app: 'API SIM PMB Universitas Ibn Khaldun Bogor',
    status: 'Aktif',
    version: '1.0.0 (TypeScript)',
    message: 'Server backend berjalan dengan baik.',
    endpoints: {
      camaba: '/api/camaba',
      auth: '/api/auth',
      adminDashboard: '/api/admin/dashboard',
      adminPendaftar: '/api/admin/pendaftar',
      adminOds: '/api/admin/ods',
      adminPengaturan: '/api/admin/pengaturan',
      adminSeleksi: '/api/admin/seleksi',
      adminKelulusan: '/api/admin/kelulusan',
      adminReferensi: '/api/admin/referensi',
      adminLaporan: '/api/admin/laporan',
      loginAs: '/api/admin/pendaftar/login-as',
    },
  });
});

// Portal Camaba direct route
app.get('/camaba', (req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'public', 'camaba.html'));
});

// Admin Dashboard direct route
app.get('/admin', (req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'public', 'preview.html'));
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/camaba', camabaRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/pendaftar', adminPendaftarRoutes);
app.use('/api/admin/ods', adminOdsRoutes);
app.use('/api/admin/pengaturan', adminPengaturanRoutes);
app.use('/api/admin/seleksi', adminSeleksiRoutes);
app.use('/api/admin/kelulusan', adminKelulusanRoutes);
app.use('/api/admin/referensi', adminReferensiRoutes);
app.use('/api/admin/laporan', adminLaporanRoutes);


// 404 Handler untuk route yang tidak ditemukan
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} tidak ditemukan.`,
  });
});

export default app;
