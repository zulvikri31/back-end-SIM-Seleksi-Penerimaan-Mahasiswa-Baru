import prisma from '../config/database';

export interface FilterPengaturanPeriode {
  periodeId?: number;
  gelombangId?: number;
  jalurPendaftaranId?: number;
  sistemKuliahId?: number;
  status?: string; // 'all', 'BUKA', 'TUTUP'
  search?: string;
  page?: number;
  limit?: number;
}

export class AdminPengaturanService {
  /**
   * 1. Pengaturan > Periode Pendaftaran (Screenshot 1 Pengaturan)
   * Mengambil daftar jalur yang dibuka per periode, gelombang, biaya, status, kuota
   */
  async getPeriodePendaftaranList(filter: FilterPengaturanPeriode) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filter.periodeId) where.periodeId = Number(filter.periodeId);
    if (filter.gelombangId) where.gelombangId = Number(filter.gelombangId);
    if (filter.jalurPendaftaranId) where.jalurPendaftaranId = Number(filter.jalurPendaftaranId);
    if (filter.sistemKuliahId) where.sistemKuliahId = Number(filter.sistemKuliahId);

    if (filter.status === 'BUKA') where.isBuka = true;
    if (filter.status === 'TUTUP') where.isBuka = false;

    if (filter.search && filter.search.trim() !== '') {
      const q = filter.search.trim();
      where.OR = [
        { jalurPendaftaran: { nama: { contains: q, mode: 'insensitive' } } },
        { periode: { nama: { contains: q, mode: 'insensitive' } } },
        { gelombang: { nama: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.pembukaanJalur.count({ where }),
      prisma.pembukaanJalur.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          periode: true,
          gelombang: true,
          jalurPendaftaran: true,
          sistemKuliah: true,
          programStudi: true,
        },
      }),
    ]);

    const dataFormatted = items.map((pj, idx) => ({
      no: skip + idx + 1,
      id: pj.id,
      namaPeriodePendaftaran: `${pj.periode.nama} - ${pj.gelombang.nama}`,
      periode: pj.periode.nama,
      gelombang: pj.gelombang.nama,
      jalurPendaftaran: `${pj.jalurPendaftaran.nama} - ${pj.sistemKuliah.nama}`,
      programStudi: `${pj.programStudi.jenjang} - ${pj.programStudi.namaProdi}`,
      biayaPendaftaran: pj.biayaPendaftaran,
      biayaFormatted: `Rp ${Number(pj.biayaPendaftaran).toLocaleString('id-ID')}`,
      kuota: pj.kuota,
      tanggalBuka: pj.tanggalBuka,
      tanggalTutup: pj.tanggalTutup,
      isBuka: pj.isBuka,
      statusLabel: pj.isBuka ? 'Buka' : 'Tutup',
      funnelPendaftaran: `Kuota: ${pj.kuota} mhs`,
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
   * Tambah / Buka Jalur Pendaftaran Baru
   */
  async createPeriodePendaftaran(data: {
    periodeId: number;
    gelombangId: number;
    jalurPendaftaranId: number;
    sistemKuliahId: number;
    programStudiId: number;
    biayaPendaftaran: number;
    kuota?: number;
    tanggalBuka?: string;
    tanggalTutup?: string;
    isBuka?: boolean;
  }) {
    const created = await prisma.pembukaanJalur.create({
      data: {
        periodeId: Number(data.periodeId),
        gelombangId: Number(data.gelombangId),
        jalurPendaftaranId: Number(data.jalurPendaftaranId),
        sistemKuliahId: Number(data.sistemKuliahId),
        programStudiId: Number(data.programStudiId),
        biayaPendaftaran: Number(data.biayaPendaftaran || 0),
        kuota: Number(data.kuota || 50),
        tanggalBuka: data.tanggalBuka ? new Date(data.tanggalBuka) : null,
        tanggalTutup: data.tanggalTutup ? new Date(data.tanggalTutup) : null,
        isBuka: data.isBuka ?? true,
      },
      include: {
        periode: true,
        gelombang: true,
        jalurPendaftaran: true,
        sistemKuliah: true,
        programStudi: true,
      },
    });

    return {
      success: true,
      message: `Jalur ${created.jalurPendaftaran.nama} (${created.periode.nama}) berhasil dibuka.`,
      data: created,
    };
  }

  /**
   * Update Status Buka / Tutup Jalur
   */
  async toggleStatusJalur(id: number, isBuka: boolean) {
    const updated = await prisma.pembukaanJalur.update({
      where: { id },
      data: { isBuka },
    });

    return {
      success: true,
      message: `Status jalur berhasil diubah menjadi ${isBuka ? 'Buka' : 'Tutup'}.`,
      data: updated,
    };
  }

  /**
   * Hapus Pengaturan Jalur
   */
  async deletePeriodePendaftaran(id: number) {
    await prisma.pembukaanJalur.delete({ where: { id } });
    return { success: true, message: `Pengaturan jalur ID ${id} berhasil dihapus.` };
  }

  /**
   * 2. Pengaturan > UKT (Uang Kuliah Tunggal)
   */
  async getPengaturanUkt() {
    return [
      { kelompok: 'UKT 1', nominal: 2500000, keterangan: 'Penghasilan Ortu < Rp 2.000.000' },
      { kelompok: 'UKT 2', nominal: 3500000, keterangan: 'Penghasilan Ortu Rp 2.000.000 - Rp 4.000.000' },
      { kelompok: 'UKT 3', nominal: 4500000, keterangan: 'Penghasilan Ortu Rp 4.000.000 - Rp 7.000.000' },
      { kelompok: 'UKT 4', nominal: 5500000, keterangan: 'Penghasilan Ortu > Rp 7.000.000' },
      { kelompok: 'KIP-Kuliah', nominal: 0, keterangan: 'Bebas Biaya (Subsidi Pemerintah Kemdikbud)' },
    ];
  }

  /**
   * 3. Pengaturan Umum PMB
   */
  async getPengaturanUmum() {
    return {
      namaAplikasi: 'SIM Seleksi Penerimaan Mahasiswa Baru UIKA Bogor',
      tahunAkademikAktif: '2026/2027',
      kontakHelpdesk: '+62 812-9988-7766',
      emailHelpdesk: 'pmb@uika-bogor.ac.id',
      bankPembayaran: 'Bank Syariah Indonesia (BSI) & Bank Muamalat',
      nomorRekeningPMB: '7001234567 a.n Universitas Ibn Khaldun',
      isPendaftaranOnlineBuka: true,
      isUjianCbtOnline: true,
    };
  }
}

export const adminPengaturanService = new AdminPengaturanService();
