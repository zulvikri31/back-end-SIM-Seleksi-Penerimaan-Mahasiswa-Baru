import 'dotenv/config';
import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 [SERVER] REST API aktif di http://localhost:${PORT}`);
  console.log(`📡 [INFO]   Cek Status Server: http://localhost:${PORT}/`);
  console.log(`🔐 [AUTH]   Endpoint Login: http://localhost:${PORT}/api/auth/login`);
  console.log(`📮 [API]    Seluruh endpoint siap diakses via Postman atau Front-End`);
});
