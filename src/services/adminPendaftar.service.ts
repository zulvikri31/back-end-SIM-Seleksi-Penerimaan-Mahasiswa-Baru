import prisma from '../config/database';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_fallback_key';

export interface FilterPendaftarAdmin {
  periodeId?: number;
  gelombangId?: number;
  jalurPendaftaranId?: number;
  sistemKuliahId?: number;
  programStudiId?: number;
  statusPendaftar?: string;
  statusKelulusan?: string;
  pilihan?: number; // 1, 2, atau 3
  search?: string;
  searchBy?: string; // 'all', 'nama_kode', 'jalur', 'prodi', 'kontak', 'nik', 'nim'
  page?: number;
  limit?: number;
}

export class AdminPendaftarService {
  /**
   * Mengambil seluruh opsi dropdown untuk halaman Pendaftar (Sesuai Screenshot Pendaftar UIKA)
   * Tim Front-End tinggal binding langsung tanpa dummy!
   */
  async getDropdownOptions() {
    const [periodes, gelombangs, jalurs, sistems, prodis] = await Promise.all([
      prisma.periode.findMany({ orderBy: { id: 'desc' } }),
      prisma.gelombang.findMany({ orderBy: { id: 'asc' } }),
      prisma.jalurPendaftaran.findMany({ orderBy: { id: 'asc' } }),
      prisma.sistemKuliah.findMany({ orderBy: { id: 'asc' } }),
      prisma.programStudi.findMany({ orderBy: { id: 'asc' } }),
    ]);

    return {
      periode: periodes.map((p) => ({
        value: p.id,
        label: p.nama,
        kode: p.kode,
        isActive: p.isActive,
      })),
      gelombang: gelombangs.map((g) => ({
        value: g.id,
        label: g.nama,
      })),
      jalurPendaftaran: jalurs.map((j) => ({
        value: j.id,
        label: j.nama,
      })),
      sistemKuliah: sistems.map((s) => ({
        value: s.id,
        label: s.nama,
      })),
      unitProgramStudi: prodis.map((pr) => ({
        value: pr.id,
        label: `${pr.jenjang} - ${pr.namaProdi}`,
        jenjang: pr.jenjang,
        fakultas: pr.fakultas,
      })),
      statusPendaftar: [
        { value: 'all', label: '-- Semua Status Pendaftar --' },
        { value: 'BELUM_FINALISASI', label: 'Belum Finalisasi' },
        { value: 'SUDAH_FINALISASI', label: 'Sudah Finalisasi' },
        { value: 'BELUM_DITERIMA', label: 'Belum Diterima Prodi' },
        { value: 'LULUS', label: 'Lulus' },
        { value: 'SUDAH_DAFTAR_ULANG', label: 'Sudah Daftar Ulang' },
        { value: 'BELUM_NIM', label: 'Belum Memiliki NIM' },
        { value: 'SUDAH_NIM', label: 'Sudah Memiliki NIM' },
      ],
      pilihan: [
        { value: '', label: '-- Semua Pilihan --' },
        { value: '1', label: 'Pilihan 1' },
        { value: '2', label: 'Pilihan 2' },
        { value: '3', label: 'Pilihan 3' },
      ],
      kategoriPencarian: [
        { value: 'all', label: '-- Semua --' },
        { value: 'nama_kode', label: 'Nama & Kode Pendaftar' },
        { value: 'jalur', label: 'Jalur Pendaftaran' },
        { value: 'prodi', label: 'Program Studi' },
        { value: 'kontak', label: 'Kontak' },
        { value: 'nik', label: 'NIK / No. KTP' },
        { value: 'nim', label: 'NIM Mahasiswa' },
      ],
    };
  }

  /**
   * Mengambil daftar biodata pendaftar dengan 8 filter (Sesuai Screenshot Pendaftar)
   */
  async getPendaftarList(filter: FilterPendaftarAdmin) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filter.periodeId) where.periodeId = Number(filter.periodeId);
    if (filter.gelombangId) where.gelombangId = Number(filter.gelombangId);
    if (filter.jalurPendaftaranId) where.jalurPendaftaranId = Number(filter.jalurPendaftaranId);
    if (filter.sistemKuliahId) where.sistemKuliahId = Number(filter.sistemKuliahId);

    // Filter Prodi (Bisa di pilihan 1, 2, atau 3)
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
        ];
      }
    }

    // Filter Status Pendaftar Sesuai Badges UIKA
    if (filter.statusPendaftar && filter.statusPendaftar !== 'all') {
      const st = filter.statusPendaftar.toUpperCase();
      if (st === 'BELUM_FINALISASI') {
        where.isFinalisasi = false;
      } else if (st === 'SUDAH_FINALISASI') {
        where.isFinalisasi = true;
      } else if (st === 'BELUM_DITERIMA') {
        where.isFinalisasi = true;
        where.isDiterima = false;
      } else if (st === 'LULUS') {
        where.isDiterima = true;
      } else if (st === 'SUDAH_DAFTAR_ULANG' || st === 'DAFTAR_ULANG') {
        where.isDaftarUlang = true;
      } else if (st === 'BELUM_NIM') {
        where.isDiterima = true;
        where.nim = null;
      } else if (st === 'SUDAH_NIM') {
        where.nim = { not: null };
      } else {
        where.statusPendaftar = filter.statusPendaftar;
      }
    }

    if (filter.statusKelulusan && filter.statusKelulusan !== 'all') {
      where.statusKelulusan = filter.statusKelulusan;
    }

    // Filter Pencarian Dinamis Sesuai Dropdown Kategori (SearchBy)
    if (filter.search && filter.search.trim() !== '') {
      const q = filter.search.trim();
      const by = filter.searchBy || 'all';

      if (by === 'nama_kode') {
        where.OR = [
          { noPendaftaran: { contains: q, mode: 'insensitive' } },
          { user: { nama: { contains: q, mode: 'insensitive' } } },
        ];
      } else if (by === 'kontak') {
        where.OR = [
          { user: { email: { contains: q, mode: 'insensitive' } } },
          { noHp: { contains: q, mode: 'insensitive' } },
        ];
      } else if (by === 'nik') {
        where.nik = { contains: q, mode: 'insensitive' };
      } else if (by === 'nim') {
        where.nim = { contains: q, mode: 'insensitive' };
      } else if (by === 'jalur') {
        where.jalurPendaftaran = { nama: { contains: q, mode: 'insensitive' } };
      } else if (by === 'prodi') {
        where.OR = [
          { programStudi: { namaProdi: { contains: q, mode: 'insensitive' } } },
          { pilihanProdi2: { namaProdi: { contains: q, mode: 'insensitive' } } },
          { pilihanProdi3: { namaProdi: { contains: q, mode: 'insensitive' } } },
        ];
      } else {
        // 'all' / default
        where.OR = [
          { noPendaftaran: { contains: q, mode: 'insensitive' } },
          { nomorUjian: { contains: q, mode: 'insensitive' } },
          { user: { nama: { contains: q, mode: 'insensitive' } } },
          { user: { email: { contains: q, mode: 'insensitive' } } },
          { noHp: { contains: q, mode: 'insensitive' } },
          { nik: { contains: q, mode: 'insensitive' } },
          { nim: { contains: q, mode: 'insensitive' } },
        ];
      }
    }

    const [total, items] = await Promise.all([
      prisma.pendaftar.count({ where }),
      prisma.pendaftar.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          user: { select: { id: true, nama: true, email: true, role: true } },
          periode: true,
          gelombang: true,
          jalurPendaftaran: true,
          sistemKuliah: true,
          programStudi: true,
          pilihanProdi2: true,
          pilihanProdi3: true,
          prodiDiterima: true,
          nilaiSeleksi: true,
          berkas: true,
        },
      }),
    ]);

    const dataFormatted = items.map((p) => {
      // Inisial foto & URL foto jika ada
      const initials = p.user.nama
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      const fotoBerkas = p.berkas?.find((b) => b.jenisBerkas.toLowerCase().includes('foto'));
      const fotoUrl = fotoBerkas?.fileUrl || null;

      // Badges status pendaftar ber-warna sesuai UIKA (Screenshot Pendaftar)
      const badges: { label: string; variant: string }[] = [];
      if (!p.isFinalisasi) badges.push({ label: 'Belum Finalisasi', variant: 'danger' });
      if (p.isFinalisasi && !p.isDiterima) badges.push({ label: 'Belum Diterima Prodi', variant: 'warning' });
      if (p.isDiterima) badges.push({ label: 'Lulus', variant: 'success' });
      if (p.isDaftarUlang) badges.push({ label: 'Sudah Daftar Ulang', variant: 'success' });
      if (p.isDiterima && !p.nim) badges.push({ label: 'Belum Memiliki NIM', variant: 'danger' });
      if (p.nim) badges.push({ label: 'Sudah Memiliki NIM', variant: 'success' });

      return {
        id: p.id,
        userId: p.userId,
        kodePendaftar: p.noPendaftaran || `411256${String(p.id).padStart(4, '0')}`,
        nomorUjian: p.nomorUjian,
        nama: p.user.nama,
        email: p.user.email,
        noHp: p.noHp || '-',
        fotoInitials: initials,
        fotoUrl: fotoUrl,
        jalurPendaftaran: {
          id: p.jalurPendaftaran.id,
          nama: p.jalurPendaftaran.nama,
          baris1: `${p.periode.nama} - ${p.gelombang.nama}`,
          baris2: `${p.jalurPendaftaran.nama} - ${p.sistemKuliah.nama}`,
          labelLengkap: `${p.periode.nama} - ${p.gelombang.nama} ${p.jalurPendaftaran.nama} (${p.programStudi.jenjang}) - ${p.sistemKuliah.nama}`,
        },
        periode: p.periode.nama,
        gelombang: p.gelombang.nama,
        sistemKuliah: p.sistemKuliah.nama,
        prodiPilihan: {
          pilihan1: {
            id: p.programStudi.id,
            nama: `${p.programStudi.jenjang} - ${p.programStudi.namaProdi}`,
            label: `❶ ${p.programStudi.jenjang} - ${p.programStudi.namaProdi}`,
          },
          pilihan2: p.pilihanProdi2
            ? {
                id: p.pilihanProdi2.id,
                nama: `${p.pilihanProdi2.jenjang} - ${p.pilihanProdi2.namaProdi}`,
                label: `❷ ${p.pilihanProdi2.jenjang} - ${p.pilihanProdi2.namaProdi}`,
              }
            : null,
          pilihan3: p.pilihanProdi3
            ? {
                id: p.pilihanProdi3.id,
                nama: `${p.pilihanProdi3.jenjang} - ${p.pilihanProdi3.namaProdi}`,
                label: `❸ ${p.pilihanProdi3.jenjang} - ${p.pilihanProdi3.namaProdi}`,
              }
            : null,
        },
        prodiDiterima: p.prodiDiterima
          ? `${p.prodiDiterima.jenjang} - ${p.prodiDiterima.namaProdi}`
          : null,
        statusBadges: badges,
        statusKelulusan: p.statusKelulusan,
        isFinalisasi: p.isFinalisasi,
        isDiterima: p.isDiterima,
        isDaftarUlang: p.isDaftarUlang,
        nim: p.nim,
        createdAt: p.createdAt,
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
   * Detail Biodata 1 Pendaftar (Mendukung ID internal, noPendaftaran, nomorUjian, atau email)
   */
  async getPendaftarDetail(identifier: number | string) {
    const str = String(identifier).trim();
    const num = Number(str);
    const isValidIntId = !isNaN(num) && Number.isInteger(num) && num > 0 && num <= 2147483647;

    const includes = {
      user: true,
      periode: true,
      gelombang: true,
      jalurPendaftaran: true,
      sistemKuliah: true,
      programStudi: true,
      pilihanProdi2: true,
      pilihanProdi3: true,
      prodiDiterima: true,
      orangTua: true,
      berkas: true,
      nilaiSeleksi: true,
      rekamMedis: true,
    };

    let pendaftar = null;
    if (isValidIntId) {
      pendaftar = await prisma.pendaftar.findUnique({
        where: { id: num },
        include: includes,
      });
    }

    if (!pendaftar) {
      pendaftar = await prisma.pendaftar.findFirst({
        where: {
          OR: [
            { noPendaftaran: str },
            { nomorUjian: str },
            { user: { email: str } },
          ],
        },
        include: includes,
      });
    }

    if (!pendaftar) {
      throw new Error(`Pendaftar dengan ID/Nomor "${identifier}" tidak ditemukan.`);
    }

    return pendaftar;
  }

  /**
   * Pencarian Pendaftar Khusus untuk Fitur "Login As" (Sesuai Screenshot 5)
   */
  async searchForLoginAs(query: string) {
    if (!query || query.trim() === '') {
      return [];
    }

    const q = query.trim();

    const items = await prisma.pendaftar.findMany({
      where: {
        OR: [
          { noPendaftaran: { contains: q, mode: 'insensitive' } },
          { user: { nama: { contains: q, mode: 'insensitive' } } },
          { user: { email: { contains: q, mode: 'insensitive' } } },
        ],
      },
      take: 10,
      include: {
        user: true,
        periode: true,
        gelombang: true,
        jalurPendaftaran: true,
        sistemKuliah: true,
        programStudi: true,
        pilihanProdi2: true,
        pilihanProdi3: true,
      },
    });

    return items.map((p) => ({
      id: p.id,
      userId: p.userId,
      idPendaftar: p.noPendaftaran || `410254${String(p.id).padStart(4, '0')}`,
      nama: p.user.nama,
      email: p.user.email,
      prodiPilihan: {
        pilihan1: p.programStudi ? p.programStudi.namaProdi : '-',
        pilihan2: p.pilihanProdi2 ? p.pilihanProdi2.namaProdi : '-',
        pilihan3: p.pilihanProdi3 ? p.pilihanProdi3.namaProdi : '-',
      },
      informasi: `${p.periode.nama} - ${p.jalurPendaftaran.nama} - ${p.gelombang.nama} - ${p.sistemKuliah.nama}`,
      fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    }));
  }

  /**
   * Eksekusi "Login As" Camaba (Impersonate Token)
   */
  async loginAsCamaba(adminUserId: number, identifier: string | number) {
    // 1. Cari pendaftar berdasarkan ID integer atau kode noPendaftaran atau email
    const idStr = String(identifier).trim();
    const idNum = Number(idStr);
    const isValidIntId = !isNaN(idNum) && Number.isInteger(idNum) && idNum > 0 && idNum <= 2147483647;

    const orConditions: any[] = [
      { noPendaftaran: idStr },
      { user: { email: idStr } },
    ];

    if (isValidIntId) {
      orConditions.push({ id: idNum });
    }

    const pendaftar = await prisma.pendaftar.findFirst({
      where: {
        OR: orConditions,
      },
      include: { user: true, programStudi: true },
    });

    if (!pendaftar || !pendaftar.user) {
      throw new Error(`Pendaftar "${identifier}" tidak ditemukan.`);
    }

    // 2. Generate Impersonated Token JWT
    const token = jwt.sign(
      {
        id: pendaftar.user.id,
        nama: pendaftar.user.nama,
        email: pendaftar.user.email,
        role: 'CAMABA',
        isImpersonated: true,
        impersonatedByAdminId: adminUserId,
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return {
      success: true,
      message: `Berhasil Login As sebagai ${pendaftar.user.nama} (${pendaftar.noPendaftaran})`,
      token,
      user: {
        id: pendaftar.user.id,
        nama: pendaftar.user.nama,
        email: pendaftar.user.email,
        role: 'CAMABA',
        isImpersonated: true,
      },
      pendaftar: {
        id: pendaftar.id,
        idPendaftar: pendaftar.noPendaftaran,
        prodi: pendaftar.programStudi?.namaProdi,
      },
      redirectUrl: '/camaba',
    };
  }

  /**
   * Hapus 1 Pendaftar (Mendukung ID internal, noPendaftaran, atau nomorUjian)
   */
  async deletePendaftar(identifier: number | string) {
    const str = String(identifier).trim();
    const num = Number(str);
    const isValidIntId = !isNaN(num) && Number.isInteger(num) && num > 0 && num <= 2147483647;

    let pendaftar = null;
    if (isValidIntId) {
      pendaftar = await prisma.pendaftar.findUnique({ where: { id: num } });
    }
    if (!pendaftar) {
      pendaftar = await prisma.pendaftar.findFirst({
        where: {
          OR: [
            { noPendaftaran: str },
            { nomorUjian: str },
          ],
        },
      });
    }

    if (!pendaftar) {
      throw new Error(`Pendaftar dengan ID/Nomor "${identifier}" tidak ditemukan.`);
    }

    // Hapus pendaftar dan user terkait
    await prisma.$transaction([
      prisma.pendaftar.delete({ where: { id: pendaftar.id } }),
      prisma.user.delete({ where: { id: pendaftar.userId } }),
    ]);

    return { success: true, message: `Pendaftar ${pendaftar.noPendaftaran || pendaftar.id} berhasil dihapus.` };
  }
}

export const adminPendaftarService = new AdminPendaftarService();
