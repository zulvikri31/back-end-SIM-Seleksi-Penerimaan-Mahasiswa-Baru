import prisma from '../config/database';

export interface FilterSyaratSeleksi {
  periodeId?: number;
  gelombangId?: number;
  jalurPendaftaranId?: number;
  jenisSyarat?: string;
  statusDokumen?: string; // 'MENUNGGU', 'VALID', 'DITOLAK'
  search?: string;
  page?: number;
  limit?: number;
}

export class AdminSeleksiService {
  /**
   * 1. Seleksi > Syarat Seleksi (Screenshot 2 Seleksi)
   * Menampilkan daftar berkas syarat calon mahasiswa yang diverifikasi
   */
  async getSyaratSeleksiList(filter: FilterSyaratSeleksi) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 10));
    const skip = (page - 1) * limit

    const where: any = {};

    if (filter.statusDokumen && filter.statusDokumen !== 'all') {
      where.statusVerifikasi = filter.statusDokumen;
    }

    if (filter.jenisSyarat && filter.jenisSyarat !== 'all') {
      where.jenisBerkas = filter.jenisSyarat;
    }

    // Filter via relasi pendaftar
    const pendaftarWhere: any = {};
    if (filter.periodeId) pendaftarWhere.periodeId = Number(filter.periodeId);
    if (filter.gelombangId) pendaftarWhere.gelombangId = Number(filter.gelombangId);
    if (filter.jalurPendaftaranId) pendaftarWhere.jalurPendaftaranId = Number(filter.jalurPendaftaranId);

    if (filter.search && filter.search.trim() !== '') {
      const q = filter.search.trim();
      pendaftarWhere.OR = [
        { noPendaftaran: { contains: q, mode: 'insensitive' } },
        { user: { nama: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (Object.keys(pendaftarWhere).length > 0) {
      where.pendaftar = pendaftarWhere;
    }

    const [total, items] = await Promise.all([
      prisma.berkasPendaftar.count({ where }),
      prisma.berkasPendaftar.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          pendaftar: {
            include: {
              user: true,
              programStudi: true,
              pilihanProdi2: true,
              nilaiSeleksi: true,
            },
          },
        },
      }),
    ]);

    const dataFormatted = items.map((b, idx) => {
      const nilaiSeleksi = b.pendaftar.nilaiSeleksi?.[0]?.nilai || 0;
      return {
        no: skip + idx + 1,
        id: b.id,
        pendaftarId: b.pendaftarId,
        pendaftar: {
          id: b.pendaftar.id,
          nama: b.pendaftar.user.nama,
          noPendaftaran: b.pendaftar.noPendaftaran || `411256${String(b.pendaftar.id).padStart(4, '0')}`,
        },
        syarat: b.jenisBerkas,
        dokumen: b.fileUrl,
        keterangan: b.statusVerifikasi === 'VALID' ? 'Dokumen valid dan sesuai' : 'Menunggu verifikasi admin',
        status: b.statusVerifikasi, // 'MENUNGGU', 'VALID', 'DITOLAK'
        poinSyarat: b.statusVerifikasi === 'VALID' ? 100 : 0,
        poinPilihan: 100,
        nilai: nilaiSeleksi > 0 ? nilaiSeleksi : '-',
      };
    });

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
   * 2. Verifikasi Dokumen Syarat (Valid / Tolak)
   */
  async verifikasiBerkas(berkasId: number, statusVerifikasi: 'VALID' | 'DITOLAK' | 'MENUNGGU', catatan?: string) {
    const updated = await prisma.berkasPendaftar.update({
      where: { id: berkasId },
      data: { statusVerifikasi },
      include: { pendaftar: { include: { user: true } } },
    });

    return {
      success: true,
      message: `Berkas ${updated.jenisBerkas} milik ${updated.pendaftar.user.nama} berhasil diverifikasi: ${statusVerifikasi}`,
      data: updated,
    };
  }

  /**
   * 3. Pengisian / Input Nilai Seleksi
   */
  async inputNilaiSeleksi(data: {
    pendaftarId: number;
    jenisTes: string;
    nilai: number;
    lulusTes?: boolean;
    catatan?: string;
  }) {
    const nilaiNum = Number(data.nilai);
    const isLulus = data.lulusTes !== undefined ? Boolean(data.lulusTes) : nilaiNum >= 70;

    const created = await prisma.nilaiSeleksi.create({
      data: {
        pendaftarId: Number(data.pendaftarId),
        jenisTes: data.jenisTes || 'Tes Potensi Akademik (CBT)',
        nilai: nilaiNum,
        lulusTes: isLulus,
        catatan: data.catatan || null,
      },
      include: { pendaftar: { include: { user: true } } },
    });

    // Otomatis update status pendaftar menjadi ikut seleksi
    await prisma.pendaftar.update({
      where: { id: Number(data.pendaftarId) },
      data: { isIkutSeleksi: true },
    });

    return {
      success: true,
      message: `Nilai seleksi ${created.pendaftar.user.nama} berhasil disimpan (${nilaiNum}).`,
      data: created,
    };
  }

  /**
   * 4. Generate Nilai Seleksi Otomatis (Tombol [✔ Generate Nilai] di Screenshot 2)
   */
  async generateNilaiOtomatis(pendaftarIds: number[]) {
    if (!pendaftarIds || pendaftarIds.length === 0) {
      throw new Error('Pendaftar ID wajib disertakan.');
    }

    const results = [];
    for (const pid of pendaftarIds) {
      // Buat nilai random realistis 75 - 95
      const randomNilai = Math.floor(Math.random() * 21) + 75;
      const created = await prisma.nilaiSeleksi.create({
        data: {
          pendaftarId: pid,
          jenisTes: 'Tes Potensi Akademik (CBT)',
          nilai: randomNilai,
          lulusTes: true,
          catatan: 'Generated otomatis oleh sistem SPMB',
        },
      });
      await prisma.pendaftar.update({
        where: { id: pid },
        data: { isIkutSeleksi: true },
      });
      results.push({ pendaftarId: pid, nilai: randomNilai });
    }

    return {
      success: true,
      message: `Berhasil generate nilai seleksi untuk ${pendaftarIds.length} peserta.`,
      data: results,
    };
  }

  /**
   * 5. Batal Nilai (Tombol [✖ Batal Nilai] di Screenshot 2)
   */
  async batalNilai(pendaftarIds: number[]) {
    if (!pendaftarIds || pendaftarIds.length === 0) {
      throw new Error('Pendaftar ID wajib disertakan.');
    }

    await prisma.nilaiSeleksi.deleteMany({
      where: { pendaftarId: { in: pendaftarIds } },
    });

    return {
      success: true,
      message: `Nilai seleksi untuk ${pendaftarIds.length} peserta berhasil dibatalkan.`,
    };
  }

  /**
   * 6. Seleksi > KIP Kuliah
   */
  async getKipKuliahList() {
    const items = await prisma.pendaftar.findMany({
      where: {
        OR: [
          { isKip: true },
          { jalurPendaftaran: { nama: { contains: 'KIP', mode: 'insensitive' } } },
        ],
      },
      include: { user: true, programStudi: true, jalurPendaftaran: true, orangTua: true },
    });

    return items.map((p, idx) => ({
      no: idx + 1,
      id: p.id,
      noPendaftaran: p.noPendaftaran,
      nama: p.user.nama,
      email: p.user.email,
      prodi: p.programStudi.namaProdi,
      jalur: p.jalurPendaftaran.nama,
      statusKelulusan: p.statusKelulusan,
      penghasilanOrtu: p.orangTua?.penghasilanOrtu || '< Rp 2.000.000',
      statusKip: p.isKip ? 'Terverifikasi KIP' : 'Dalam Peninjauan',
    }));
  }
}

export const adminSeleksiService = new AdminSeleksiService();
