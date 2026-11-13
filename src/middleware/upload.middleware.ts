import multer from 'multer';

// Menggunakan memoryStorage agar buffer file langsung bisa diproses (xlsx atau cloud/base64) tanpa simpan file sampah ke disk
const storage = multer.memoryStorage();

// Middleware upload untuk file Excel / CSV (Admin Pendaftar Import & Update Batch)
export const uploadExcel = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Maksimal 5 MB sesuai keterangan pada Modal UI (maxsize: 5 MB)
  },
  fileFilter: (req, file, cb) => {
    const isExcelOrCsv =
      file.mimetype.includes('excel') ||
      file.mimetype.includes('spreadsheetml') ||
      file.mimetype.includes('csv') ||
      file.originalname.match(/\.(xlsx|xls|csv)$/i);

    if (isExcelOrCsv) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Harap upload file .xlsx atau .xls (Maks 5 MB).'));
    }
  },
});

// Middleware upload untuk Dokumen Persyaratan Camaba (PDF, JPG, PNG)
export const uploadDocument = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Maksimal 5 MB
  },
  fileFilter: (req, file, cb) => {
    const isAllowed =
      file.mimetype.includes('pdf') ||
      file.mimetype.includes('image/jpeg') ||
      file.mimetype.includes('image/png') ||
      file.mimetype.includes('image/jpg') ||
      file.originalname.match(/\.(pdf|jpg|jpeg|png)$/i);

    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Harap upload file PDF, JPG, atau PNG (Maks 5 MB).'));
    }
  },
});
