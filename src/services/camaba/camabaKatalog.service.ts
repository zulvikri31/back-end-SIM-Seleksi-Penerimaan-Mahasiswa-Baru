import prisma from '../../config/database';

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

export class CamabaKatalogService {
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
        statusJalur:
          activeJalurCount > 0
            ? `Tersedia ${activeJalurCount} jalur pendaftaran`
            : 'Belum ada jalur pendaftaran yang dibuka',
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
        sistemKuliah: item.sistemKuliah.nama,
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
}

export const camabaKatalogService = new CamabaKatalogService();

