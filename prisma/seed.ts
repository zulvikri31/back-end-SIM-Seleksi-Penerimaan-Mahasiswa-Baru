import prisma from '../src/config/database';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Memulai proses seeding data komprehensif PMB UIKA...');

  // 1. Akun Admin Default
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@uika-bogor.ac.id' },
    update: {},
    create: {
      nama: 'Admin PMB UIKA',
      email: 'admin@uika-bogor.ac.id',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('✔ Akun Admin siap:', admin.email);

  // 2. Data Master Periode
  const periodeList = [
    { kode: '20272', nama: '2027 Genap' },
    { kode: '20271', nama: '2027 Ganjil' },
    { kode: '20262', nama: '2026 Genap' },
    { kode: '20261', nama: '2026 Ganjil' },
    { kode: '20252', nama: '2025 Genap' },
    { kode: '20251', nama: '2025 Ganjil' },
    { kode: '20242', nama: '2024 Genap' },
    { kode: '20241', nama: '2024 Ganjil' },
    { kode: '20232', nama: '2023 Genap' },
    { kode: '20231', nama: '2023 Ganjil' },
  ];
  for (const p of periodeList) {
    await prisma.periode.upsert({
      where: { kode: p.kode },
      update: { nama: p.nama },
      create: p,
    });
  }

  // 3. Data Master Gelombang (Screenshot 2: Gelombang 1 s.d. 3, KIP A, B, C)
  const gelombangNames = ['Gelombang 1', 'Gelombang 2', 'Gelombang 3', 'KIP A', 'KIP B', 'KIP C'];
  for (const name of gelombangNames) {
    const existing = await prisma.gelombang.findFirst({ where: { nama: name } });
    if (!existing) {
      await prisma.gelombang.create({ data: { nama: name } });
    }
  }

  // 4. Data Master Jalur Pendaftaran
  const jalurNames = [
    { nama: 'SBMPTN', deskripsi: 'Seleksi Bersama Masuk Perguruan Tinggi Negeri / Swasta' },
    { nama: 'BEASISWA KIP', deskripsi: 'Jalur Beasiswa Kartu Indonesia Pintar Kuliah' },
    { nama: 'Mandiri Reguler', deskripsi: 'Jalur Tes Mandiri Komputer (CBT)' },
    { nama: 'Beasiswa Prestasi', deskripsi: 'Jalur Prestasi Akademik dan Non-Akademik' },
    { nama: 'RPL (Rekognisi Pembelajaran Lampau)', deskripsi: 'Penyetaraan capaian pembelajaran dari pengalaman kerja' },
  ];
  for (const j of jalurNames) {
    const existing = await prisma.jalurPendaftaran.findFirst({ where: { nama: j.nama } });
    if (!existing) {
      await prisma.jalurPendaftaran.create({ data: j });
    }
  }

  // 5. Data Master Sistem Kuliah
  const sistemNames = ['Reguler', 'Reguler Pagi', 'Kelas Karyawan', 'Eksekutif'];
  for (const s of sistemNames) {
    const existing = await prisma.sistemKuliah.findFirst({ where: { nama: s } });
    if (!existing) {
      await prisma.sistemKuliah.create({ data: { nama: s } });
    }
  }

  // 6. Data Master Program Studi Resmi Universitas Ibn Khaldun (UIKA) Bogor
  const prodiList = [
    // 1. D4 (Sarjana Terapan) - FEB
    { namaProdi: 'Perbankan dan Keuangan Digital (Sarjana Terapan)', jenjang: 'D4', fakultas: 'Fakultas Ekonomi dan Bisnis', akreditasi: 'Baik', biayaKuliah: 4200000 },

    // 2. S1 - Fakultas Agama Islam (FAI)
    { namaProdi: 'Pendidikan Agama Islam', jenjang: 'S1', fakultas: 'Fakultas Agama Islam', akreditasi: 'Unggul', biayaKuliah: 4000000 },
    { namaProdi: 'Hukum Keluarga Islam', jenjang: 'S1', fakultas: 'Fakultas Agama Islam', akreditasi: 'A', biayaKuliah: 3800000 },
    { namaProdi: 'Ekonomi Syariah', jenjang: 'S1', fakultas: 'Fakultas Agama Islam', akreditasi: 'Unggul', biayaKuliah: 4200000 },
    { namaProdi: 'Komunikasi dan Penyiaran Islam', jenjang: 'S1', fakultas: 'Fakultas Agama Islam', akreditasi: 'A', biayaKuliah: 3900000 },
    { namaProdi: 'Pendidikan Guru Madrasah Ibtidaiyah', jenjang: 'S1', fakultas: 'Fakultas Agama Islam', akreditasi: 'A', biayaKuliah: 3900000 },
    { namaProdi: 'Bimbingan dan Konseling Pendidikan Islam', jenjang: 'S1', fakultas: 'Fakultas Agama Islam', akreditasi: 'Baik Sekali', biayaKuliah: 3800000 },
    { namaProdi: 'Manajemen Haji dan Umrah', jenjang: 'S1', fakultas: 'Fakultas Agama Islam', akreditasi: 'Baik', biayaKuliah: 4000000 },
    { namaProdi: 'Ilmu Al-Qur\'an dan Tafsir', jenjang: 'S1', fakultas: 'Fakultas Agama Islam', akreditasi: 'Baik Sekali', biayaKuliah: 3800000 },

    // 3. S1 - Fakultas Ekonomi dan Bisnis (FEB)
    { namaProdi: 'Manajemen', jenjang: 'S1', fakultas: 'Fakultas Ekonomi dan Bisnis', akreditasi: 'Unggul', biayaKuliah: 5000000 },
    { namaProdi: 'Akuntansi', jenjang: 'S1', fakultas: 'Fakultas Ekonomi dan Bisnis', akreditasi: 'Unggul', biayaKuliah: 4800000 },
    { namaProdi: 'Bisnis Digital', jenjang: 'S1', fakultas: 'Fakultas Ekonomi dan Bisnis', akreditasi: 'Baik Sekali', biayaKuliah: 5200000 },
    { namaProdi: 'Perdagangan Internasional', jenjang: 'S1', fakultas: 'Fakultas Ekonomi dan Bisnis', akreditasi: 'Baik', biayaKuliah: 4800000 },

    // 4. S1 - Fakultas Teknik dan Sains (FTS)
    { namaProdi: 'Teknik Sipil', jenjang: 'S1', fakultas: 'Fakultas Teknik dan Sains', akreditasi: 'A', biayaKuliah: 5200000 },
    { namaProdi: 'Teknik Mesin', jenjang: 'S1', fakultas: 'Fakultas Teknik dan Sains', akreditasi: 'A', biayaKuliah: 5200000 },
    { namaProdi: 'Teknik Elektro', jenjang: 'S1', fakultas: 'Fakultas Teknik dan Sains', akreditasi: 'Baik Sekali', biayaKuliah: 5200000 },
    { namaProdi: 'Teknik Informatika', jenjang: 'S1', fakultas: 'Fakultas Teknik dan Sains', akreditasi: 'Unggul', biayaKuliah: 5500000 },
    { namaProdi: 'Sistem Informasi', jenjang: 'S1', fakultas: 'Fakultas Teknik dan Sains', akreditasi: 'Baik Sekali', biayaKuliah: 5200000 },
    { namaProdi: 'Rekayasa Pertanian dan Biosistem', jenjang: 'S1', fakultas: 'Fakultas Teknik dan Sains', akreditasi: 'Baik', biayaKuliah: 4600000 },
    { namaProdi: 'Ilmu Lingkungan', jenjang: 'S1', fakultas: 'Fakultas Teknik dan Sains', akreditasi: 'Baik', biayaKuliah: 4600000 },

    // 5. S1 & Profesi - Fakultas Keguruan dan Ilmu Pendidikan (FKIP)
    { namaProdi: 'Teknologi Pendidikan', jenjang: 'S1', fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', akreditasi: 'A', biayaKuliah: 4500000 },
    { namaProdi: 'Pendidikan Masyarakat', jenjang: 'S1', fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', akreditasi: 'A', biayaKuliah: 4000000 },
    { namaProdi: 'Pendidikan Bahasa Inggris', jenjang: 'S1', fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', akreditasi: 'Unggul', biayaKuliah: 4300000 },
    { namaProdi: 'Pendidikan Matematika', jenjang: 'S1', fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', akreditasi: 'A', biayaKuliah: 4200000 },
    { namaProdi: 'Pendidikan Vokasional Desain Fashion', jenjang: 'S1', fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', akreditasi: 'Baik Sekali', biayaKuliah: 4800000 },
    { namaProdi: 'Pendidikan Profesi Guru', jenjang: 'Prof', fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', akreditasi: 'Unggul', biayaKuliah: 5000000 },

    // 6. S1 & S2 - Fakultas Hukum (FH)
    { namaProdi: 'Ilmu Hukum', jenjang: 'S1', fakultas: 'Fakultas Hukum', akreditasi: 'Unggul', biayaKuliah: 4800000 },
    { namaProdi: 'Hukum Bisnis (S2)', jenjang: 'S2', fakultas: 'Fakultas Hukum', akreditasi: 'Unggul', biayaKuliah: 7500000 },

    // 7. S1 - Fakultas Ilmu Kesehatan (FIKES)
    { namaProdi: 'Kesehatan Masyarakat', jenjang: 'S1', fakultas: 'Fakultas Ilmu Kesehatan', akreditasi: 'A', biayaKuliah: 4800000 },
    { namaProdi: 'Gizi', jenjang: 'S1', fakultas: 'Fakultas Ilmu Kesehatan', akreditasi: 'Baik Sekali', biayaKuliah: 5000000 },

    // 8. Pascasarjana (S2 & S3)
    { namaProdi: 'Magister Pendidikan Agama Islam', jenjang: 'S2', fakultas: 'Fakultas Agama Islam', akreditasi: 'Unggul', biayaKuliah: 7000000 },
    { namaProdi: 'Magister Ekonomi Syariah', jenjang: 'S2', fakultas: 'Fakultas Agama Islam', akreditasi: 'Unggul', biayaKuliah: 7200000 },
    { namaProdi: 'Magister Komunikasi dan Penyiaran Islam', jenjang: 'S2', fakultas: 'Fakultas Agama Islam', akreditasi: 'Baik Sekali', biayaKuliah: 7000000 },
    { namaProdi: 'Magister Teknologi Pendidikan', jenjang: 'S2', fakultas: 'Sekolah Pascasarjana', akreditasi: 'Unggul', biayaKuliah: 7500000 },
    { namaProdi: 'Magister Manajemen', jenjang: 'S2', fakultas: 'Sekolah Pascasarjana', akreditasi: 'Baik Sekali', biayaKuliah: 8000000 },
    { namaProdi: 'Doktor Pendidikan Agama Islam', jenjang: 'S3', fakultas: 'Sekolah Pascasarjana', akreditasi: 'Unggul', biayaKuliah: 12000000 },
    { namaProdi: 'Doktor Ekonomi Syariah', jenjang: 'S3', fakultas: 'Sekolah Pascasarjana', akreditasi: 'Unggul', biayaKuliah: 12500000 },
  ];

  for (const pr of prodiList) {
    const existing = await prisma.programStudi.findFirst({ where: { namaProdi: pr.namaProdi, jenjang: pr.jenjang } });
    if (!existing) {
      await prisma.programStudi.create({ data: pr });
    } else {
      await prisma.programStudi.update({
        where: { id: existing.id },
        data: { fakultas: pr.fakultas, akreditasi: pr.akreditasi, biayaKuliah: pr.biayaKuliah },
      });
    }
  }

  // Ambil referensi master yang baru dibuat
  const pPeriodeGenap = await prisma.periode.findUnique({ where: { kode: '20262' } });
  const pPeriodeGanjil25 = await prisma.periode.findUnique({ where: { kode: '20251' } });
  const gGel1 = await prisma.gelombang.findFirst({ where: { nama: 'Gelombang 1' } });
  const gGel2 = await prisma.gelombang.findFirst({ where: { nama: 'Gelombang 2' } });
  const jSbmptn = await prisma.jalurPendaftaran.findFirst({ where: { nama: 'SBMPTN' } });
  const jKip = await prisma.jalurPendaftaran.findFirst({ where: { nama: 'BEASISWA KIP' } });
  const jReg = await prisma.jalurPendaftaran.findFirst({ where: { nama: 'Mandiri Reguler' } });
  const sReguler = await prisma.sistemKuliah.findFirst({ where: { nama: 'Reguler' } });

  const prodiTekPen = await prisma.programStudi.findFirst({ where: { namaProdi: 'Teknologi Pendidikan' } });
  const prodiManajemen = await prisma.programStudi.findFirst({ where: { namaProdi: 'Manajemen' } });
  const prodiBisnisDig = await prisma.programStudi.findFirst({ where: { namaProdi: 'Bisnis Digital' } });
  const prodiD4Perbankan = await prisma.programStudi.findFirst({ where: { namaProdi: 'Perbankan dan Keuangan Digital (Sarjana Terapan)' } });
  const prodiTI = await prisma.programStudi.findFirst({ where: { namaProdi: 'Teknik Informatika' } });

  // 7. Mata Kuliah RPL
  if (prodiTekPen) {
    const existingMkrpl = await prisma.mataKuliahRpl.findFirst({ where: { programStudiId: prodiTekPen.id } });
    if (!existingMkrpl) {
      await prisma.mataKuliahRpl.createMany({
        data: [
          { programStudiId: prodiTekPen.id, tahunKurikulum: '2026', kodeMK: 'TP101', namaMK: 'Landasan Teknologi Pendidikan', sksWajib: 3, sksPilihan: 0, sksTotal: 3, statusCpmk: 'Sudah Terisi' },
          { programStudiId: prodiTekPen.id, tahunKurikulum: '2026', kodeMK: 'TP203', namaMK: 'Desain Pembelajaran Digital', sksWajib: 3, sksPilihan: 0, sksTotal: 3, statusCpmk: 'Sudah Terisi' },
          { programStudiId: prodiTekPen.id, tahunKurikulum: '2026', kodeMK: 'TP305', namaMK: 'Produksi Media Video Pembelajaran', sksWajib: 4, sksPilihan: 0, sksTotal: 4, statusCpmk: 'Belum Terisi' },
        ],
      });
    }
  }

  // 8. DATA KHUSUS DARI SCREENSHOT 5: Rosiana Ayu Dwi Apriliani (4102541051)
  const defaultCamabaPass = await bcrypt.hash('123456', 10);
  const userRosiana = await prisma.user.upsert({
    where: { email: 'rosiana@gmail.com' },
    update: {},
    create: {
      nama: 'ROSIANA AYU DWI APRILIANI',
      email: 'rosiana@gmail.com',
      password: defaultCamabaPass,
      role: 'CAMABA',
      isActive: true,
    },
  });

  await prisma.pendaftar.upsert({
    where: { userId: userRosiana.id },
    update: {
      noPendaftaran: '4102541051',
      nomorUjian: 'UJ-4102541051',
      periodeId: pPeriodeGanjil25!.id,
      gelombangId: gGel1!.id,
      jalurPendaftaranId: jKip!.id,
      sistemKuliahId: sReguler!.id,
      programStudiId: prodiTekPen!.id,
      pilihanProdi2Id: prodiManajemen!.id,
      pilihanProdi3Id: prodiBisnisDig!.id,
      prodiDiterimaId: prodiTekPen!.id,
      statusPendaftar: 'LULUS',
      statusKelulusan: 'LULUS',
      isCadanganDisetujui: false,
      emailKelulusanTerkirim: true,
      isBiodataLengkap: true,
      isFinalisasi: true,
      isIkutSeleksi: true,
      isDiterima: true,
      isDaftarUlang: true,
      nim: '2511010051',
      kelompokUkt: 'KIP-Kuliah',
      nominalUkt: 0,
      isKip: true,
      asalSekolah: 'SMKN 1 Kota Bogor',
      provinsi: 'Jawa Barat',
      kabupatenKota: 'Kota Bogor',
      namaPerusahaan: 'Bank Mandiri (Persero) Tbk',
      asalPerguruanTinggi: 'Universitas Pakuan',
      alasanMemilih: 'Reputasi & Akreditasi Program Studi (Unggul / A)',
      sumberTrafik: 'Media Sosial (Instagram / TikTok)',
    },
    create: {
      userId: userRosiana.id,
      noPendaftaran: '4102541051',
      nomorUjian: 'UJ-4102541051',
      periodeId: pPeriodeGanjil25!.id,
      gelombangId: gGel1!.id,
      jalurPendaftaranId: jKip!.id,
      sistemKuliahId: sReguler!.id,
      programStudiId: prodiTekPen!.id,
      pilihanProdi2Id: prodiManajemen!.id,
      pilihanProdi3Id: prodiBisnisDig!.id,
      prodiDiterimaId: prodiTekPen!.id,
      statusPendaftar: 'LULUS',
      statusKelulusan: 'LULUS',
      isCadanganDisetujui: false,
      emailKelulusanTerkirim: true,
      isBiodataLengkap: true,
      isFinalisasi: true,
      isIkutSeleksi: true,
      isDiterima: true,
      isDaftarUlang: true,
      nim: '2511010051',
      kelompokUkt: 'KIP-Kuliah',
      nominalUkt: 0,
      isKip: true,
      asalSekolah: 'SMKN 1 Kota Bogor',
      provinsi: 'Jawa Barat',
      kabupatenKota: 'Kota Bogor',
      namaPerusahaan: 'Bank Mandiri (Persero) Tbk',
      asalPerguruanTinggi: 'Universitas Pakuan',
      alasanMemilih: 'Reputasi & Akreditasi Program Studi (Unggul / A)',
      sumberTrafik: 'Media Sosial (Instagram / TikTok)',
    },
  });

  const pendaftarRosiana = await prisma.pendaftar.findUnique({ where: { userId: userRosiana.id } });
  if (pendaftarRosiana) {
    await prisma.nilaiSeleksi.deleteMany({ where: { pendaftarId: pendaftarRosiana.id } });
    await prisma.nilaiSeleksi.createMany({
      data: [
        {
          pendaftarId: pendaftarRosiana.id,
          jenisTes: 'Tes Potensi Akademik (TPA)',
          nilai: 88.5,
          lulusTes: true,
        },
        {
          pendaftarId: pendaftarRosiana.id,
          jenisTes: 'Ujian Masuk CBT PMB',
          nilai: 92.0,
          lulusTes: true,
        },
        {
          pendaftarId: pendaftarRosiana.id,
          jenisTes: 'Tes Wawancara Keislaman & Baca Tulis Al-Qur\'an',
          nilai: 95.0,
          lulusTes: true,
        },
        {
          pendaftarId: pendaftarRosiana.id,
          jenisTes: 'Tes Kemampuan Bahasa Inggris (TOEFL Prediction)',
          nilai: 84.0,
          lulusTes: true,
        },
      ],
    });

    await prisma.orangTua.upsert({
      where: { pendaftarId: pendaftarRosiana.id },
      update: {
        namaAyah: 'Ahmad Dahlan',
        pendidikanAyah: 'Diploma (D3/D4)',
        pekerjaanAyah: 'Wiraswasta / Pengusaha',
        namaIbu: 'Nurhayati',
        pendidikanIbu: 'SMA / SMK / MA',
        pekerjaanIbu: 'Pegawai Swasta',
        penghasilanOrtu: 'Rp 5.000.000 - Rp 10.000.000',
        noHpOrtu: '081398765432',
      },
      create: {
        pendaftarId: pendaftarRosiana.id,
        namaAyah: 'Ahmad Dahlan',
        pendidikanAyah: 'Diploma (D3/D4)',
        pekerjaanAyah: 'Wiraswasta / Pengusaha',
        namaIbu: 'Nurhayati',
        pendidikanIbu: 'SMA / SMK / MA',
        pekerjaanIbu: 'Pegawai Swasta',
        penghasilanOrtu: 'Rp 5.000.000 - Rp 10.000.000',
        noHpOrtu: '081398765432',
      },
    });
  }
  console.log('✔ Pendaftar Rosiana Ayu Dwi Apriliani (4102541051) berhasil di-seed.');

  // 9. Calon Mahasiswa tambahan untuk Rekomendasi Prodi, Cadangan SET, dan Registrasi Ulang (Screenshot 1 & 4)
  const sampleCamabas = [
    {
      nama: 'MUHAMMAD FADHLI PRATAMA',
      email: 'fadhli@gmail.com',
      noPendaftaran: '4102541052',
      nomorUjian: 'UJ-4102541052',
      statusKelulusan: 'CADANGAN',
      isCadanganDisetujui: true, // SET = true
      isDiterima: false,
      isDaftarUlang: false,
      kelompokUkt: 'UKT 3',
      nominalUkt: 4500000,
      p1: prodiD4Perbankan!.id,
      p2: prodiManajemen!.id,
      p3: prodiBisnisDig!.id,
      nilai: 84.5,
    },
    {
      nama: 'SITI NURHALIZA AISYAH',
      email: 'siti.nurhaliza@gmail.com',
      noPendaftaran: '4102541053',
      nomorUjian: 'UJ-4102541053',
      statusKelulusan: 'LULUS',
      isCadanganDisetujui: false,
      isDiterima: true,
      isDaftarUlang: true,
      prodiDiterimaId: prodiD4Perbankan!.id,
      nim: '2611020015',
      kelompokUkt: 'UKT 2',
      nominalUkt: 3500000,
      p1: prodiD4Perbankan!.id,
      p2: prodiTI!.id,
      p3: prodiManajemen!.id,
      nilai: 91.0,
    },
    {
      nama: 'ANDI KURNIAWAN',
      email: 'andi.kurniawan@gmail.com',
      noPendaftaran: '4102541054',
      nomorUjian: 'UJ-4102541054',
      statusKelulusan: 'MENUNGGU',
      isCadanganDisetujui: false,
      isDiterima: false,
      isDaftarUlang: false,
      kelompokUkt: 'UKT 1',
      nominalUkt: 2500000,
      p1: prodiD4Perbankan!.id,
      p2: prodiBisnisDig!.id,
      p3: prodiTI!.id,
      nilai: 72.0,
    },
  ];

  for (const s of sampleCamabas) {
    const u = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        nama: s.nama,
        email: s.email,
        password: defaultCamabaPass,
        role: 'CAMABA',
        isActive: true,
      },
    });

    const pend = await prisma.pendaftar.upsert({
      where: { userId: u.id },
      update: {
        noPendaftaran: s.noPendaftaran,
        nomorUjian: s.nomorUjian,
        periodeId: pPeriodeGenap!.id,
        gelombangId: gGel1!.id,
        jalurPendaftaranId: jSbmptn!.id,
        sistemKuliahId: sReguler!.id,
        programStudiId: s.p1,
        pilihanProdi2Id: s.p2,
        pilihanProdi3Id: s.p3,
        prodiDiterimaId: s.prodiDiterimaId || null,
        statusPendaftar: s.statusKelulusan,
        statusKelulusan: s.statusKelulusan,
        isCadanganDisetujui: s.isCadanganDisetujui,
        emailKelulusanTerkirim: s.statusKelulusan === 'LULUS',
        isBiodataLengkap: true,
        isFinalisasi: true,
        isIkutSeleksi: true,
        isDiterima: s.isDiterima,
        isDaftarUlang: s.isDaftarUlang,
        nim: s.nim || null,
        kelompokUkt: s.kelompokUkt,
        nominalUkt: s.nominalUkt,
        asalSekolah: 'SMA Negeri 1 Bogor',
        provinsi: 'Jawa Barat',
        kabupatenKota: 'Kota Bogor',
      },
      create: {
        userId: u.id,
        noPendaftaran: s.noPendaftaran,
        nomorUjian: s.nomorUjian,
        periodeId: pPeriodeGenap!.id,
        gelombangId: gGel1!.id,
        jalurPendaftaranId: jSbmptn!.id,
        sistemKuliahId: sReguler!.id,
        programStudiId: s.p1,
        pilihanProdi2Id: s.p2,
        pilihanProdi3Id: s.p3,
        prodiDiterimaId: s.prodiDiterimaId || null,
        statusPendaftar: s.statusKelulusan,
        statusKelulusan: s.statusKelulusan,
        isCadanganDisetujui: s.isCadanganDisetujui,
        emailKelulusanTerkirim: s.statusKelulusan === 'LULUS',
        isBiodataLengkap: true,
        isFinalisasi: true,
        isIkutSeleksi: true,
        isDiterima: s.isDiterima,
        isDaftarUlang: s.isDaftarUlang,
        nim: s.nim || null,
        kelompokUkt: s.kelompokUkt,
        nominalUkt: s.nominalUkt,
        asalSekolah: 'SMA Negeri 1 Bogor',
        provinsi: 'Jawa Barat',
        kabupatenKota: 'Kota Bogor',
      },
    });

    // Buat data nilai tes seleksi komprehensif (Screenshot 2 Seleksi)
    await prisma.nilaiSeleksi.deleteMany({ where: { pendaftarId: pend.id } });
    await prisma.nilaiSeleksi.createMany({
      data: [
        {
          pendaftarId: pend.id,
          jenisTes: 'Tes Potensi Akademik (TPA)',
          nilai: s.nilai,
          lulusTes: s.nilai >= 75,
        },
        {
          pendaftarId: pend.id,
          jenisTes: 'Ujian Masuk CBT PMB',
          nilai: Math.min(100, s.nilai + 4),
          lulusTes: s.nilai + 4 >= 75,
        },
        {
          pendaftarId: pend.id,
          jenisTes: 'Tes Wawancara Keislaman & Baca Tulis Al-Qur\'an',
          nilai: Math.min(100, s.nilai + 8),
          lulusTes: true,
        },
        {
          pendaftarId: pend.id,
          jenisTes: 'Tes Kemampuan Bahasa Inggris (TOEFL Prediction)',
          nilai: Math.max(50, s.nilai - 5),
          lulusTes: s.nilai - 5 >= 65,
        },
      ],
    });

    // Buat data profil orang tua (Screenshot 4 Orang Tua)
    await prisma.orangTua.upsert({
      where: { pendaftarId: pend.id },
      update: {
        namaAyah: 'Bambang Sutrisno',
        pendidikanAyah: 'Sarjana (S1)',
        pekerjaanAyah: 'PNS / TNI / POLRI',
        namaIbu: 'Sri Wahyuni',
        pendidikanIbu: 'SMA / SMK / MA',
        pekerjaanIbu: 'Ibu Rumah Tangga',
        penghasilanOrtu: 'Rp 5.000.000 - Rp 10.000.000',
        noHpOrtu: '081234567890',
      },
      create: {
        pendaftarId: pend.id,
        namaAyah: 'Bambang Sutrisno',
        pendidikanAyah: 'Sarjana (S1)',
        pekerjaanAyah: 'PNS / TNI / POLRI',
        namaIbu: 'Sri Wahyuni',
        pendidikanIbu: 'SMA / SMK / MA',
        pekerjaanIbu: 'Ibu Rumah Tangga',
        penghasilanOrtu: 'Rp 5.000.000 - Rp 10.000.000',
        noHpOrtu: '081234567890',
      },
    });

    // Update namaPerusahaan, asalPerguruanTinggi, alasanMemilih untuk Tab Perusahaan, Perguruan Tinggi, Kuesioner
    await prisma.pendaftar.update({
      where: { id: pend.id },
      data: {
        namaPerusahaan: 'PT Telkom Indonesia (Persero) Tbk',
        asalPerguruanTinggi: 'Institut Pertanian Bogor (IPB)',
        alasanMemilih: 'Kampus Berbasis Nilai-Nilai Islami Unggul',
      },
    });
    // Buat data berkas syarat seleksi (Screenshot 2 Seleksi)
    await prisma.berkasPendaftar.deleteMany({ where: { pendaftarId: pend.id } });
    await prisma.berkasPendaftar.createMany({
      data: [
        {
          pendaftarId: pend.id,
          jenisBerkas: 'Pas Foto Resmi (Background Merah)',
          fileUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
          statusVerifikasi: 'VALID',
        },
        {
          pendaftarId: pend.id,
          jenisBerkas: 'Ijazah / Surat Keterangan Lulus (SKL)',
          fileUrl: 'https://uika-bogor.ac.id/uploads/berkas/ijazah_sample.pdf',
          statusVerifikasi: 'VALID',
        },
        {
          pendaftarId: pend.id,
          jenisBerkas: 'Transkrip Nilai / Rapor Semester 1-5',
          fileUrl: 'https://uika-bogor.ac.id/uploads/berkas/rapor_sample.pdf',
          statusVerifikasi: 'MENUNGGU',
        },
        {
          pendaftarId: pend.id,
          jenisBerkas: 'Kartu Tanda Penduduk (KTP) / Kartu Keluarga',
          fileUrl: 'https://uika-bogor.ac.id/uploads/berkas/ktp_sample.pdf',
          statusVerifikasi: 'VALID',
        },
      ],
    });
  }

  // 10. Data Pembukaan Jalur untuk Modul Pengaturan (Screenshot 1 Pengaturan)
  const existingPj = await prisma.pembukaanJalur.findFirst();
  if (!existingPj && pPeriodeGenap && gGel1 && jSbmptn && sReguler && prodiD4Perbankan) {
    await prisma.pembukaanJalur.createMany({
      data: [
        {
          periodeId: pPeriodeGenap.id,
          gelombangId: gGel1.id,
          jalurPendaftaranId: jSbmptn.id,
          sistemKuliahId: sReguler.id,
          programStudiId: prodiD4Perbankan.id,
          biayaPendaftaran: 350000,
          kuota: 60,
          isBuka: true,
          tanggalBuka: new Date('2026-01-01'),
          tanggalTutup: new Date('2026-06-30'),
        },
        {
          periodeId: pPeriodeGenap.id,
          gelombangId: gGel1.id,
          jalurPendaftaranId: jKip!.id,
          sistemKuliahId: sReguler.id,
          programStudiId: prodiTekPen!.id,
          biayaPendaftaran: 0,
          kuota: 40,
          isBuka: true,
          tanggalBuka: new Date('2026-01-01'),
          tanggalTutup: new Date('2026-06-30'),
        },
      ],
    });
  }

  // 11. Data Informasi & Berita Portal Camaba (Screenshot 3 Informasi)
  const existingInfo = await prisma.informasiBrosur.findFirst();
  if (!existingInfo) {
    await prisma.informasiBrosur.createMany({
      data: [
        {
          judul: "Pendaftaran Beasiswa Hafidz Al-Qur'an UIKA Bogor 2026/2027 Resmi Dibuka",
          kategori: 'BEASISWA',
          deskripsi: "Beasiswa Hafidz Al-Qur'an UIKA Bogor Tahun Akademik 2026/2027 Universitas Ibn Khaldun (UIKA) Bogor membuka pendaftaran Beasiswa Hafidz Al-Qur'an bagi calon mahasiswa baru Tahun Akademik 2026/2027. Program ini ditujukan bagi penghafal Al-Qur'an minimal 10, 20, hingga 30 Juz.",
          fileUrl: 'https://uika-bogor.ac.id/images/informasi/beasiswa_hafidz.jpg',
          isActive: true,
          createdAt: new Date('2026-06-10T08:55:10.000Z'),
        },
        {
          judul: 'Jalur Khusus Penyandang Disabilitas',
          kategori: 'JALUR KHUSUS',
          deskripsi: 'Jalur Khusus Penyandang Disabilitas dibuka untuk memberikan kesempatan yang setara bagi calon mahasiswa penyandang disabilitas dalam mengakses pendidikan tinggi yang inklusif. Melalui jalur ini, perguruan tinggi berkomitmen menyediakan sarana dan pendampingan.',
          fileUrl: 'https://uika-bogor.ac.id/images/informasi/disabilitas.jpg',
          isActive: true,
          createdAt: new Date('2026-03-18T14:48:11.000Z'),
        },
        {
          judul: 'Penerimaan Mahasiswa Baru Jalur RPL TA 2026/2027',
          kategori: 'RPL',
          deskripsi: 'Universitas Ibn Khaldun Bogor kembali membuka pendaftaran Mahasiswa Baru melalui Rekognisi Pembelajaran Lampau (RPL) untuk Tahun Akademik 2026/2027.',
          fileUrl: 'https://uika-bogor.ac.id/images/informasi/jalur_rpl.jpg',
          isActive: true,
          createdAt: new Date('2026-03-10T10:55:50.000Z'),
        },
        {
          judul: 'Penerimaan Mahasiswa Baru UIKA 2026',
          kategori: 'PENDAFTARAN',
          deskripsi: 'Mulai 1 Januari PMB UIKA Bogor 2026/2027 resmi dibuka. UIKA Bukan hanya tempat kita belajar, tapi jadi tempat bertumbuh. Yuk Gerak sekarang. Kampus Terakreditasi UNGGUL berlandaskan nilai Islam, dan berorientasi pada keilmuan modern.',
          fileUrl: 'https://uika-bogor.ac.id/images/informasi/pmb_uika_2026.jpg',
          isActive: true,
          createdAt: new Date('2026-03-02T09:12:40.000Z'),
        },
        {
          judul: 'Informasi Mahasiswa Baru',
          kategori: 'PENGUMUMAN',
          deskripsi: 'Bagi Mahasiswa Baru agar melengkapi isian Biodata, Berkas Persyaratan, dan Riwayat Rekam Medis sebelum tanggal penutupan finalisasi data gelombang pendaftaran.',
          fileUrl: 'https://uika-bogor.ac.id/images/informasi/info_camaba.jpg',
          isActive: true,
          createdAt: new Date('2025-01-07T08:31:40.000Z'),
        },
      ],
    });
  }

  console.log('✅ Seeding selesai sukses 100%! Semua data kelulusan, referensi, laporan, pengaturan, seleksi, dan Login As telah tersedia.');
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
