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
    { kode: '20261', nama: '2026 Ganjil' },
    { kode: '20262', nama: '2026 Genap' },
    { kode: '20271', nama: '2027 Ganjil' },
    { kode: '20251', nama: '2025 Ganjil' },
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

  // 6. Data Master Program Studi
  const prodiList = [
    { namaProdi: 'Teknologi Pendidikan', jenjang: 'S1', fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', akreditasi: 'A', biayaKuliah: 4500000 },
    { namaProdi: 'Manajemen', jenjang: 'S1', fakultas: 'Fakultas Ekonomi dan Bisnis', akreditasi: 'Unggul', biayaKuliah: 5000000 },
    { namaProdi: 'Bisnis Digital', jenjang: 'S1', fakultas: 'Fakultas Ekonomi dan Bisnis', akreditasi: 'Baik Sekali', biayaKuliah: 5200000 },
    { namaProdi: 'Perbankan dan Keuangan Digital (Sarjana Terapan)', jenjang: 'D4', fakultas: 'Fakultas Ekonomi dan Bisnis', akreditasi: 'Baik', biayaKuliah: 4200000 },
    { namaProdi: 'Teknik Informatika', jenjang: 'S1', fakultas: 'Fakultas Teknik dan Sains', akreditasi: 'Unggul', biayaKuliah: 5500000 },
    { namaProdi: 'Sistem Informasi', jenjang: 'S1', fakultas: 'Fakultas Teknik dan Sains', akreditasi: 'Baik Sekali', biayaKuliah: 5200000 },
    { namaProdi: 'Ilmu Hukum', jenjang: 'S1', fakultas: 'Fakultas Hukum', akreditasi: 'Unggul', biayaKuliah: 4800000 },
    { namaProdi: 'Pendidikan Agama Islam', jenjang: 'S1', fakultas: 'Fakultas Agama Islam', akreditasi: 'Unggul', biayaKuliah: 4000000 },
  ];

  for (const pr of prodiList) {
    const existing = await prisma.programStudi.findFirst({ where: { namaProdi: pr.namaProdi, jenjang: pr.jenjang } });
    if (!existing) {
      await prisma.programStudi.create({ data: pr });
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
    },
  });
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

    // Buat data nilai tes seleksi
    await prisma.nilaiSeleksi.deleteMany({ where: { pendaftarId: pend.id } });
    await prisma.nilaiSeleksi.create({
      data: {
        pendaftarId: pend.id,
        jenisTes: 'Tes Potensi Akademik (TPA)',
        nilai: s.nilai,
        lulusTes: s.nilai >= 75,
      },
    });
    // Buat data berkas syarat seleksi (Screenshot 2 Seleksi)
    await prisma.berkasPendaftar.deleteMany({ where: { pendaftarId: pend.id } });
    await prisma.berkasPendaftar.createMany({
      data: [
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
