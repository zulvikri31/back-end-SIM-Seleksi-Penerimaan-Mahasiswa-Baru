import prisma from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_fallback_key';

export interface CamabaFilterJalur {
  jenjang?: string;
  programStudiId?: number;
  sistemKuliahId?: number;
  gelombangId?: number;
  search?: string;
  isBukaOnly?: boolean;
}

export interface CamabaFilterProdi {
  jenjang?: string;
  search?: string;
}

export interface CamabaFilterInformasi {
  page?: number;
  limit?: number;
  kategori?: string;
  search?: string;
}

export interface PendaftaranBaruDTO {
  nama: string;
  email: string;
  password: string;
  noHp?: string;
  pembukaanJalurId: number;
  sumberTrafik?: string;
}

export interface UpdateBiodataCamabaDTO {
  nik?: string;
  jenisKelamin?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  noHp?: string;
  alamat?: string;
  provinsi?: string;
  kabupatenKota?: string;
  asalSekolah?: string;
  jenisPendidikan?: string;
  jurusanPendidikan?: string;
  tahunLulus?: number;
  beratBadan?: number;
  tinggiBadan?: number;
  suku?: string;
  agama?: string;
  kebutuhanKhusus?: string;
  pilihanProdi2Id?: number;
  pilihanProdi3Id?: number;
  isFinalisasi?: boolean;
  // Data Orang Tua
  namaAyah?: string;
  pekerjaanAyah?: string;
  namaIbu?: string;
  pekerjaanIbu?: string;
  penghasilanOrtu?: string;
  noHpOrtu?: string;
}

export interface RekamMedisDTO {
  golonganDarah?: string;
  rhesus?: string;
  tinggiBadan?: number;
  beratBadan?: number;
  riwayatPenyakit?: string;
  riwayatAlergi?: string;
  statusButaWarna?: string;
  isBerkacamata?: boolean;
  isMerokok?: boolean;
  riwayatOperasi?: string;
  riwayatRawatInap?: string;
  kebutuhanKhusus?: string;
  kontakDaruratNama?: string;
  kontakDaruratHubungan?: string;
  kontakDaruratNoHp?: string;
  fileSuratKesehatan?: string;
  fileBebasNarkoba?: string;
  catatanKesehatan?: string;
}

export class CamabaService {
  /**
   * Mengambil daftar Jenjang yang tersedia di UIKA beserta jumlah program studinya
   */
  async getJenjangList() {
    const prodis = await prisma.programStudi.findMany({
      select: { jenjang: true },
    });

    const jenjangMap: Record<string, { label: string; count: number; order: number }> = {
      'D4': { label: 'D4 - Sarjana Terapan', count: 0, order: 1 },
      'S1': { label: 'S1 - Strata 1', count: 0, order: 2 },
      'Prof': { label: 'Prof - Profesi', count: 0, order: 3 },
      'S2': { label: 'S2 - Strata 2', count: 0, order: 4 },
      'S3': { label: 'S3 - Strata 3', count: 0, order: 5 },
    };

    // Hitung kemunculan prodi per jenjang
    for (const p of prodis) {
      if (jenjangMap[p.jenjang]) {
        jenjangMap[p.jenjang].count++;
      } else {
        jenjangMap[p.jenjang] = {
          label: p.jenjang,
          count: 1,
          order: 99,
        };
      }
    }

    return Object.entries(jenjangMap)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([code, val]) => ({
        kode: code,
        label: val.label,
        jumlahProdi: val.count,
      }));
  }

  /**
   * Mengambil daftar Sistem Kuliah (misal: Reguler Pagi, Kelas Karyawan)
   */
  async getSistemKuliahList() {
    return prisma.sistemKuliah.findMany({
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Mengambil daftar Program Studi dengan filter jenjang dan pencarian teks
   */
  async getProgramStudiList(filter: CamabaFilterProdi) {
    const where: any = {};

    if (filter.jenjang && filter.jenjang !== 'all' && filter.jenjang.trim() !== '') {
      where.jenjang = { equals: filter.jenjang.trim() };
    }

    if (filter.search && filter.search.trim() !== '') {
      where.namaProdi = { contains: filter.search.trim(), mode: 'insensitive' };
    }

    const prodiList = await prisma.programStudi.findMany({
      where,
      include: {
        pembukaanJalur: {
          where: { isBuka: true },
          include: {
            jalurPendaftaran: true,
            gelombang: true,
            sistemKuliah: true,
          },
        },
      },
      orderBy: [{ jenjang: 'asc' }, { namaProdi: 'asc' }],
    });

    const formatRupiah = (val: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(val);
    };

    return prodiList.map((prodi) => {
      const activeJalurCount = prodi.pembukaanJalur.length;
      return {
        id: prodi.id,
        namaProdi: prodi.namaProdi,
        namaLengkap: `${prodi.jenjang} - ${prodi.namaProdi}${prodi.jenjang === 'D4' ? ' (Sarjana Terapan)' : ''}`,
        jenjang: prodi.jenjang,
        akreditasi: prodi.akreditasi || 'Terakreditasi',
        biayaKuliah: prodi.biayaKuliah,
        biayaKuliahFormatted: formatRupiah(prodi.biayaKuliah),
        totalJalurBuka: activeJalurCount,
        statusJalur: activeJalurCount > 0 ? `Tersedia ${activeJalurCount} jalur pendaftaran` : 'Belum ada jalur pendaftaran yang dibuka',
        jalurTersedia: prodi.pembukaanJalur.map((pj) => ({
          id: pj.id,
          namaJalur: pj.jalurPendaftaran.nama,
          gelombang: pj.gelombang.nama,
          sistemKuliah: pj.sistemKuliah.nama,
          biayaPendaftaran: pj.biayaPendaftaran,
          biayaFormatted: formatRupiah(pj.biayaPendaftaran),
        })),
      };
    });
  }

  /**
   * Detail 1 Program Studi
   */
  async getProgramStudiDetail(id: number) {
    const prodi = await prisma.programStudi.findUnique({
      where: { id },
      include: {
        pembukaanJalur: {
          include: {
            periode: true,
            gelombang: true,
            jalurPendaftaran: true,
            sistemKuliah: true,
          },
        },
      },
    });

    if (!prodi) {
      throw new Error(`Program studi dengan ID ${id} tidak ditemukan.`);
    }

    const formatRupiah = (val: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(val);
    };

    return {
      id: prodi.id,
      namaProdi: prodi.namaProdi,
      namaLengkap: `${prodi.jenjang} - ${prodi.namaProdi}`,
      jenjang: prodi.jenjang,
      akreditasi: prodi.akreditasi || 'Terakreditasi',
      biayaKuliah: prodi.biayaKuliah,
      biayaKuliahFormatted: formatRupiah(prodi.biayaKuliah),
      pembukaanJalur: prodi.pembukaanJalur.map((pj) => ({
        id: pj.id,
        namaJalur: pj.jalurPendaftaran.nama,
        gelombang: pj.gelombang.nama,
        sistemKuliah: pj.sistemKuliah.nama,
        biayaPendaftaran: pj.biayaPendaftaran,
        biayaFormatted: formatRupiah(pj.biayaPendaftaran),
        tanggalBuka: pj.tanggalBuka,
        tanggalTutup: pj.tanggalTutup,
        isBuka: pj.isBuka,
      })),
    };
  }

  /**
   * Mengambil daftar Jalur Pendaftaran yang dibuka (PembukaanJalur) untuk Portal Camaba
   * Mendukung filter: Jenjang, Program Studi, Sistem Kuliah, Pencarian, dll.
   */
  async getJalurPendaftaranList(filter: CamabaFilterJalur) {
    const where: any = {};

    if (filter.isBukaOnly !== false) {
      where.isBuka = true;
    }

    if (filter.jenjang && filter.jenjang !== 'all' && filter.jenjang.trim() !== '') {
      where.programStudi = {
        ...(where.programStudi || {}),
        jenjang: { equals: filter.jenjang.trim() },
      };
    }

    if (filter.programStudiId) {
      where.programStudiId = Number(filter.programStudiId);
    }

    if (filter.sistemKuliahId) {
      where.sistemKuliahId = Number(filter.sistemKuliahId);
    }

    if (filter.gelombangId) {
      where.gelombangId = Number(filter.gelombangId);
    }

    if (filter.search && filter.search.trim() !== '') {
      const q = filter.search.trim();
      where.OR = [
        { jalurPendaftaran: { nama: { contains: q, mode: 'insensitive' } } },
        { programStudi: { namaProdi: { contains: q, mode: 'insensitive' } } },
        { gelombang: { nama: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const pembukaanList = await prisma.pembukaanJalur.findMany({
      where,
      include: {
        periode: true,
        gelombang: true,
        jalurPendaftaran: true,
        sistemKuliah: true,
        programStudi: true,
      },
      orderBy: [{ id: 'asc' }],
    });

    const formatRupiah = (val: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(val);
    };

    const formatDateRange = (buka?: Date | null, tutup?: Date | null) => {
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
      const start = buka ? new Intl.DateTimeFormat('id-ID', options).format(new Date(buka)) : 'Segera';
      const end = tutup ? new Intl.DateTimeFormat('id-ID', options).format(new Date(tutup)) : 'Selesai';
      return `${start} - ${end}`;
    };

    return pembukaanList.map((item) => {
      // Format nama judul kartu sesuai screenshot:
      // "Jalur RPL (S1) – RPL PEROLEHAN SKS Gelombang 1" atau nama jalur spesifik
      const namaJalur = item.jalurPendaftaran.nama;
      const jenjang = item.programStudi.jenjang;
      const gelombang = item.gelombang.nama;
      const judulKartu = `Jalur ${namaJalur} (${jenjang}) – ${gelombang}`;

      return {
        id: item.id,
        judulKartu,
        namaJalur: item.jalurPendaftaran.nama,
        deskripsiJalur: item.jalurPendaftaran.deskripsi,
        periode: item.periode.nama,
        gelombang: item.gelombang.nama,
        jenjang: item.programStudi.jenjang,
        programStudiId: item.programStudi.id,
        namaProdi: item.programStudi.namaProdi,
        sistemKuliahId: item.sistemKuliah.id,
        sistemKuliah: item.sistemKuliah.nama, // Misal: "Reguler", "Karyawan"
        biayaPendaftaran: item.biayaPendaftaran,
        biayaFormatted: formatRupiah(item.biayaPendaftaran),
        kuota: item.kuota,
        tanggalBuka: item.tanggalBuka,
        tanggalTutup: item.tanggalTutup,
        periodeTanggal: formatDateRange(item.tanggalBuka, item.tanggalTutup),
        isBuka: item.isBuka,
        status: item.isBuka ? 'Dibuka' : 'Ditutup',
      };
    });
  }

  /**
   * Detail 1 Pembukaan Jalur
   */
  async getJalurPendaftaranDetail(id: number) {
    const item = await prisma.pembukaanJalur.findUnique({
      where: { id },
      include: {
        periode: true,
        gelombang: true,
        jalurPendaftaran: true,
        sistemKuliah: true,
        programStudi: true,
      },
    });

    if (!item) {
      throw new Error(`Jalur pendaftaran dengan ID ${id} tidak ditemukan.`);
    }

    const formatRupiah = (val: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(val);
    };

    const formatDateRange = (buka?: Date | null, tutup?: Date | null) => {
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
      const start = buka ? new Intl.DateTimeFormat('id-ID', options).format(new Date(buka)) : 'Segera';
      const end = tutup ? new Intl.DateTimeFormat('id-ID', options).format(new Date(tutup)) : 'Selesai';
      return `${start} - ${end}`;
    };

    return {
      id: item.id,
      judulKartu: `Jalur ${item.jalurPendaftaran.nama} (${item.programStudi.jenjang}) – ${item.gelombang.nama}`,
      namaJalur: item.jalurPendaftaran.nama,
      deskripsiJalur: item.jalurPendaftaran.deskripsi,
      periode: item.periode.nama,
      gelombang: item.gelombang.nama,
      jenjang: item.programStudi.jenjang,
      programStudi: {
        id: item.programStudi.id,
        nama: item.programStudi.namaProdi,
        jenjang: item.programStudi.jenjang,
        akreditasi: item.programStudi.akreditasi,
        biayaKuliah: item.programStudi.biayaKuliah,
        biayaKuliahFormatted: formatRupiah(item.programStudi.biayaKuliah),
      },
      sistemKuliah: {
        id: item.sistemKuliah.id,
        nama: item.sistemKuliah.nama,
      },
      biayaPendaftaran: item.biayaPendaftaran,
      biayaFormatted: formatRupiah(item.biayaPendaftaran),
      kuota: item.kuota,
      tanggalBuka: item.tanggalBuka,
      tanggalTutup: item.tanggalTutup,
      periodeTanggal: formatDateRange(item.tanggalBuka, item.tanggalTutup),
      isBuka: item.isBuka,
      status: item.isBuka ? 'Dibuka' : 'Ditutup',
    };
  }

  /**
   * Mengambil daftar Informasi dan Pengumuman (mendukung pagination dan pencarian)
   */
  async getInformasiList(filter: CamabaFilterInformasi) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(filter.limit) || 6));
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    if (filter.kategori && filter.kategori !== 'all' && filter.kategori.trim() !== '') {
      where.kategori = { equals: filter.kategori.trim(), mode: 'insensitive' };
    }

    if (filter.search && filter.search.trim() !== '') {
      where.OR = [
        { judul: { contains: filter.search.trim(), mode: 'insensitive' } },
        { deskripsi: { contains: filter.search.trim(), mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.informasiBrosur.count({ where }),
      prisma.informasiBrosur.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const formatDateIndo = (date: Date) => {
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
      return new Intl.DateTimeFormat('id-ID', options).format(new Date(date));
    };

    const dataFormatted = items.map((item) => ({
      id: item.id,
      judul: item.judul,
      kategori: item.kategori,
      deskripsi: item.deskripsi,
      fileUrl: item.fileUrl,
      tanggalDibuat: formatDateIndo(item.createdAt),
      createdAt: item.createdAt,
    }));

    return {
      data: dataFormatted,
      pagination: {
        totalItems: total,
        currentPage: page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Detail 1 Informasi / Pengumuman
   */
  async getInformasiDetail(id: number) {
    const item = await prisma.informasiBrosur.findUnique({
      where: { id },
    });

    if (!item) {
      throw new Error(`Informasi dengan ID ${id} tidak ditemukan.`);
    }

    const formatDateIndo = (date: Date) => {
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
      return new Intl.DateTimeFormat('id-ID', options).format(new Date(date));
    };

    return {
      id: item.id,
      judul: item.judul,
      kategori: item.kategori,
      deskripsi: item.deskripsi,
      fileUrl: item.fileUrl,
      tanggalDibuat: formatDateIndo(item.createdAt),
      createdAt: item.createdAt,
    };
  }

  /**
   * Brosur dan rincian biaya
   */
  async getBrosurDanBiaya() {
    const brosurItems = await prisma.informasiBrosur.findMany({
      where: {
        isActive: true,
        kategori: { in: ['Brosur', 'Biaya', 'brosur', 'biaya'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    const prodiBiaya = await prisma.programStudi.findMany({
      orderBy: [{ jenjang: 'asc' }, { namaProdi: 'asc' }],
    });

    const formatRupiah = (val: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(val);
    };

    return {
      judul: 'Brosur Dan Informasi Biaya',
      deskripsi: 'Brosur dan rincian biaya selama kuliah di Universitas Ibn Khaldun',
      brosur: brosurItems,
      rincianBiayaProdi: prodiBiaya.map((p) => ({
        id: p.id,
        jenjang: p.jenjang,
        namaProdi: p.namaProdi,
        akreditasi: p.akreditasi,
        biayaKuliah: p.biayaKuliah,
        biayaKuliahFormatted: formatRupiah(p.biayaKuliah),
      })),
    };
  }

  /**
   * Pendaftaran Akun Camaba & Pemilihan Jalur Pendaftaran secara langsung
   */
  async registerDanPilihJalur(dto: PendaftaranBaruDTO) {
    const { nama, email, password, noHp, pembukaanJalurId, sumberTrafik } = dto;

    if (!nama || !email || !password || !pembukaanJalurId) {
      throw new Error('Nama, email, password, dan jalur pendaftaran wajib dipilih.');
    }

    // 1. Cek apakah email sudah terdaftar
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new Error('Email sudah terdaftar. Silakan gunakan email lain atau langsung Masuk.');
    }

    // 2. Cek apakah pembukaan jalur valid dan masih buka
    const pembukaan = await prisma.pembukaanJalur.findUnique({
      where: { id: Number(pembukaanJalurId) },
      include: {
        periode: true,
        gelombang: true,
        jalurPendaftaran: true,
        sistemKuliah: true,
        programStudi: true,
      },
    });

    if (!pembukaan) {
      throw new Error('Jalur pendaftaran yang dipilih tidak ditemukan.');
    }

    if (!pembukaan.isBuka) {
      throw new Error('Jalur pendaftaran ini sudah ditutup.');
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Generate no pendaftaran unik misal PMB2026xxxx
    const tahunSekarang = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const noPendaftaran = `PMB${tahunSekarang}${randomSuffix}`;

    // 5. Transaksi simpan User dan Pendaftar
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          nama,
          email,
          password: hashedPassword,
          role: 'CAMABA',
          isActive: true,
        },
      });

      const newPendaftar = await tx.pendaftar.create({
        data: {
          userId: newUser.id,
          noPendaftaran,
          periodeId: pembukaan.periodeId,
          gelombangId: pembukaan.gelombangId,
          jalurPendaftaranId: pembukaan.jalurPendaftaranId,
          sistemKuliahId: pembukaan.sistemKuliahId,
          programStudiId: pembukaan.programStudiId,
          noHp: noHp || null,
          sumberTrafik: sumberTrafik || 'Website UIKA',
          isBiodataLengkap: false,
          isFinalisasi: false,
          isIkutSeleksi: false,
          isDiterima: false,
          isDaftarUlang: false,
        },
        include: {
          periode: true,
          gelombang: true,
          jalurPendaftaran: true,
          sistemKuliah: true,
          programStudi: true,
        },
      });

      return { user: newUser, pendaftar: newPendaftar };
    });

    // 6. Generate Token JWT
    const token = jwt.sign(
      {
        id: result.user.id,
        nama: result.user.nama,
        email: result.user.email,
        role: result.user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: result.user.id,
        nama: result.user.nama,
        email: result.user.email,
        role: result.user.role,
      },
      pendaftaran: {
        noPendaftaran: result.pendaftar.noPendaftaran,
        jalur: result.pendaftar.jalurPendaftaran.nama,
        prodi: result.pendaftar.programStudi.namaProdi,
        jenjang: result.pendaftar.programStudi.jenjang,
        sistemKuliah: result.pendaftar.sistemKuliah.nama,
        gelombang: result.pendaftar.gelombang.nama,
        periode: result.pendaftar.periode.nama,
        status: 'Terdaftar - Menunggu Kelengkapan Biodata',
      },
    };
  }

  /**
   * Cek Status Pendaftaran untuk Camaba yang sedang login
   */
  async getStatusPendaftaranByUserId(userId: number) {
    const pendaftar = await prisma.pendaftar.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, nama: true, email: true } },
        periode: true,
        gelombang: true,
        jalurPendaftaran: true,
        sistemKuliah: true,
        programStudi: true,
        berkas: true,
        orangTua: true,
        nilaiSeleksi: true,
      },
    });

    if (!pendaftar) {
      return null;
    }

    return {
      noPendaftaran: pendaftar.noPendaftaran,
      nim: pendaftar.nim,
      nama: pendaftar.user.nama,
      email: pendaftar.user.email,
      noHp: pendaftar.noHp,
      nik: pendaftar.nik,
      jenjang: pendaftar.programStudi.jenjang,
      programStudi: pendaftar.programStudi.namaProdi,
      sistemKuliah: pendaftar.sistemKuliah.nama,
      jalurPendaftaran: pendaftar.jalurPendaftaran.nama,
      gelombang: pendaftar.gelombang.nama,
      periode: pendaftar.periode.nama,
      tahapan: {
        isBiodataLengkap: pendaftar.isBiodataLengkap,
        isFinalisasi: pendaftar.isFinalisasi,
        isIkutSeleksi: pendaftar.isIkutSeleksi,
        isDiterima: pendaftar.isDiterima,
        isDaftarUlang: pendaftar.isDaftarUlang,
      },
      biodata: {
        jenisKelamin: pendaftar.jenisKelamin,
        tempatLahir: pendaftar.tempatLahir,
        tanggalLahir: pendaftar.tanggalLahir,
        alamat: pendaftar.alamat,
        provinsi: pendaftar.provinsi,
        kabupatenKota: pendaftar.kabupatenKota,
        asalSekolah: pendaftar.asalSekolah,
        jenisPendidikan: pendaftar.jenisPendidikan,
        jurusanPendidikan: pendaftar.jurusanPendidikan,
        tahunLulus: pendaftar.tahunLulus,
        beratBadan: pendaftar.beratBadan,
        tinggiBadan: pendaftar.tinggiBadan,
        suku: pendaftar.suku,
        agama: pendaftar.agama,
        kebutuhanKhusus: pendaftar.kebutuhanKhusus,
      },
      orangTua: pendaftar.orangTua,
      berkas: pendaftar.berkas,
      nilaiSeleksi: pendaftar.nilaiSeleksi,
      tanggalDaftar: pendaftar.createdAt,
    };
  }

  /**
   * Update Biodata Camaba
   */
  async updateBiodata(userId: number, data: UpdateBiodataCamabaDTO) {
    const pendaftar = await prisma.pendaftar.findUnique({
      where: { userId },
    });

    if (!pendaftar) {
      throw new Error('Data pendaftar tidak ditemukan untuk akun ini.');
    }

    const updated = await prisma.pendaftar.update({
      where: { userId },
      data: {
        nik: data.nik !== undefined ? data.nik : pendaftar.nik,
        jenisKelamin: data.jenisKelamin !== undefined ? data.jenisKelamin : pendaftar.jenisKelamin,
        tempatLahir: data.tempatLahir !== undefined ? data.tempatLahir : pendaftar.tempatLahir,
        tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir) : pendaftar.tanggalLahir,
        noHp: data.noHp !== undefined ? data.noHp : pendaftar.noHp,
        alamat: data.alamat !== undefined ? data.alamat : pendaftar.alamat,
        provinsi: data.provinsi !== undefined ? data.provinsi : pendaftar.provinsi,
        kabupatenKota: data.kabupatenKota !== undefined ? data.kabupatenKota : pendaftar.kabupatenKota,
        asalSekolah: data.asalSekolah !== undefined ? data.asalSekolah : pendaftar.asalSekolah,
        jenisPendidikan: data.jenisPendidikan !== undefined ? data.jenisPendidikan : pendaftar.jenisPendidikan,
        jurusanPendidikan: data.jurusanPendidikan !== undefined ? data.jurusanPendidikan : pendaftar.jurusanPendidikan,
        tahunLulus: data.tahunLulus !== undefined ? Number(data.tahunLulus) : pendaftar.tahunLulus,
        beratBadan: data.beratBadan !== undefined ? Number(data.beratBadan) : pendaftar.beratBadan,
        tinggiBadan: data.tinggiBadan !== undefined ? Number(data.tinggiBadan) : pendaftar.tinggiBadan,
        suku: data.suku !== undefined ? data.suku : pendaftar.suku,
        agama: data.agama !== undefined ? data.agama : pendaftar.agama,
        kebutuhanKhusus: data.kebutuhanKhusus !== undefined ? data.kebutuhanKhusus : pendaftar.kebutuhanKhusus,
        pilihanProdi2Id: data.pilihanProdi2Id !== undefined ? (data.pilihanProdi2Id ? Number(data.pilihanProdi2Id) : null) : pendaftar.pilihanProdi2Id,
        pilihanProdi3Id: data.pilihanProdi3Id !== undefined ? (data.pilihanProdi3Id ? Number(data.pilihanProdi3Id) : null) : pendaftar.pilihanProdi3Id,
        isFinalisasi: data.isFinalisasi !== undefined ? Boolean(data.isFinalisasi) : pendaftar.isFinalisasi,
        tanggalFinalisasi: data.isFinalisasi ? new Date() : pendaftar.tanggalFinalisasi,
        isBiodataLengkap: true,
      },
    });

    // Simpan Data Orang Tua jika disertakan
    if (
      data.namaAyah ||
      data.pekerjaanAyah ||
      data.namaIbu ||
      data.pekerjaanIbu ||
      data.penghasilanOrtu ||
      data.noHpOrtu
    ) {
      await prisma.orangTua.upsert({
        where: { pendaftarId: pendaftar.id },
        update: {
          namaAyah: data.namaAyah,
          pekerjaanAyah: data.pekerjaanAyah,
          namaIbu: data.namaIbu,
          pekerjaanIbu: data.pekerjaanIbu,
          penghasilanOrtu: data.penghasilanOrtu,
          noHpOrtu: data.noHpOrtu,
        },
        create: {
          pendaftarId: pendaftar.id,
          namaAyah: data.namaAyah,
          pekerjaanAyah: data.pekerjaanAyah,
          namaIbu: data.namaIbu,
          pekerjaanIbu: data.pekerjaanIbu,
          penghasilanOrtu: data.penghasilanOrtu,
          noHpOrtu: data.noHpOrtu,
        },
      });
    }

    return updated;
  }

  /**
   * Mengambil Data Rekam Medis Calon Mahasiswa yang sedang Login
   */
  async getRekamMedisByUserId(userId: number) {
    const pendaftar = await prisma.pendaftar.findUnique({
      where: { userId },
      include: {
        rekamMedis: true,
        user: { select: { id: true, nama: true, email: true } },
      },
    });

    if (!pendaftar) {
      throw new Error('Data pendaftaran calon mahasiswa tidak ditemukan.');
    }

    return {
      pendaftarId: pendaftar.id,
      noPendaftaran: pendaftar.noPendaftaran,
      nama: pendaftar.user.nama,
      email: pendaftar.user.email,
      rekamMedis: pendaftar.rekamMedis || null,
    };
  }

  /**
   * Simpan / Perbarui Rekam Medis Calon Mahasiswa
   */
  async upsertRekamMedis(userId: number, data: RekamMedisDTO) {
    const pendaftar = await prisma.pendaftar.findUnique({
      where: { userId },
    });

    if (!pendaftar) {
      throw new Error('Data pendaftaran calon mahasiswa tidak ditemukan.');
    }

    const rekamMedis = await prisma.rekamMedis.upsert({
      where: { pendaftarId: pendaftar.id },
      update: {
        golonganDarah: data.golonganDarah,
        rhesus: data.rhesus,
        tinggiBadan: data.tinggiBadan !== undefined ? Number(data.tinggiBadan) : undefined,
        beratBadan: data.beratBadan !== undefined ? Number(data.beratBadan) : undefined,
        riwayatPenyakit: data.riwayatPenyakit,
        riwayatAlergi: data.riwayatAlergi,
        statusButaWarna: data.statusButaWarna,
        isBerkacamata: data.isBerkacamata !== undefined ? Boolean(data.isBerkacamata) : undefined,
        isMerokok: data.isMerokok !== undefined ? Boolean(data.isMerokok) : undefined,
        riwayatOperasi: data.riwayatOperasi,
        riwayatRawatInap: data.riwayatRawatInap,
        kebutuhanKhusus: data.kebutuhanKhusus,
        kontakDaruratNama: data.kontakDaruratNama,
        kontakDaruratHubungan: data.kontakDaruratHubungan,
        kontakDaruratNoHp: data.kontakDaruratNoHp,
        fileSuratKesehatan: data.fileSuratKesehatan,
        fileBebasNarkoba: data.fileBebasNarkoba,
        catatanKesehatan: data.catatanKesehatan,
      },
      create: {
        pendaftarId: pendaftar.id,
        golonganDarah: data.golonganDarah,
        rhesus: data.rhesus,
        tinggiBadan: data.tinggiBadan !== undefined ? Number(data.tinggiBadan) : undefined,
        beratBadan: data.beratBadan !== undefined ? Number(data.beratBadan) : undefined,
        riwayatPenyakit: data.riwayatPenyakit,
        riwayatAlergi: data.riwayatAlergi,
        statusButaWarna: data.statusButaWarna || 'TIDAK',
        isBerkacamata: data.isBerkacamata !== undefined ? Boolean(data.isBerkacamata) : false,
        isMerokok: data.isMerokok !== undefined ? Boolean(data.isMerokok) : false,
        riwayatOperasi: data.riwayatOperasi,
        riwayatRawatInap: data.riwayatRawatInap,
        kebutuhanKhusus: data.kebutuhanKhusus,
        kontakDaruratNama: data.kontakDaruratNama,
        kontakDaruratHubungan: data.kontakDaruratHubungan,
        kontakDaruratNoHp: data.kontakDaruratNoHp,
        fileSuratKesehatan: data.fileSuratKesehatan,
        fileBebasNarkoba: data.fileBebasNarkoba,
        catatanKesehatan: data.catatanKesehatan,
      },
    });

    // Update juga beratBadan & tinggiBadan di profil pendaftar jika terisi
    if (data.beratBadan || data.tinggiBadan) {
      await prisma.pendaftar.update({
        where: { id: pendaftar.id },
        data: {
          beratBadan: data.beratBadan !== undefined ? Number(data.beratBadan) : pendaftar.beratBadan,
          tinggiBadan: data.tinggiBadan !== undefined ? Number(data.tinggiBadan) : pendaftar.tinggiBadan,
        },
      });
    }

    return rekamMedis;
  }
}

export const camabaService = new CamabaService();
