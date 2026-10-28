import 'dotenv/config';
import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 [SERVER] API berjalan di http://localhost:${PORT}`);
  console.log(`🎓 [CAMABA] Portal Calon Mahasiswa Baru: http://localhost:${PORT}/ (atau /camaba)`);
  console.log(`📊 [ADMIN]  Dashboard Admin PMB: http://localhost:${PORT}/admin`);
  console.log(`📡 [API]    Endpoint Camaba: http://localhost:${PORT}/api/camaba`);
  console.log(`🔐 [AUTH]   Endpoint Auth: http://localhost:${PORT}/api/auth/register & /api/auth/login`);
});
