import prisma from '../config/database';

export interface FilterOds {
  periodeId?: number;
  statusOds?: string;
  isOdsDihubungi?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export class AdminOdsService {
  /**
   * 1. Mengambil Daftar Calon Mahasiswa One Day Service (ODS)
   */
  async getOdsList(filter: FilterOds) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filter.periodeId) where.periodeId = Number(filter.periodeId);
    if (filter.statusOds && filter.statusOds !== 'all') {
      where.statusOds = filter.statusOds;
    }
    if (filter.isOdsDihubungi !== undefined) {
      where.isOdsDihubungi = filter.isOdsDihubungi;
    }

    if (filter.search && filter.search.trim() !== '') {
      const q = filter.search.trim();
      where.OR = [
        { noPendaftaran: { contains: q, mode: 'insensitive' } },
        { user: { nama: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { noHp: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.pendaftar.count({ where }),
      prisma.pendaftar.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          user: true,
          programStudi: true,
          pilihanProdi2: true,
          pilihanProdi3: true,
          jalurPendaftaran: true,
          gelombang: true,
          sistemKuliah: true,
        },
      }),
    ]);

    const dataFormatted = items.map((p, idx) => ({
      no: skip + idx + 1,
      id: p.id,
      noPendaftaran: p.noPendaftaran || `ODS-${String(p.id).padStart(4, '0')}`,
      nama: p.user.nama,
      email: p.user.email,
      noHp: p.noHp || '-',
      prodiPilihan: {
        pilihan1: p.programStudi ? `${p.programStudi.jenjang} - ${p.programStudi.namaProdi}` : '-',
        pilihan2: p.pilihanProdi2 ? `${p.pilihanProdi2.jenjang} - ${p.pilihanProdi2.namaProdi}` : '-',
        pilihan3: p.pilihanProdi3 ? `${p.pilihanProdi3.jenjang} - ${p.pilihanProdi3.namaProdi}` : '-',
      },
      jalur: p.jalurPendaftaran.nama,
      statusOds: p.statusOds, // PEMINAT, PENDAFTAR, PESERTA_SELEKSI, DAFTAR_ULANG
      isOdsDihubungi: p.isOdsDihubungi, // true: Sudah Dihubungi, false: Belum
      catatanOds: p.catatanOds || '-',
      tanggalDaftar: p.createdAt,
    }));

    return {
      data: dataFormatted,
      pagination: {
        totalItems: total,
        currentPage: page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Helper untuk mencari pendaftar secara aman (mendukung ID integer, noPendaftaran, nomorUjian, email)
   */
  private async findPendaftar(identifier: number | string) {
    const str = String(identifier).trim();
    const num = Number(str);
    const isValidIntId = !isNaN(num) && Number.isInteger(num) && num > 0 && num <= 2147483647;

    if (isValidIntId) {
      const p = await prisma.pendaftar.findUnique({
        where: { id: num },
        include: { user: true },
      });
      if (p) return p;
    }

    return prisma.pendaftar.findFirst({
      where: {
        OR: [
          { noPendaftaran: str },
          { nomorUjian: str },
          { user: { email: str } },
        ],
      },
      include: { user: true },
    });
  }

  /**
   * 2. Catat Follow-up / Hubungi Pendaftar ODS (Telepon / WhatsApp)
   */
  async hubungiPendaftar(pendaftarId: number | string, catatan: string) {
    const pendaftar = await this.findPendaftar(pendaftarId);

    if (!pendaftar) {
      throw new Error(`Pendaftar "${pendaftarId}" tidak ditemukan.`);
    }

    const updated = await prisma.pendaftar.update({
      where: { id: pendaftar.id },
      data: {
        isOdsDihubungi: true,
        catatanOds: catatan,
      },
      include: { user: true },
    });

    return {
      success: true,
      message: `Follow-up ODS untuk ${updated.user.nama} berhasil disimpan.`,
      data: updated,
    };
  }

  /**
   * 3. Update Status Tahapan One Day Service
   */
  async updateStatusOds(pendaftarId: number | string, statusOds: 'PEMINAT' | 'PENDAFTAR' | 'PESERTA_SELEKSI' | 'DAFTAR_ULANG') {
    const pendaftar = await this.findPendaftar(pendaftarId);

    if (!pendaftar) {
      throw new Error(`Pendaftar "${pendaftarId}" tidak ditemukan.`);
    }

    const updated = await prisma.pendaftar.update({
      where: { id: pendaftar.id },
      data: { statusOds },
      include: { user: true },
    });

    return {
      success: true,
      message: `Status ODS pendaftar ${updated.user.nama} berhasil diperbarui menjadi ${statusOds}.`,
      data: updated,
    };
  }

  /**
   * 4. Ringkasan Statistik ODS (Hari Ini & Total)
   */
  async getOdsStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalOds, hariIni, sudahDihubungi, belumDihubungi] = await Promise.all([
      prisma.pendaftar.count(),
      prisma.pendaftar.count({ where: { createdAt: { gte: today } } }),
      prisma.pendaftar.count({ where: { isOdsDihubungi: true } }),
      prisma.pendaftar.count({ where: { isOdsDihubungi: false } }),
    ]);

    return {
      totalPendaftarOds: totalOds,
      pendaftarHariIni: hariIni,
      sudahDihubungi,
      belumDihubungi,
    };
  }
}

export const adminOdsService = new AdminOdsService();
