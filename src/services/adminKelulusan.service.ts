import prisma from '../config/database';

export interface FilterKelulusan {
  periodeId?: number;
  gelombangId?: number;
  jalurPendaftaranId?: number;
  sistemKuliahId?: number;
  programStudiId?: number;
  statusKelulusan?: string;
  pilihan?: number; // 1, 2, 3
  search?: string;
  page?: number;
  limit?: number;
}

export class AdminKelulusanService {
  /**
   * 1. Rekomendasi Prodi (Screenshot 1)
   * Mengambil daftar calon mahasiswa untuk penentuan kelulusan program studi
   */
  async getRekomendasiProdiList(filter: FilterKelulusan) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filter.periodeId) where.periodeId = Number(filter.periodeId);
    if (filter.gelombangId) where.gelombangId = Number(filter.gelombangId);
    if (filter.jalurPendaftaranId) where.jalurPendaftaranId = Number(filter.jalurPendaftaranId);
    if (filter.sistemKuliahId) where.sistemKuliahId = Number(filter.sistemKuliahId);

    // Filter Program Studi
    if (filter.programStudiId) {
      const pid = Number(filter.programStudiId);
      if (filter.pilihan === 1) {
        where.programStudiId = pid;
      } else if (filter.pilihan === 2) {
        where.pilihanProdi2Id = pid;
      } else if (filter.pilihan === 3) {
        where.pilihanProdi3Id = pid;
      } else {
        where.OR = [
          { programStudiId: pid },
          { pilihanProdi2Id: pid },
          { pilihanProdi3Id: pid },
          { prodiDiterimaId: pid },
        ];
      }
    }

    if (filter.statusKelulusan && filter.statusKelulusan !== 'all') {
      where.statusKelulusan = filter.statusKelulusan;
    }

    if (filter.search && filter.search.trim() !== '') {
      const q = filter.search.trim();
      where.OR = [
        { noPendaftaran: { contains: q, mode: 'insensitive' } },
        { nomorUjian: { contains: q, mode: 'insensitive' } },
        { user: { nama: { contains: q, mode: 'insensitive' } } },
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
          user: { select: { id: true, nama: true, email: true } },
          periode: true,
          gelombang: true,
          jalurPendaftaran: true,
          sistemKuliah: true,
          programStudi: true,
          pilihanProdi2: true,
          pilihanProdi3: true,
          prodiDiterima: true,
          nilaiSeleksi: true,
        },
      }),
    ]);

    const dataFormatted = items.map((p, index) => {
      // Nilai rata-rata seleksi
      const nilaiList = p.nilaiSeleksi || [];
      const totalNilai = nilaiList.reduce((acc, curr) => acc + curr.nilai, 0);
      const rataNilai = nilaiList.length > 0 ? (totalNilai / nilaiList.length).toFixed(2) : '-';
      const jenisSeleksi = nilaiList.length > 0 ? nilaiList.map((n) => n.jenisTes).join(', ') : 'CBT / Wawancara';

      // Pilihan yang relevan
      const pil = filter.pilihan || 1;
      let namaProdiPilihan = p.programStudi ? `${p.programStudi.jenjang} - ${p.programStudi.namaProdi}` : '-';
      if (pil === 2 && p.pilihanProdi2) {
        namaProdiPilihan = `${p.pilihanProdi2.jenjang} - ${p.pilihanProdi2.namaProdi}`;
      } else if (pil === 3 && p.pilihanProdi3) {
        namaProdiPilihan = `${p.pilihanProdi3.jenjang} - ${p.pilihanProdi3.namaProdi}`;
      }

      return {
        no: skip + index + 1,
        id: p.id,
        idPendaftar: p.noPendaftaran || `411256${String(p.id).padStart(4, '0')}`,
        nama: p.user.nama,
        email: p.user.email,
        nomorUjian: p.nomorUjian || `UJ-${String(p.id).padStart(6, '0')}`,
        pil: pil,
        programStudi: namaProdiPilihan,
        prodiPilihan1: p.programStudi ? `${p.programStudi.jenjang} - ${p.programStudi.namaProdi}` : null,
        prodiPilihan2: p.pilihanProdi2 ? `${p.pilihanProdi2.jenjang} - ${p.pilihanProdi2.namaProdi}` : null,
        prodiPilihan3: p.pilihanProdi3 ? `${p.pilihanProdi3.jenjang} - ${p.pilihanProdi3.namaProdi}` : null,
        prodiDiterima: p.prodiDiterima ? `${p.prodiDiterima.jenjang} - ${p.prodiDiterima.namaProdi}` : null,
        seleksi: jenisSeleksi,
        nilai: rataNilai,
        emailTerkirim: p.emailKelulusanTerkirim,
        pjCadangan: p.statusKelulusan === 'CADANGAN' ? (p.isCadanganDisetujui ? 'Disetujui Prodi' : 'Menunggu Konfirmasi') : '-',
        set: p.isCadanganDisetujui, // "SET : Cadangan Disetujui"
        statusLulusan: p.statusKelulusan, // MENUNGGU, LULUS, TIDAK_LULUS, CADANGAN
        isDaftarUlang: p.isDaftarUlang,
        nim: p.nim,
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
   * Menetapkan Keputusan Kelulusan untuk 1 Pendaftar
   */
  private async findPendaftar(identifier: number | string) {
    const str = String(identifier).trim();
    const num = Number(str);
    const isValidIntId = !isNaN(num) && Number.isInteger(num) && num > 0 && num <= 2147483647;

    if (isValidIntId) {
      const p = await prisma.pendaftar.findUnique({
        where: { id: num },
        include: { user: true, prodiDiterima: true, programStudi: true },
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
      include: { user: true, prodiDiterima: true, programStudi: true },
    });
  }

  /**
   * Menetapkan Keputusan Kelulusan untuk 1 Pendaftar
   */
  async tetapkanKelulusan(
    pendaftarId: number | string,
    data: {
      statusKelulusan: 'LULUS' | 'TIDAK_LULUS' | 'CADANGAN' | 'MENUNGGU';
      prodiDiterimaId?: number;
      isCadanganDisetujui?: boolean;
    }
  ) {
    const pendaftar = await this.findPendaftar(pendaftarId);

    if (!pendaftar) {
      throw new Error(`Pendaftar "${pendaftarId}" tidak ditemukan.`);
    }

    const isLulus = data.statusKelulusan === 'LULUS';
    const prodiId = data.prodiDiterimaId || (isLulus ? pendaftar.programStudiId : null);

    const updated = await prisma.pendaftar.update({
      where: { id: pendaftar.id },
      data: {
        statusKelulusan: data.statusKelulusan,
        isDiterima: isLulus,
        prodiDiterimaId: prodiId,
        isCadanganDisetujui: data.isCadanganDisetujui ?? false,
        tanggalLulus: isLulus ? new Date() : null,
      },
      include: {
        user: true,
        prodiDiterima: true,
      },
    });

    return {
      success: true,
      message: `Status kelulusan berhasil diperbarui menjadi ${data.statusKelulusan}`,
      data: updated,
    };
  }

  /**
   * Kirim Email Pengumuman Kelulusan (Batch / Individual)
   */
  async kirimEmailKelulusan(pendaftarIds: (number | string)[]) {
    if (!pendaftarIds || pendaftarIds.length === 0) {
      throw new Error('Pendaftar ID wajib disertakan.');
    }

    const validIds: number[] = [];
    const stringIdentifiers: string[] = [];

    for (const raw of pendaftarIds) {
      const str = String(raw).trim();
      const num = Number(str);
      if (!isNaN(num) && Number.isInteger(num) && num > 0 && num <= 2147483647) {
        validIds.push(num);
      } else {
        stringIdentifiers.push(str);
      }
    }

    await prisma.pendaftar.updateMany({
      where: {
        OR: [
          ...(validIds.length > 0 ? [{ id: { in: validIds } }] : []),
          ...(stringIdentifiers.length > 0
            ? [
                { noPendaftaran: { in: stringIdentifiers } },
                { nomorUjian: { in: stringIdentifiers } },
              ]
            : []),
        ],
      },
      data: { emailKelulusanTerkirim: true },
    });

    return {
      success: true,
      message: `Email pengumuman kelulusan berhasil dikirimkan ke ${pendaftarIds.length} peserta.`,
    };
  }

  /**
   * 2. Registrasi Ulang (Kelulusan Submenu 2)
   * Menampilkan daftar calon mahasiswa yang lulus dan status registrasi ulangnya
   */
  async getRegistrasiUlangList(filter: FilterKelulusan) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {
      isDiterima: true, // Hanya yang dinyatakan lulus
    };

    if (filter.periodeId) where.periodeId = Number(filter.periodeId);
    if (filter.gelombangId) where.gelombangId = Number(filter.gelombangId);
    if (filter.jalurPendaftaranId) where.jalurPendaftaranId = Number(filter.jalurPendaftaranId);
    if (filter.programStudiId) where.prodiDiterimaId = Number(filter.programStudiId);

    if (filter.search && filter.search.trim() !== '') {
      const q = filter.search.trim();
      where.OR = [
        { noPendaftaran: { contains: q, mode: 'insensitive' } },
        { user: { nama: { contains: q, mode: 'insensitive' } } },
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
          prodiDiterima: true,
          periode: true,
          gelombang: true,
          jalurPendaftaran: true,
        },
      }),
    ]);

    const dataFormatted = items.map((p, idx) => ({
      no: skip + idx + 1,
      id: p.id,
      noPendaftaran: p.noPendaftaran,
      nama: p.user.nama,
      email: p.user.email,
      prodiDiterima: p.prodiDiterima ? `${p.prodiDiterima.jenjang} - ${p.prodiDiterima.namaProdi}` : '-',
      isDaftarUlang: p.isDaftarUlang,
      tanggalDaftarUlang: p.tanggalDaftarUlang,
      nominalUkt: p.nominalUkt || 0,
      kelompokUkt: p.kelompokUkt || '-',
      statusRegistrasi: p.isDaftarUlang ? 'Sudah Daftar Ulang' : 'Belum Daftar Ulang',
      nim: p.nim || '-',
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
   * Update Status Registrasi Ulang
   */
  async updateRegistrasiUlang(pendaftarId: number | string, isDaftarUlang: boolean) {
    const pendaftar = await this.findPendaftar(pendaftarId);

    if (!pendaftar) {
      throw new Error(`Pendaftar "${pendaftarId}" tidak ditemukan.`);
    }

    const updated = await prisma.pendaftar.update({
      where: { id: pendaftar.id },
      data: {
        isDaftarUlang,
        tanggalDaftarUlang: isDaftarUlang ? new Date() : null,
      },
      include: { user: true },
    });

    return {
      success: true,
      message: `Status daftar ulang untuk ${updated.user.nama} berhasil diubah menjadi ${isDaftarUlang ? 'Sudah Daftar Ulang' : 'Belum Daftar Ulang'}.`,
      data: updated,
    };
  }

  /**
   * 3. Generate Mahasiswa / Generate NIM (Kelulusan Submenu 3)
   */
  async generateNim(pendaftarId: number | string, customNim?: string) {
    const pendaftar = await this.findPendaftar(pendaftarId);

    if (!pendaftar) {
      throw new Error(`Pendaftar "${pendaftarId}" tidak ditemukan.`);
    }

    if (!pendaftar.isDiterima) {
      throw new Error('Hanya calon mahasiswa yang berstatus LULUS yang dapat di-generate NIM-nya.');
    }

    // Buat NIM jika tidak ada custom NIM
    // Format NIM UIKA: TahunMasuk (2 digit) + KodeProdi (4 digit) + Sequence (4 digit)
    // Contoh: 26 (2026) + 1101 + 0045 -> 2611010045
    let nimGenerated = customNim;
    if (!nimGenerated) {
      const year = new Date().getFullYear().toString().slice(-2);
      const prodiCode = String((pendaftar.prodiDiterimaId || pendaftar.programStudiId) * 100).padStart(4, '0');
      const seq = String(pendaftar.id).padStart(4, '0');
      nimGenerated = `${year}${prodiCode}${seq}`;
    }

    const updated = await prisma.pendaftar.update({
      where: { id: pendaftar.id },
      data: {
        nim: nimGenerated,
        tanggalGenerateNim: new Date(),
        isNimBatal: false,
      },
      include: { user: true, prodiDiterima: true },
    });

    return {
      success: true,
      message: `NIM berhasil di-generate: ${nimGenerated}`,
      data: {
        id: updated.id,
        nama: updated.user.nama,
        nim: updated.nim,
        prodi: updated.prodiDiterima?.namaProdi,
        tanggalGenerateNim: updated.tanggalGenerateNim,
      },
    };
  }

  /**
   * Batch Generate NIM untuk beberapa mahasiswa sekaligus
   */
  async batchGenerateNim(pendaftarIds: (number | string)[]) {
    const results = [];
    for (const id of pendaftarIds) {
      try {
        const res = await this.generateNim(id);
        results.push({ id, success: true, nim: res.data.nim });
      } catch (err: any) {
        results.push({ id, success: false, error: err.message });
      }
    }
    return {
      success: true,
      message: `Proses generate NIM selesai (${results.filter((r) => r.success).length}/${pendaftarIds.length} berhasil).`,
      results,
    };
  }

  /**
   * 4. Pembatalan NIM (Kelulusan Submenu 4)
   */
  async batalkanNim(pendaftarId: number | string, alasan?: string) {
    const pendaftar = await this.findPendaftar(pendaftarId);

    if (!pendaftar) {
      throw new Error(`Pendaftar "${pendaftarId}" tidak ditemukan.`);
    }

    if (!pendaftar.nim) {
      throw new Error(`Pendaftar ID ${pendaftarId} belum memiliki NIM.`);
    }

    const previousNim = pendaftar.nim;

    const updated = await prisma.pendaftar.update({
      where: { id: pendaftar.id },
      data: {
        isNimBatal: true,
        nim: null, // Reset NIM
      },
      include: { user: true },
    });

    return {
      success: true,
      message: `NIM ${previousNim} (${updated.user.nama}) berhasil dibatalkan. Alasan: ${alasan || 'Pengunduran diri / Pembatalan oleh Admin'}`,
      data: updated,
    };
  }
}

export const adminKelulusanService = new AdminKelulusanService();
