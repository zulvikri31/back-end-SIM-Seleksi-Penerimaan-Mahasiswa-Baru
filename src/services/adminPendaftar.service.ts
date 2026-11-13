import prisma from '../config/database';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_fallback_key';

export interface FilterPendaftarAdmin {
  periodeId?: number;
  periodeIds?: number[];
  gelombangId?: number;
  gelombangIds?: number[];
  jalurPendaftaranId?: number;
  jalurPendaftaranIds?: number[];
  sistemKuliahId?: number;
  sistemKuliahIds?: number[];
  programStudiId?: number;
  programStudiIds?: number[];
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

    if (filter.periodeIds && filter.periodeIds.length > 0) {
      where.periodeId = { in: filter.periodeIds };
    } else if (filter.periodeId) {
      where.periodeId = Number(filter.periodeId);
    }

    if (filter.gelombangIds && filter.gelombangIds.length > 0) {
      where.gelombangId = { in: filter.gelombangIds };
    } else if (filter.gelombangId) {
      where.gelombangId = Number(filter.gelombangId);
    }

    if (filter.jalurPendaftaranIds && filter.jalurPendaftaranIds.length > 0) {
      where.jalurPendaftaranId = { in: filter.jalurPendaftaranIds };
    } else if (filter.jalurPendaftaranId) {
      where.jalurPendaftaranId = Number(filter.jalurPendaftaranId);
    }

    if (filter.sistemKuliahIds && filter.sistemKuliahIds.length > 0) {
      where.sistemKuliahId = { in: filter.sistemKuliahIds };
    } else if (filter.sistemKuliahId) {
      where.sistemKuliahId = Number(filter.sistemKuliahId);
    }

    // Filter Prodi (Bisa di pilihan 1, 2, atau 3, mendukung Multi-Select & Single)
    if (filter.programStudiIds && filter.programStudiIds.length > 0) {
      where.OR = [
        { programStudiId: { in: filter.programStudiIds } },
        { pilihanProdi2Id: { in: filter.programStudiIds } },
        { pilihanProdi3Id: { in: filter.programStudiIds } },
      ];
    } else if (filter.programStudiId) {
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

    // Ambil pilihan mata kuliah (khusus jika ada kurikulum prodi / jalur RPL)
    const mataKuliahList = await prisma.mataKuliahRpl.findMany({
      where: { programStudiId: pendaftar.programStudiId },
      orderBy: { kodeMK: 'asc' },
    });

    // Susun Struktur 8 + 1 Vertical Tabs (Sesuai Persis UI Detail Pendaftar SEVIMA)
    const verticalTabs = {
      // 1. Data Pendaftar (Sesuai Screenshot 2)
      dataPendaftar: {
        ringkasan: {
          kodePendaftar: pendaftar.noPendaftaran || `411256${String(pendaftar.id).padStart(4, '0')}`,
          periode: `${pendaftar.periode?.nama || ''} - ${pendaftar.gelombang?.nama || ''} - ${pendaftar.jalurPendaftaran?.nama || ''} - ${pendaftar.sistemKuliah?.nama || ''}`,
          nama: pendaftar.user?.nama || '-',
          tempatLahir: pendaftar.tempatLahir || '-',
          tanggalLahir: pendaftar.tanggalLahir,
          jenisKelamin: pendaftar.jenisKelamin || '-',
          agama: pendaftar.agama || 'Islam',
          suku: pendaftar.suku || 'Sunda',
          jenisProgram: pendaftar.jalurPendaftaran?.nama?.includes('RPL') ? 'Rekognisi Pembelajaran Lampau' : 'Reguler',
          tanggalDaftar: pendaftar.createdAt,
          tanggalAktivasiAkun: pendaftar.user?.createdAt || pendaftar.createdAt,
        },
        statusIndikator: {
          isAktif: Boolean(pendaftar.user?.isActive || pendaftar.isTagihanFormulir || pendaftar.noPendaftaran),
          isFinalisasi: Boolean(pendaftar.isFinalisasi),
          isDaftarOnline: Boolean(pendaftar.sumberTrafik?.toLowerCase().includes('portal') || !pendaftar.sumberTrafik?.toLowerCase().includes('admin')),
          isKip: Boolean(pendaftar.isKip),
          isLulus: Boolean(pendaftar.isDiterima || pendaftar.statusKelulusan === 'LULUS'),
          umumkanKelulusan: Boolean(pendaftar.emailKelulusanTerkirim || pendaftar.statusKelulusan === 'LULUS'),
          nim: pendaftar.nim || null,
          nomorUjian: pendaftar.nomorUjian || null,
          pemberiRekomendasi: pendaftar.pemberiRekomendasi || null,
          sumberPendaftar: pendaftar.sumberTrafik || 'Portal PMB',
          kebutuhanKhusus: pendaftar.kebutuhanKhusus || 'Tidak Ada',
          idDataSebelumnya: pendaftar.catatanOds || null,
        },
        subTabs: {
          pelengkap: {
            nik: pendaftar.nik || null,
            noPaspor: pendaftar.noPaspor || null,
            noKk: pendaftar.noKk || null,
            email: pendaftar.user?.email || null,
            telepon: pendaftar.telepon || null,
            tinggiBadan: pendaftar.tinggiBadan || (pendaftar.rekamMedis?.tinggiBadan ?? null),
            noHp: pendaftar.noHp || null,
            nisn: pendaftar.nisn || null,
            npsn: pendaftar.npsn || null,
            beratBadan: pendaftar.beratBadan || (pendaftar.rekamMedis?.beratBadan ?? null),
            ukuranJasAlmamater: pendaftar.ukuranJasAlmamater || 'L',
          },
          domisili: {
            alamat: pendaftar.alamat || null,
            provinsi: pendaftar.provinsi || 'Jawa Barat',
            kabupatenKota: pendaftar.kabupatenKota || 'Kota Bogor',
          },
          pesantren: {
            pernahPesantren: false,
            namaPesantren: null,
            lamaBelajar: null,
          },
          pekerjaan: {
            namaPerusahaan: pendaftar.namaPerusahaan || null,
            sudahBekerja: Boolean(pendaftar.namaPerusahaan),
          },
        },
      },

      // 2. Pilihan Prodi
      pilihanProdi: {
        pilihan1: pendaftar.programStudi ? {
          id: pendaftar.programStudi.id,
          namaProdi: pendaftar.programStudi.namaProdi,
          jenjang: pendaftar.programStudi.jenjang,
          fakultas: pendaftar.programStudi.fakultas,
          akreditasi: pendaftar.programStudi.akreditasi,
          biayaKuliah: pendaftar.programStudi.biayaKuliah,
        } : null,
        pilihan2: pendaftar.pilihanProdi2 ? {
          id: pendaftar.pilihanProdi2.id,
          namaProdi: pendaftar.pilihanProdi2.namaProdi,
          jenjang: pendaftar.pilihanProdi2.jenjang,
          fakultas: pendaftar.pilihanProdi2.fakultas,
        } : null,
        pilihan3: pendaftar.pilihanProdi3 ? {
          id: pendaftar.pilihanProdi3.id,
          namaProdi: pendaftar.pilihanProdi3.namaProdi,
          jenjang: pendaftar.pilihanProdi3.jenjang,
          fakultas: pendaftar.pilihanProdi3.fakultas,
        } : null,
        prodiDiterima: pendaftar.prodiDiterima ? {
          id: pendaftar.prodiDiterima.id,
          namaProdi: pendaftar.prodiDiterima.namaProdi,
          jenjang: pendaftar.prodiDiterima.jenjang,
          fakultas: pendaftar.prodiDiterima.fakultas,
        } : null,
      },

      // 3. Repository Pendaftar (Berkas-Berkas)
      repositoryPendaftar: {
        totalBerkas: pendaftar.berkas?.length || 0,
        berkasList: pendaftar.berkas || [],
      },

      // 4. Pilihan Mata Kuliah (Khusus RPL / Kurikulum)
      pilihanMataKuliah: {
        totalMataKuliah: mataKuliahList.length,
        mataKuliahList,
      },

      // 5. Keluarga
      keluarga: {
        ayah: {
          nama: pendaftar.orangTua?.namaAyah || null,
          pendidikan: pendaftar.orangTua?.pendidikanAyah || null,
          pekerjaan: pendaftar.orangTua?.pekerjaanAyah || null,
          noHp: pendaftar.orangTua?.noHpOrtu || null,
        },
        ibu: {
          nama: pendaftar.orangTua?.namaIbu || null,
          pendidikan: pendaftar.orangTua?.pendidikanIbu || null,
          pekerjaan: pendaftar.orangTua?.pekerjaanIbu || null,
        },
        wali: null,
        penghasilanGabungan: pendaftar.orangTua?.penghasilanOrtu || null,
      },

      // 6. Pendidikan
      pendidikan: {
        sekolahAsal: {
          namaSekolah: pendaftar.asalSekolah || null,
          jenisPendidikan: pendaftar.jenisPendidikan || null,
          jurusan: pendaftar.jurusanPendidikan || null,
          tahunLulus: pendaftar.tahunLulus || null,
        },
        perguruanTinggiAsal: {
          namaPT: pendaftar.asalPerguruanTinggi || null,
          prodiAsal: pendaftar.jurusanPendidikan || null,
        },
      },

      // 7. Riwayat Keuangan
      riwayatKeuangan: {
        tagihanFormulir: {
          nominal: 350000,
          isLunas: Boolean(pendaftar.isTagihanFormulir || pendaftar.user?.isActive),
          status: (pendaftar.isTagihanFormulir || pendaftar.user?.isActive) ? 'LUNAS' : 'BELUM_BAYAR',
        },
        uktDanBiayaKuliah: {
          kelompokUkt: pendaftar.kelompokUkt || 'UKT 1',
          nominalUkt: pendaftar.nominalUkt || 0,
          isKip: pendaftar.isKip,
        },
      },

      // 8. Seleksi Pendaftaran
      seleksiPendaftaran: {
        nomorUjian: pendaftar.nomorUjian || null,
        statusKelulusan: pendaftar.statusKelulusan || 'MENUNGGU',
        isLulus: Boolean(pendaftar.isDiterima || pendaftar.statusKelulusan === 'LULUS'),
        nilaiSeleksi: pendaftar.nilaiSeleksi || [],
      },

      // 9. REKAM MEDIS (TAB BARU DI BAWAH SELEKSI PENDAFTARAN)
      rekamMedis: pendaftar.rekamMedis ? {
        id: pendaftar.rekamMedis.id,
        pendaftarId: pendaftar.id,
        fisik: {
          golonganDarah: pendaftar.rekamMedis.golonganDarah || null,
          rhesus: pendaftar.rekamMedis.rhesus || null,
          tinggiBadan: pendaftar.rekamMedis.tinggiBadan || pendaftar.tinggiBadan || null,
          beratBadan: pendaftar.rekamMedis.beratBadan || pendaftar.beratBadan || null,
          statusButaWarna: pendaftar.rekamMedis.statusButaWarna || 'TIDAK',
          isBerkacamata: Boolean(pendaftar.rekamMedis.isBerkacamata),
          isMerokok: Boolean(pendaftar.rekamMedis.isMerokok),
        },
        riwayatKesehatan: {
          riwayatPenyakit: pendaftar.rekamMedis.riwayatPenyakit || null,
          riwayatAlergi: pendaftar.rekamMedis.riwayatAlergi || null,
          riwayatOperasi: pendaftar.rekamMedis.riwayatOperasi || null,
          riwayatRawatInap: pendaftar.rekamMedis.riwayatRawatInap || null,
          kebutuhanKhusus: pendaftar.rekamMedis.kebutuhanKhusus || pendaftar.kebutuhanKhusus || 'TIDAK',
          catatanKesehatan: pendaftar.rekamMedis.catatanKesehatan || null,
        },
        kontakDaruratMedis: {
          nama: pendaftar.rekamMedis.kontakDaruratNama || null,
          hubungan: pendaftar.rekamMedis.kontakDaruratHubungan || null,
          noHp: pendaftar.rekamMedis.kontakDaruratNoHp || null,
        },
        lampiranMedis: {
          fileSuratKesehatan: pendaftar.rekamMedis.fileSuratKesehatan || null,
          fileBebasNarkoba: pendaftar.rekamMedis.fileBebasNarkoba || null,
        },
      } : {
        id: null,
        pendaftarId: pendaftar.id,
        fisik: {
          golonganDarah: null,
          rhesus: null,
          tinggiBadan: pendaftar.tinggiBadan || null,
          beratBadan: pendaftar.beratBadan || null,
          statusButaWarna: 'TIDAK',
          isBerkacamata: false,
          isMerokok: false,
        },
        riwayatKesehatan: {
          riwayatPenyakit: null,
          riwayatAlergi: null,
          riwayatOperasi: null,
          riwayatRawatInap: null,
          kebutuhanKhusus: pendaftar.kebutuhanKhusus || 'TIDAK',
          catatanKesehatan: null,
        },
        kontakDaruratMedis: { nama: null, hubungan: null, noHp: null },
        lampiranMedis: { fileSuratKesehatan: null, fileBebasNarkoba: null },
      },
    };

    return {
      ...pendaftar,
      verticalTabs,
    };
  }

  /**
   * Mengambil Khusus Data Rekam Medis Pendaftar
   */
  async getRekamMedis(identifier: number | string) {
    const pendaftar = await this.getPendaftarDetail(identifier);
    return {
      pendaftarId: pendaftar.id,
      noPendaftaran: pendaftar.noPendaftaran,
      nama: pendaftar.user?.nama,
      rekamMedis: pendaftar.verticalTabs.rekamMedis,
    };
  }

  /**
   * Mengupdate / Mengisi Rekam Medis Pendaftar oleh Admin
   */
  async updateRekamMedis(identifier: number | string, data: any) {
    const pendaftar = await this.getPendaftarDetail(identifier);

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
        isBerkacamata: Boolean(data.isBerkacamata),
        isMerokok: Boolean(data.isMerokok),
        riwayatOperasi: data.riwayatOperasi,
        riwayatRawatInap: data.riwayatRawatInap,
        kebutuhanKhusus: data.kebutuhanKhusus || 'TIDAK',
        kontakDaruratNama: data.kontakDaruratNama,
        kontakDaruratHubungan: data.kontakDaruratHubungan,
        kontakDaruratNoHp: data.kontakDaruratNoHp,
        fileSuratKesehatan: data.fileSuratKesehatan,
        fileBebasNarkoba: data.fileBebasNarkoba,
        catatanKesehatan: data.catatanKesehatan,
      },
    });

    // Sinkronkan juga tinggi & berat badan ke profil pendaftar
    if (data.tinggiBadan !== undefined || data.beratBadan !== undefined || data.kebutuhanKhusus !== undefined) {
      await prisma.pendaftar.update({
        where: { id: pendaftar.id },
        data: {
          tinggiBadan: data.tinggiBadan !== undefined ? Number(data.tinggiBadan) : undefined,
          beratBadan: data.beratBadan !== undefined ? Number(data.beratBadan) : undefined,
          kebutuhanKhusus: data.kebutuhanKhusus !== undefined ? data.kebutuhanKhusus : undefined,
        },
      });
    }

    return rekamMedis;
  }

  /**
   * Update Fleksibel per Vertical Tab (Data Pendaftar, Keluarga, Pendidikan, Rekam Medis)
   */
  async updateVerticalTab(identifier: number | string, tabName: string, data: any) {
    const tab = tabName.toLowerCase().replace(/[\s_-]+/g, '');

    if (tab === 'rekammedis') {
      return this.updateRekamMedis(identifier, data);
    }

    const pendaftar = await this.getPendaftarDetail(identifier);

    if (tab === 'keluarga') {
      return prisma.orangTua.upsert({
        where: { pendaftarId: pendaftar.id },
        update: {
          namaAyah: data.namaAyah,
          pekerjaanAyah: data.pekerjaanAyah,
          pendidikanAyah: data.pendidikanAyah,
          namaIbu: data.namaIbu,
          pekerjaanIbu: data.pekerjaanIbu,
          pendidikanIbu: data.pendidikanIbu,
          penghasilanOrtu: data.penghasilanOrtu,
          noHpOrtu: data.noHpOrtu,
        },
        create: {
          pendaftarId: pendaftar.id,
          namaAyah: data.namaAyah,
          pekerjaanAyah: data.pekerjaanAyah,
          pendidikanAyah: data.pendidikanAyah,
          namaIbu: data.namaIbu,
          pekerjaanIbu: data.pekerjaanIbu,
          pendidikanIbu: data.pendidikanIbu,
          penghasilanOrtu: data.penghasilanOrtu,
          noHpOrtu: data.noHpOrtu,
        },
      });
    }

    // Default update ke pendaftar
    return this.updatePendaftar(pendaftar.id, data);
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
        berkas: true,
      },
    });

    return items.map((p) => {
      const fotoBerkas = p.berkas?.find(
        (b) =>
          b.jenisBerkas.toLowerCase().includes('foto') ||
          b.jenisBerkas.toLowerCase().includes('pasfoto') ||
          b.jenisBerkas.toLowerCase().includes('pas foto')
      );

      // Foto pendaftar: jika di DB ada berkas pasfoto pakai itu, fallback ke foto avatar realistis
      const fallbackFoto = p.user.nama.toUpperCase().includes('ROSIANA')
        ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.user.nama)}&background=0D8ABC&color=fff&size=200`;

      return {
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
        fotoUrl: fotoBerkas ? fotoBerkas.fileUrl : fallbackFoto,
      };
    });
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
   * Tambah Pendaftar Baru dari Sisi Admin (Screenshot 2: Tombol + Tambah)
   */
  async createPendaftar(data: any) {
    const nama = String(data.nama || '').trim();
    if (!nama) throw new Error('Nama pendaftar wajib diisi.');

    const email = data.email && String(data.email).trim() !== ''
      ? String(data.email).trim().toLowerCase()
      : `pendaftar_${Date.now()}@spmb-uika.ac.id`;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error(`Email "${email}" sudah terdaftar dalam sistem.`);
    }

    const rawPass = data.password ? String(data.password) : '123456';
    const hashedPassword = await bcrypt.hash(rawPass, 10);

    let periodeId = data.periodeId ? Number(data.periodeId) : undefined;
    if (!periodeId) {
      const p = (await prisma.periode.findFirst({ where: { isActive: true } })) || (await prisma.periode.findFirst({ orderBy: { id: 'desc' } }));
      periodeId = p?.id;
    }
    if (!periodeId) throw new Error('Master Periode belum tersedia di sistem.');

    let gelombangId = data.gelombangId ? Number(data.gelombangId) : undefined;
    if (!gelombangId) {
      const g = await prisma.gelombang.findFirst({ orderBy: { id: 'asc' } });
      gelombangId = g?.id;
    }

    let jalurPendaftaranId = data.jalurPendaftaranId ? Number(data.jalurPendaftaranId) : undefined;
    if (!jalurPendaftaranId) {
      const j = await prisma.jalurPendaftaran.findFirst({ orderBy: { id: 'asc' } });
      jalurPendaftaranId = j?.id;
    }

    let sistemKuliahId = data.sistemKuliahId ? Number(data.sistemKuliahId) : undefined;
    if (!sistemKuliahId) {
      const s = await prisma.sistemKuliah.findFirst({ orderBy: { id: 'asc' } });
      sistemKuliahId = s?.id;
    }

    let programStudiId = data.programStudiId ? Number(data.programStudiId) : undefined;
    if (!programStudiId) {
      const pr = await prisma.programStudi.findFirst({ orderBy: { id: 'asc' } });
      programStudiId = pr?.id;
    }

    let noPendaftaran = data.noPendaftaran || data.kodePendaftar;
    if (!noPendaftaran || String(noPendaftaran).trim() === '') {
      noPendaftaran = `41027${Math.floor(10000 + Math.random() * 90000)}`;
    }

    let tanggalLahirParsed: Date | undefined;
    if (data.tanggalLahir) {
      const d = new Date(data.tanggalLahir);
      if (!isNaN(d.getTime())) tanggalLahirParsed = d;
    }

    const isBiodataLengkap = Boolean(data.nik && data.tempatLahir && data.tanggalLahir);
    const isFinalisasi = Boolean(data.isFinalisasi || data.finalisasi);
    const isActive = data.isActive !== undefined ? Boolean(data.isActive) : true;

    let statusPendaftar = 'BELUM_FINALISASI';
    if (isFinalisasi) statusPendaftar = 'SUDAH_FINALISASI';
    if (data.isDiterima || data.statusKelulusan === 'LULUS') statusPendaftar = 'LULUS';
    if (data.isDaftarUlang) statusPendaftar = 'DAFTAR_ULANG';

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          nama,
          email,
          password: hashedPassword,
          role: 'CAMABA',
          isActive,
        },
      });

      const pendaftar = await tx.pendaftar.create({
        data: {
          userId: user.id,
          noPendaftaran: String(noPendaftaran),
          nomorUjian: data.nomorUjian || data.noUjian || null,
          nim: data.nim || null,
          periodeId: periodeId!,
          gelombangId: gelombangId!,
          jalurPendaftaranId: jalurPendaftaranId!,
          sistemKuliahId: sistemKuliahId!,
          programStudiId: programStudiId!,
          pilihanProdi2Id: data.pilihanProdi2Id ? Number(data.pilihanProdi2Id) : null,
          pilihanProdi3Id: data.pilihanProdi3Id ? Number(data.pilihanProdi3Id) : null,
          prodiDiterimaId: data.prodiDiterimaId ? Number(data.prodiDiterimaId) : null,

          statusPendaftar,
          statusKelulusan: data.statusKelulusan || 'MENUNGGU',
          isBiodataLengkap,
          isFinalisasi,
          isIkutSeleksi: Boolean(data.isIkutSeleksi),
          isDiterima: Boolean(data.isDiterima),
          isDaftarUlang: Boolean(data.isDaftarUlang),
          isKip: Boolean(data.isKip),
          isTagihanFormulir: Boolean(data.isTagihanFormulir),

          nik: data.nik || null,
          jenisKelamin: data.jenisKelamin || null,
          tempatLahir: data.tempatLahir || null,
          tanggalLahir: tanggalLahirParsed || null,
          agama: data.agama || null,
          suku: data.suku || null,
          kebutuhanKhusus: data.kebutuhanKhusus || 'Tidak',
          noHp: data.noHp || null,
          alamat: data.alamat || null,
          provinsi: data.provinsi || null,
          kabupatenKota: data.kabupatenKota || null,

          nisn: data.nisn || null,
          npsn: data.npsn || null,
          noKk: data.noKk || null,
          noPaspor: data.noPaspor || null,
          telepon: data.telepon || null,
          beratBadan: data.beratBadan ? Number(data.beratBadan) : null,
          tinggiBadan: data.tinggiBadan ? Number(data.tinggiBadan) : null,
          ukuranJasAlmamater: data.ukuranJasAlmamater || null,
          pemberiRekomendasi: data.pemberiRekomendasi || null,
          sumberTrafik: data.sumberTrafik || data.sumberPendaftar || 'Portal PMB',

          asalSekolah: data.asalSekolah || null,
          jenisPendidikan: data.jenisPendidikan || null,
          jurusanPendidikan: data.jurusanPendidikan || null,
          tahunLulus: data.tahunLulus ? Number(data.tahunLulus) : null,
          namaPerusahaan: data.namaPerusahaan || null,
          asalPerguruanTinggi: data.asalPerguruanTinggi || null,
          alasanMemilih: data.alasanMemilih || null,
        },
      });

      if (
        data.namaAyah ||
        data.pekerjaanAyah ||
        data.pendidikanAyah ||
        data.namaIbu ||
        data.pekerjaanIbu ||
        data.penghasilanOrtu
      ) {
        await tx.orangTua.create({
          data: {
            pendaftarId: pendaftar.id,
            namaAyah: data.namaAyah || null,
            pekerjaanAyah: data.pekerjaanAyah || null,
            pendidikanAyah: data.pendidikanAyah || null,
            namaIbu: data.namaIbu || null,
            pekerjaanIbu: data.pekerjaanIbu || null,
            pendidikanIbu: data.pendidikanIbu || null,
            penghasilanOrtu: data.penghasilanOrtu || null,
            noHpOrtu: data.noHpOrtu || null,
          },
        });
      }

      if (
        data.golonganDarah ||
        data.riwayatPenyakit ||
        data.riwayatAlergi ||
        data.statusButaWarna ||
        data.kontakDaruratNama
      ) {
        await tx.rekamMedis.create({
          data: {
            pendaftarId: pendaftar.id,
            golonganDarah: data.golonganDarah || null,
            rhesus: data.rhesus || null,
            tinggiBadan: data.tinggiBadan ? Number(data.tinggiBadan) : null,
            beratBadan: data.beratBadan ? Number(data.beratBadan) : null,
            riwayatPenyakit: data.riwayatPenyakit || null,
            riwayatAlergi: data.riwayatAlergi || null,
            statusButaWarna: data.statusButaWarna || 'TIDAK',
            kontakDaruratNama: data.kontakDaruratNama || null,
            kontakDaruratHubungan: data.kontakDaruratHubungan || null,
            kontakDaruratNoHp: data.kontakDaruratNoHp || null,
          },
        });
      }

      return pendaftar;
    });

    return await this.getPendaftarDetail(result.id);
  }

  /**
   * Update Pendaftar (Screenshot 2: Tombol Simpan)
   */
  async updatePendaftar(identifier: number | string, data: any) {
    const str = String(identifier).trim();
    const num = Number(str);
    const isValidIntId = !isNaN(num) && Number.isInteger(num) && num > 0 && num <= 2147483647;

    let pendaftar = null;
    if (isValidIntId) {
      pendaftar = await prisma.pendaftar.findUnique({ where: { id: num }, include: { user: true } });
    }
    if (!pendaftar) {
      pendaftar = await prisma.pendaftar.findFirst({
        where: {
          OR: [{ noPendaftaran: str }, { nomorUjian: str }],
        },
        include: { user: true },
      });
    }

    if (!pendaftar) {
      throw new Error(`Pendaftar dengan ID/Nomor "${identifier}" tidak ditemukan.`);
    }

    const userUpdate: any = {};
    if (data.nama && data.nama.trim() !== '') userUpdate.nama = data.nama.trim();
    if (data.email && data.email.trim() !== '' && data.email !== pendaftar.user.email) {
      const exist = await prisma.user.findUnique({ where: { email: data.email.trim() } });
      if (!exist || exist.id === pendaftar.userId) {
        userUpdate.email = data.email.trim().toLowerCase();
      }
    }
    if (data.isActive !== undefined) userUpdate.isActive = Boolean(data.isActive);
    if (data.password && String(data.password).trim() !== '') {
      userUpdate.password = await bcrypt.hash(String(data.password), 10);
    }

    const pendaftarUpdate: any = {};
    if (data.noPendaftaran) pendaftarUpdate.noPendaftaran = String(data.noPendaftaran);
    if (data.nomorUjian !== undefined) pendaftarUpdate.nomorUjian = data.nomorUjian || null;
    if (data.nim !== undefined) pendaftarUpdate.nim = data.nim || null;
    if (data.periodeId) pendaftarUpdate.periodeId = Number(data.periodeId);
    if (data.gelombangId) pendaftarUpdate.gelombangId = Number(data.gelombangId);
    if (data.jalurPendaftaranId) pendaftarUpdate.jalurPendaftaranId = Number(data.jalurPendaftaranId);
    if (data.sistemKuliahId) pendaftarUpdate.sistemKuliahId = Number(data.sistemKuliahId);
    if (data.programStudiId) pendaftarUpdate.programStudiId = Number(data.programStudiId);
    if (data.pilihanProdi2Id !== undefined) pendaftarUpdate.pilihanProdi2Id = data.pilihanProdi2Id ? Number(data.pilihanProdi2Id) : null;
    if (data.pilihanProdi3Id !== undefined) pendaftarUpdate.pilihanProdi3Id = data.pilihanProdi3Id ? Number(data.pilihanProdi3Id) : null;
    if (data.prodiDiterimaId !== undefined) pendaftarUpdate.prodiDiterimaId = data.prodiDiterimaId ? Number(data.prodiDiterimaId) : null;

    if (data.statusPendaftar) pendaftarUpdate.statusPendaftar = String(data.statusPendaftar);
    if (data.statusKelulusan) pendaftarUpdate.statusKelulusan = String(data.statusKelulusan);
    if (data.isBiodataLengkap !== undefined) pendaftarUpdate.isBiodataLengkap = Boolean(data.isBiodataLengkap);
    if (data.isFinalisasi !== undefined) pendaftarUpdate.isFinalisasi = Boolean(data.isFinalisasi);
    if (data.isIkutSeleksi !== undefined) pendaftarUpdate.isIkutSeleksi = Boolean(data.isIkutSeleksi);
    if (data.isDiterima !== undefined) pendaftarUpdate.isDiterima = Boolean(data.isDiterima);
    if (data.isDaftarUlang !== undefined) pendaftarUpdate.isDaftarUlang = Boolean(data.isDaftarUlang);
    if (data.isKip !== undefined) pendaftarUpdate.isKip = Boolean(data.isKip);
    if (data.isTagihanFormulir !== undefined) pendaftarUpdate.isTagihanFormulir = Boolean(data.isTagihanFormulir);

    if (data.nik !== undefined) pendaftarUpdate.nik = data.nik || null;
    if (data.jenisKelamin !== undefined) pendaftarUpdate.jenisKelamin = data.jenisKelamin || null;
    if (data.tempatLahir !== undefined) pendaftarUpdate.tempatLahir = data.tempatLahir || null;
    if (data.tanggalLahir !== undefined) {
      const d = new Date(data.tanggalLahir);
      pendaftarUpdate.tanggalLahir = !isNaN(d.getTime()) ? d : null;
    }
    if (data.agama !== undefined) pendaftarUpdate.agama = data.agama || null;
    if (data.suku !== undefined) pendaftarUpdate.suku = data.suku || null;
    if (data.kebutuhanKhusus !== undefined) pendaftarUpdate.kebutuhanKhusus = data.kebutuhanKhusus || 'Tidak';
    if (data.noHp !== undefined) pendaftarUpdate.noHp = data.noHp || null;
    if (data.alamat !== undefined) pendaftarUpdate.alamat = data.alamat || null;
    if (data.provinsi !== undefined) pendaftarUpdate.provinsi = data.provinsi || null;
    if (data.kabupatenKota !== undefined) pendaftarUpdate.kabupatenKota = data.kabupatenKota || null;

    if (data.nisn !== undefined) pendaftarUpdate.nisn = data.nisn || null;
    if (data.npsn !== undefined) pendaftarUpdate.npsn = data.npsn || null;
    if (data.noKk !== undefined) pendaftarUpdate.noKk = data.noKk || null;
    if (data.noPaspor !== undefined) pendaftarUpdate.noPaspor = data.noPaspor || null;
    if (data.telepon !== undefined) pendaftarUpdate.telepon = data.telepon || null;
    if (data.beratBadan !== undefined) pendaftarUpdate.beratBadan = data.beratBadan ? Number(data.beratBadan) : null;
    if (data.tinggiBadan !== undefined) pendaftarUpdate.tinggiBadan = data.tinggiBadan ? Number(data.tinggiBadan) : null;
    if (data.ukuranJasAlmamater !== undefined) pendaftarUpdate.ukuranJasAlmamater = data.ukuranJasAlmamater || null;
    if (data.pemberiRekomendasi !== undefined) pendaftarUpdate.pemberiRekomendasi = data.pemberiRekomendasi || null;
    if (data.sumberTrafik !== undefined) pendaftarUpdate.sumberTrafik = data.sumberTrafik || 'Portal PMB';

    if (data.asalSekolah !== undefined) pendaftarUpdate.asalSekolah = data.asalSekolah || null;
    if (data.jenisPendidikan !== undefined) pendaftarUpdate.jenisPendidikan = data.jenisPendidikan || null;
    if (data.jurusanPendidikan !== undefined) pendaftarUpdate.jurusanPendidikan = data.jurusanPendidikan || null;
    if (data.tahunLulus !== undefined) pendaftarUpdate.tahunLulus = data.tahunLulus ? Number(data.tahunLulus) : null;
    if (data.namaPerusahaan !== undefined) pendaftarUpdate.namaPerusahaan = data.namaPerusahaan || null;
    if (data.asalPerguruanTinggi !== undefined) pendaftarUpdate.asalPerguruanTinggi = data.asalPerguruanTinggi || null;

    await prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({ where: { id: pendaftar.userId }, data: userUpdate });
      }

      await tx.pendaftar.update({ where: { id: pendaftar.id }, data: pendaftarUpdate });

      if (
        data.namaAyah !== undefined ||
        data.pekerjaanAyah !== undefined ||
        data.pendidikanAyah !== undefined ||
        data.namaIbu !== undefined ||
        data.pekerjaanIbu !== undefined ||
        data.penghasilanOrtu !== undefined
      ) {
        await tx.orangTua.upsert({
          where: { pendaftarId: pendaftar.id },
          update: {
            namaAyah: data.namaAyah || null,
            pekerjaanAyah: data.pekerjaanAyah || null,
            pendidikanAyah: data.pendidikanAyah || null,
            namaIbu: data.namaIbu || null,
            pekerjaanIbu: data.pekerjaanIbu || null,
            pendidikanIbu: data.pendidikanIbu || null,
            penghasilanOrtu: data.penghasilanOrtu || null,
            noHpOrtu: data.noHpOrtu || null,
          },
          create: {
            pendaftarId: pendaftar.id,
            namaAyah: data.namaAyah || null,
            pekerjaanAyah: data.pekerjaanAyah || null,
            pendidikanAyah: data.pendidikanAyah || null,
            namaIbu: data.namaIbu || null,
            pekerjaanIbu: data.pekerjaanIbu || null,
            pendidikanIbu: data.pendidikanIbu || null,
            penghasilanOrtu: data.penghasilanOrtu || null,
            noHpOrtu: data.noHpOrtu || null,
          },
        });
      }

      if (
        data.golonganDarah !== undefined ||
        data.riwayatPenyakit !== undefined ||
        data.statusButaWarna !== undefined ||
        data.kontakDaruratNama !== undefined
      ) {
        await tx.rekamMedis.upsert({
          where: { pendaftarId: pendaftar.id },
          update: {
            golonganDarah: data.golonganDarah || null,
            rhesus: data.rhesus || null,
            tinggiBadan: data.tinggiBadan ? Number(data.tinggiBadan) : null,
            beratBadan: data.beratBadan ? Number(data.beratBadan) : null,
            riwayatPenyakit: data.riwayatPenyakit || null,
            riwayatAlergi: data.riwayatAlergi || null,
            statusButaWarna: data.statusButaWarna || 'TIDAK',
            kontakDaruratNama: data.kontakDaruratNama || null,
            kontakDaruratHubungan: data.kontakDaruratHubungan || null,
            kontakDaruratNoHp: data.kontakDaruratNoHp || null,
          },
          create: {
            pendaftarId: pendaftar.id,
            golonganDarah: data.golonganDarah || null,
            rhesus: data.rhesus || null,
            tinggiBadan: data.tinggiBadan ? Number(data.tinggiBadan) : null,
            beratBadan: data.beratBadan ? Number(data.beratBadan) : null,
            riwayatPenyakit: data.riwayatPenyakit || null,
            riwayatAlergi: data.riwayatAlergi || null,
            statusButaWarna: data.statusButaWarna || 'TIDAK',
            kontakDaruratNama: data.kontakDaruratNama || null,
            kontakDaruratHubungan: data.kontakDaruratHubungan || null,
            kontakDaruratNoHp: data.kontakDaruratNoHp || null,
          },
        });
      }
    });

    return await this.getPendaftarDetail(pendaftar.id);
  }

  /**
   * Hapus Masal (Bulk Delete) Pendaftar (Screenshot 1 & 3: Tombol Hapus Atas Tabel)
   */
  async bulkDeletePendaftar(ids: (number | string)[]) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Daftar ID pendaftar yang akan dihapus tidak boleh kosong.');
    }

    let deletedCount = 0;
    for (const identifier of ids) {
      try {
        await this.deletePendaftar(identifier);
        deletedCount++;
      } catch (e) {
        // Abaikan jika tidak ditemukan, lanjutkan ke item berikutnya
      }
    }

    return {
      success: true,
      message: `Berhasil menghapus ${deletedCount} pendaftar.`,
      deletedCount,
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
            { user: { email: str } },
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

  /**
   * 1. Review Data Pendaftar (Sesuai Screenshot 2: Modal Review Data Pendaftaran)
   * Menghitung secara dinamis 15 status pendaftar dari database
   */
  async getReviewData(filter?: any) {
    const where: any = {};
    if (filter?.periodeId) where.periodeId = Number(filter.periodeId);
    if (filter?.gelombangId) where.gelombangId = Number(filter.gelombangId);
    if (filter?.jalurPendaftaranId) where.jalurPendaftaranId = Number(filter.jalurPendaftaranId);
    if (filter?.sistemKuliahId) where.sistemKuliahId = Number(filter.sistemKuliahId);
    if (filter?.programStudiId) {
      where.OR = [
        { programStudiId: Number(filter.programStudiId) },
        { pilihanProdi2Id: Number(filter.programStudiId) },
        { pilihanProdi3Id: Number(filter.programStudiId) },
      ];
    }

    const [
      totalPendaftar,
      akunAktif,
      akunBelumAktif,
      sudahFinalisasi,
      belumFinalisasi,
      lulus,
      tidakLulus,
      rekomendasi,
      belumDaftarUlang,
      belumDiterimaProdi,
      cadangan,
      daftarUlang,
      sudahMemilikiNim,
      belumMemilikiNim,
      nimTidakSama,
      tidakMemilikiProdi,
    ] = await Promise.all([
      prisma.pendaftar.count({ where }),
      // 1. Akun Aktif (Pendaftar)
      prisma.pendaftar.count({
        where: { ...where, user: { isActive: true } },
      }),
      // 2. Akun Belum Aktif (Peminat)
      prisma.user.count({
        where: { role: 'CAMABA', isActive: false },
      }),
      // 3. Sudah Finalisasi
      prisma.pendaftar.count({
        where: { ...where, isFinalisasi: true },
      }),
      // 4. Belum Finalisasi
      prisma.pendaftar.count({
        where: { ...where, isFinalisasi: false },
      }),
      // 5. Lulus
      prisma.pendaftar.count({
        where: { ...where, statusKelulusan: 'LULUS' },
      }),
      // 6. Tidak Lulus
      prisma.pendaftar.count({
        where: { ...where, statusKelulusan: 'TIDAK_LULUS' },
      }),
      // 7. Rekomendasi
      prisma.pendaftar.count({
        where: {
          ...where,
          pemberiRekomendasi: { not: null },
        },
      }),
      // 8. Belum Daftar Ulang (Lulus tapi belum daftar ulang)
      prisma.pendaftar.count({
        where: { ...where, statusKelulusan: 'LULUS', isDaftarUlang: false },
      }),
      // 9. Belum Diterima Prodi
      prisma.pendaftar.count({
        where: { ...where, prodiDiterimaId: null, statusKelulusan: { not: 'LULUS' } },
      }),
      // 10. Cadangan
      prisma.pendaftar.count({
        where: { ...where, statusKelulusan: 'CADANGAN' },
      }),
      // 11. Daftar Ulang
      prisma.pendaftar.count({
        where: { ...where, isDaftarUlang: true },
      }),
      // 12. Sudah Memiliki NIM
      prisma.pendaftar.count({
        where: { ...where, nim: { not: null } },
      }),
      // 13. Belum Memiliki NIM
      prisma.pendaftar.count({
        where: { ...where, nim: null },
      }),
      // 14. NIM Tidak Sama dengan PMB
      prisma.pendaftar.count({
        where: { ...where, isNimBatal: true },
      }),
      // 15. Tidak Memiliki Prodi
      prisma.pendaftar.count({
        where: { ...where, programStudiId: 0 },
      }).catch(() => 0),
    ]);

    const summary = [
      { no: 1, statusPendaftar: 'Akun Aktif (Pendaftar)', jumlahPendaftar: akunAktif, keterangan: 'Pendaftar yang akunnya telah aktif' },
      { no: 2, statusPendaftar: 'Akun Belum Aktif (Peminat)', jumlahPendaftar: akunBelumAktif, keterangan: 'Peminat yang belum aktivasi akun' },
      { no: 3, statusPendaftar: 'Sudah Finalisasi', jumlahPendaftar: sudahFinalisasi, keterangan: 'Pendaftar yang telah menyelesaikan finalisasi biodata' },
      { no: 4, statusPendaftar: 'Belum Finalisasi', jumlahPendaftar: belumFinalisasi, keterangan: 'Pendaftar yang belum finalisasi biodata' },
      { no: 5, statusPendaftar: 'Lulus', jumlahPendaftar: lulus, keterangan: 'Pendaftar yang dinyatakan lulus seleksi' },
      { no: 6, statusPendaftar: 'Tidak Lulus', jumlahPendaftar: tidakLulus, keterangan: 'Pendaftar yang dinyatakan tidak lulus seleksi' },
      { no: 7, statusPendaftar: 'Rekomendasi', jumlahPendaftar: rekomendasi, keterangan: 'Pendaftar dengan rekomendasi khusus' },
      { no: 8, statusPendaftar: 'Belum Daftar Ulang', jumlahPendaftar: belumDaftarUlang, keterangan: 'Pendaftar lulus yang belum melakukan daftar ulang' },
      { no: 9, statusPendaftar: 'Belum Diterima Prodi', jumlahPendaftar: belumDiterimaProdi, keterangan: 'Pendaftar yang belum diterima di program studi' },
      { no: 10, statusPendaftar: 'Cadangan', jumlahPendaftar: cadangan, keterangan: 'Pendaftar dengan status cadangan' },
      { no: 11, statusPendaftar: 'Daftar Ulang', jumlahPendaftar: daftarUlang, keterangan: 'Pendaftar yang sudah melakukan daftar ulang' },
      { no: 12, statusPendaftar: 'Sudah Memiliki NIM', jumlahPendaftar: sudahMemilikiNim, keterangan: 'Mahasiswa yang sudah diterbitkan NIM' },
      { no: 13, statusPendaftar: 'Belum Memiliki NIM', jumlahPendaftar: belumMemilikiNim, keterangan: 'Pendaftar yang belum memiliki NIM' },
      { no: 14, statusPendaftar: 'NIM Tidak Sama dengan PMB', jumlahPendaftar: nimTidakSama, keterangan: 'Data NIM yang belum sinkron atau berbeda' },
      { no: 15, statusPendaftar: 'Tidak Memiliki Prodi', jumlahPendaftar: Number(tidakMemilikiProdi) || 0, keterangan: 'Pendaftar yang belum memilih prodi' },
    ];

    return {
      totalPendaftar,
      summary,
    };
  }

  /**
   * 2. Set KIP Kuliah (Sesuai Screenshot 3: Modal Konfirmasi Set KIP Kuliah All)
   */
  async setKipKuliah(params: { all?: boolean; isKip?: boolean; ids?: (number | string)[]; periodeId?: number }) {
    const isKip = params.isKip !== undefined ? Boolean(params.isKip) : true;
    const where: any = {};

    if (params.ids && Array.isArray(params.ids) && params.ids.length > 0) {
      const intIds = params.ids.map(Number).filter((n) => !isNaN(n));
      const strIds = params.ids.map(String);
      where.OR = [
        { id: { in: intIds } },
        { noPendaftaran: { in: strIds } },
      ];
    } else if (params.periodeId) {
      where.periodeId = Number(params.periodeId);
    }

    const result = await prisma.pendaftar.updateMany({
      where,
      data: { isKip },
    });

    return {
      success: true,
      message: `Berhasil mengatur status KIP Kuliah (${isKip ? 'Aktif' : 'Non-Aktif'}) untuk ${result.count} pendaftar.`,
      updatedCount: result.count,
    };
  }

  /**
   * 3. Set Finalisasi (Sesuai Screenshot 4: Modal Konfirmasi Set Finalisasi All)
   */
  async setFinalisasi(params: { all?: boolean; isFinalisasi?: boolean; ids?: (number | string)[]; periodeId?: number }) {
    const isFinal = params.isFinalisasi !== undefined ? Boolean(params.isFinalisasi) : true;
    const where: any = {};

    if (params.ids && Array.isArray(params.ids) && params.ids.length > 0) {
      const intIds = params.ids.map(Number).filter((n) => !isNaN(n));
      const strIds = params.ids.map(String);
      where.OR = [
        { id: { in: intIds } },
        { noPendaftaran: { in: strIds } },
      ];
    } else if (params.periodeId) {
      where.periodeId = Number(params.periodeId);
    }

    const result = await prisma.pendaftar.updateMany({
      where,
      data: {
        isFinalisasi: isFinal,
        statusPendaftar: isFinal ? 'SUDAH_FINALISASI' : 'BELUM_FINALISASI',
        tanggalFinalisasi: isFinal ? new Date() : null,
      },
    });

    return {
      success: true,
      message: `Berhasil mengatur Set Finalisasi (${isFinal ? 'Final' : 'Batal'}) untuk ${result.count} pendaftar.`,
      updatedCount: result.count,
    };
  }

  /**
   * 4a. Download Template Excel untuk Update Data Pendaftar (Sesuai Screenshot 5: Tombol Download)
   */
  async generateUpdateTemplate(filter?: any) {
    const where: any = {};
    if (filter?.periodeId) where.periodeId = Number(filter.periodeId);

    const items = await prisma.pendaftar.findMany({
      where,
      take: 50,
      include: { user: true, programStudi: true, orangTua: true },
      orderBy: { id: 'asc' },
    });

    const rows = items.map((p) => ({
      'No_Pendaftaran [KUNCI - JANGAN DIUBAH]': p.noPendaftaran,
      'Nama_Lengkap': p.user.nama,
      'NIK': p.nik || '',
      'No_HP': p.noHp || '',
      'Tempat_Lahir': p.tempatLahir || '',
      'Tanggal_Lahir (YYYY-MM-DD)': p.tanggalLahir ? p.tanggalLahir.toISOString().split('T')[0] : '',
      'Jenis_Kelamin (L/P)': p.jenisKelamin || 'L',
      'Agama': p.agama || 'Islam',
      'Suku': p.suku || '',
      'Alamat': p.alamat || '',
      'Asal_Sekolah': p.asalSekolah || '',
      'Nama_Ayah': p.orangTua?.namaAyah || '',
      'Nama_Ibu': p.orangTua?.namaIbu || '',
      'KIP_Kuliah (YA/TIDAK)': p.isKip ? 'YA' : 'TIDAK',
      'Status_Kelulusan (MENUNGGU/LULUS/TIDAK_LULUS/CADANGAN)': p.statusKelulusan,
      'NIM': p.nim || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [
      {
        'No_Pendaftaran [KUNCI - JANGAN DIUBAH]': '4102641848',
        'Nama_Lengkap': 'Contoh Nama',
        'NIK': '3201010000000001',
        'No_HP': '081234567890',
        'Tempat_Lahir': 'Bogor',
        'Tanggal_Lahir (YYYY-MM-DD)': '2005-01-01',
        'Jenis_Kelamin (L/P)': 'L',
        'Agama': 'Islam',
        'Suku': 'Sunda',
        'Alamat': 'Jl. Sholeh Iskandar No. 1',
        'Asal_Sekolah': 'SMA Negeri 1 Bogor',
        'Nama_Ayah': 'Nama Ayah',
        'Nama_Ibu': 'Nama Ibu',
        'KIP_Kuliah (YA/TIDAK)': 'TIDAK',
        'Status_Kelulusan (MENUNGGU/LULUS/TIDAK_LULUS/CADANGAN)': 'MENUNGGU',
        'NIM': '',
      }
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Update_Pendaftar');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * 4b. Update Batch Pendaftar dari File Excel (Sesuai Screenshot 5: Tombol Update)
   */
  async updateBatchExcel(bufferOrRows: Buffer | any[]) {
    let rows: any[] = [];
    if (Buffer.isBuffer(bufferOrRows)) {
      const workbook = XLSX.read(bufferOrRows, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(sheet);
    } else if (Array.isArray(bufferOrRows)) {
      rows = bufferOrRows;
    }

    if (!rows || rows.length === 0) {
      throw new Error('File Excel tidak berisi data pendaftar.');
    }

    let updatedCount = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const noPendaftaran = String(
        row['No_Pendaftaran [KUNCI - JANGAN DIUBAH]'] ||
        row['No_Pendaftaran'] ||
        row['noPendaftaran'] ||
        row['No Pendaftaran'] ||
        ''
      ).trim();

      if (!noPendaftaran) continue;

      try {
        const pendaftar = await prisma.pendaftar.findFirst({
          where: { noPendaftaran },
          include: { user: true },
        });

        if (!pendaftar) {
          errors.push(`Pendaftar dengan nomor "${noPendaftaran}" tidak ditemukan.`);
          continue;
        }

        const nama = row['Nama_Lengkap'] || row['Nama'] || row['nama'];
        if (nama) {
          await prisma.user.update({
            where: { id: pendaftar.userId },
            data: { nama: String(nama).trim() },
          });
        }

        const updateData: any = {};
        if (row['NIK'] || row['nik']) updateData.nik = String(row['NIK'] || row['nik']).trim();
        if (row['No_HP'] || row['noHp']) updateData.noHp = String(row['No_HP'] || row['noHp']).trim();
        if (row['Tempat_Lahir'] || row['tempatLahir']) updateData.tempatLahir = String(row['Tempat_Lahir'] || row['tempatLahir']).trim();
        if (row['Jenis_Kelamin (L/P)'] || row['jenisKelamin']) updateData.jenisKelamin = String(row['Jenis_Kelamin (L/P)'] || row['jenisKelamin']).trim();
        if (row['Agama'] || row['agama']) updateData.agama = String(row['Agama'] || row['agama']).trim();
        if (row['Suku'] || row['suku']) updateData.suku = String(row['Suku'] || row['suku']).trim();
        if (row['Alamat'] || row['alamat']) updateData.alamat = String(row['Alamat'] || row['alamat']).trim();
        if (row['Asal_Sekolah'] || row['asalSekolah']) updateData.asalSekolah = String(row['Asal_Sekolah'] || row['asalSekolah']).trim();

        const kipVal = String(row['KIP_Kuliah (YA/TIDAK)'] || row['isKip'] || '').toUpperCase();
        if (kipVal === 'YA' || kipVal === 'TRUE' || kipVal === '1') {
          updateData.isKip = true;
        } else if (kipVal === 'TIDAK' || kipVal === 'FALSE' || kipVal === '0') {
          updateData.isKip = false;
        }

        const statusKelulusan = row['Status_Kelulusan (MENUNGGU/LULUS/TIDAK_LULUS/CADANGAN)'] || row['statusKelulusan'];
        if (statusKelulusan) updateData.statusKelulusan = String(statusKelulusan).trim();

        const nim = row['NIM'] || row['nim'];
        if (nim !== undefined && nim !== '') updateData.nim = String(nim).trim();

        const rawTgl = row['Tanggal_Lahir (YYYY-MM-DD)'] || row['tanggalLahir'];
        if (rawTgl) {
          const d = new Date(rawTgl);
          if (!isNaN(d.getTime())) updateData.tanggalLahir = d;
        }

        await prisma.pendaftar.update({
          where: { id: pendaftar.id },
          data: updateData,
        });

        const namaAyah = row['Nama_Ayah'] || row['namaAyah'];
        const namaIbu = row['Nama_Ibu'] || row['namaIbu'];
        if (namaAyah || namaIbu) {
          await prisma.orangTua.upsert({
            where: { pendaftarId: pendaftar.id },
            update: {
              ...(namaAyah && { namaAyah: String(namaAyah).trim() }),
              ...(namaIbu && { namaIbu: String(namaIbu).trim() }),
            },
            create: {
              pendaftarId: pendaftar.id,
              namaAyah: namaAyah ? String(namaAyah).trim() : null,
              namaIbu: namaIbu ? String(namaIbu).trim() : null,
            },
          });
        }

        updatedCount++;
      } catch (err: any) {
        errors.push(`Gagal mengupdate nomor "${noPendaftaran}": ${err.message}`);
      }
    }

    return {
      success: true,
      message: `Berhasil memperbarui data ${updatedCount} pendaftar dari Excel.`,
      updatedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * 5. Reset Password Pendaftar (Dropdown Aksi: Reset Password Pendaftar)
   */
  async resetPasswordPendaftar(params: {
    ids?: (number | string)[];
    identifier?: number | string;
    all?: boolean;
    newPassword?: string;
  }) {
    const rawPass = params.newPassword || '123456';
    const hashedPassword = await bcrypt.hash(rawPass, 10);

    const whereUser: any = { role: 'CAMABA' };

    if (params.identifier) {
      const idStr = String(params.identifier).trim();
      const p = await prisma.pendaftar.findFirst({
        where: {
          OR: [
            { noPendaftaran: idStr },
            { user: { email: idStr } },
            ...(!isNaN(Number(idStr)) ? [{ id: Number(idStr) }] : []),
          ],
        },
      });
      if (p) {
        whereUser.id = p.userId;
      }
    } else if (params.ids && Array.isArray(params.ids) && params.ids.length > 0) {
      const intIds = params.ids.map(Number).filter((n) => !isNaN(n));
      const strIds = params.ids.map(String);
      const pendaftarList = await prisma.pendaftar.findMany({
        where: {
          OR: [
            { id: { in: intIds } },
            { noPendaftaran: { in: strIds } },
          ],
        },
        select: { userId: true },
      });
      const userIds = pendaftarList.map((p) => p.userId);
      whereUser.id = { in: userIds };
    }

    const result = await prisma.user.updateMany({
      where: whereUser,
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: `Password berhasil direset menjadi "${rawPass}" untuk ${result.count} akun pendaftar.`,
      resetCount: result.count,
      defaultPassword: rawPass,
    };
  }

  /**
   * 6a. Download Template Excel untuk Import Pendaftar Baru (Dropdown Aksi: Import)
   */
  async generateImportTemplate() {
    const prodis = await prisma.programStudi.findMany({
      take: 10,
      select: { id: true, namaProdi: true, jenjang: true },
    });

    const sampleRows = [
      {
        'Nama_Lengkap*': 'Muhammad Rizky Pratama',
        'Email*': 'rizky.pratama@gmail.com',
        'No_HP*': '081298765432',
        'NIK*': '3201011234560001',
        'Tempat_Lahir': 'Bogor',
        'Tanggal_Lahir (YYYY-MM-DD)': '2005-08-17',
        'Jenis_Kelamin (L/P)': 'L',
        'Agama': 'Islam',
        'Prodi_Pilihan_1 (ID/Nama)*': prodis[0] ? prodis[0].namaProdi : 'Teknik Informatika',
        'Prodi_Pilihan_2': prodis[1] ? prodis[1].namaProdi : 'Sistem Informasi',
        'Prodi_Pilihan_3': prodis[2] ? prodis[2].namaProdi : 'Manajemen',
        'Asal_Sekolah': 'SMA Negeri 1 Bogor',
        'Nama_Ayah': 'Herman Pratama',
        'Nama_Ibu': 'Nurhayati',
        'KIP_Kuliah (YA/TIDAK)': 'TIDAK',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Import_Pendaftar');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * 6b. Import Pendaftar Baru dari Excel (Dropdown Aksi: Import - Screenshot 2 Modal Import Pendaftar)
   */
  async importPendaftarExcel(
    bufferOrRows: Buffer | any[],
    options?: {
      periodeId?: number;
      gelombangId?: number;
      jalurPendaftaranId?: number;
      sistemKuliahId?: number;
      periodeDaftar?: string;
    }
  ) {
    let rows: any[] = [];
    if (Buffer.isBuffer(bufferOrRows)) {
      const workbook = XLSX.read(bufferOrRows, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(sheet);
    } else if (Array.isArray(bufferOrRows)) {
      rows = bufferOrRows;
    }

    if (!rows || rows.length === 0) {
      throw new Error('File Excel tidak berisi data pendaftar baru.');
    }

    // Default fallback jika tidak dipilih dari dropdown modal
    const [periodeDefault, gelombangDefault, jalurDefault, sistemDefault] = await Promise.all([
      prisma.periode.findFirst({ where: { isActive: true } }) || prisma.periode.findFirst({ orderBy: { id: 'desc' } }),
      prisma.gelombang.findFirst({ orderBy: { id: 'asc' } }),
      prisma.jalurPendaftaran.findFirst({ orderBy: { id: 'asc' } }),
      prisma.sistemKuliah.findFirst({ orderBy: { id: 'asc' } }),
    ]);

    const targetPeriodeId = options?.periodeId || periodeDefault?.id;
    const targetGelombangId = options?.gelombangId || gelombangDefault?.id;
    const targetJalurId = options?.jalurPendaftaranId || jalurDefault?.id;
    const targetSistemId = options?.sistemKuliahId || sistemDefault?.id;

    if (!targetPeriodeId || !targetGelombangId || !targetJalurId || !targetSistemId) {
      throw new Error('Master referensi (Periode/Gelombang/Jalur/Sistem) belum lengkap di database.');
    }

    let importedCount = 0;
    const errors: string[] = [];
    const defaultPasswordHash = await bcrypt.hash('123456', 10);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const nama = String(row['Nama_Lengkap*'] || row['Nama'] || row['nama'] || '').trim();
      if (!nama) continue;

      const email = String(
        row['Email*'] || row['Email'] || row['email'] || `mhs_${Date.now()}_${i}@spmb-uika.ac.id`
      ).trim().toLowerCase();

      try {
        const exist = await prisma.user.findUnique({ where: { email } });
        if (exist) {
          errors.push(`Baris ${i + 1}: Email "${email}" sudah terdaftar.`);
          continue;
        }

        const prodiPilihanStr = String(row['Prodi_Pilihan_1 (ID/Nama)*'] || row['Prodi_Pilihan_1'] || '').trim();
        let targetProdi = null;
        if (!isNaN(Number(prodiPilihanStr)) && Number(prodiPilihanStr) > 0) {
          targetProdi = await prisma.programStudi.findUnique({ where: { id: Number(prodiPilihanStr) } });
        }
        if (!targetProdi && prodiPilihanStr) {
          targetProdi = await prisma.programStudi.findFirst({
            where: { namaProdi: { contains: prodiPilihanStr, mode: 'insensitive' } },
          });
        }
        if (!targetProdi) {
          targetProdi = await prisma.programStudi.findFirst({ orderBy: { id: 'asc' } });
        }

        const noPendaftaran = `41027${Math.floor(10000 + Math.random() * 90000)}`;
        const rawTgl = row['Tanggal_Lahir (YYYY-MM-DD)'] || row['tanggalLahir'];
        let tglLahir: Date | null = null;
        if (rawTgl) {
          const d = new Date(rawTgl);
          if (!isNaN(d.getTime())) tglLahir = d;
        }

        const kipVal = String(row['KIP_Kuliah (YA/TIDAK)'] || '').toUpperCase();
        const isKip = kipVal === 'YA' || kipVal === 'TRUE';

        await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              nama,
              email,
              password: defaultPasswordHash,
              role: 'CAMABA',
              isActive: true,
            },
          });

          const pendaftar = await tx.pendaftar.create({
            data: {
              userId: user.id,
              noPendaftaran,
              periodeId: targetPeriodeId,
              gelombangId: targetGelombangId,
              jalurPendaftaranId: targetJalurId,
              sistemKuliahId: targetSistemId,
              programStudiId: targetProdi ? targetProdi.id : 1,
              statusPendaftar: 'BELUM_FINALISASI',
              statusKelulusan: 'MENUNGGU',
              isFinalisasi: false,
              isKip,
              nik: row['NIK*'] ? String(row['NIK*']).trim() : null,
              noHp: row['No_HP*'] ? String(row['No_HP*']).trim() : null,
              tempatLahir: row['Tempat_Lahir'] ? String(row['Tempat_Lahir']).trim() : null,
              tanggalLahir: tglLahir,
              jenisKelamin: row['Jenis_Kelamin (L/P)'] ? String(row['Jenis_Kelamin (L/P)']).trim() : null,
              agama: row['Agama'] ? String(row['Agama']).trim() : 'Islam',
              asalSekolah: row['Asal_Sekolah'] ? String(row['Asal_Sekolah']).trim() : null,
            },
          });

          if (row['Nama_Ayah'] || row['Nama_Ibu']) {
            await tx.orangTua.create({
              data: {
                pendaftarId: pendaftar.id,
                namaAyah: row['Nama_Ayah'] ? String(row['Nama_Ayah']).trim() : null,
                namaIbu: row['Nama_Ibu'] ? String(row['Nama_Ibu']).trim() : null,
              },
            });
          }
        });

        importedCount++;
      } catch (err: any) {
        errors.push(`Baris ${i + 1} (${nama}): ${err.message}`);
      }
    }

    return {
      success: true,
      message: `Berhasil mengimpor ${importedCount} pendaftar baru dari file Excel.`,
      importedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // ========================================================
  // SUB-FITUR: LEADS MAUKULIAH (Tombol Leads di Modul Pendaftar)
  // ========================================================

  /**
   * Dropdown opsi filter untuk Halaman Leads Maukuliah (Screenshot Leads Maukuliah)
   */
  async getLeadsDropdownOptions() {
    const distinctTahun = await prisma.leadsMaukuliah.findMany({
      select: { tahunMasuk: true },
      distinct: ['tahunMasuk'],
      orderBy: { tahunMasuk: 'desc' },
    });

    const distinctSumber = await prisma.leadsMaukuliah.findMany({
      select: { sumberData: true },
      distinct: ['sumberData'],
      orderBy: { sumberData: 'asc' },
    });

    return {
      tahunMasukLeads: [
        { value: '', label: '-- Semua Status --' },
        ...distinctTahun.map((t) => ({ value: String(t.tahunMasuk), label: String(t.tahunMasuk) })),
      ],
      sumberLeads: [
        { value: '', label: '-- Semua Status --' },
        ...distinctSumber.map((s) => ({ value: s.sumberData, label: s.sumberData })),
      ],
      statusLeads: [
        { value: '', label: '-- Semua Status --' },
        { value: 'Belum dihubungi', label: 'Belum dihubungi' },
        { value: 'Sudah dihubungi', label: 'Sudah dihubungi' },
      ],
      kategoriSearch: [
        { value: 'all', label: '-- Semua --' },
        { value: 'nama', label: 'Nama Leads' },
        { value: 'kontak', label: 'Kontak (Email / No. HP)' },
        { value: 'email', label: 'Email' },
        { value: 'noHp', label: 'No. Handphone' },
      ],
    };
  }

  /**
   * Mengambil daftar leads Maukuliah dengan filter dan pagination (Screenshot Leads Maukuliah UIKA)
   */
  async getLeadsList(filter: {
    tahunMasuk?: number;
    sumberData?: string;
    status?: string;
    isDihubungi?: boolean;
    search?: string;
    searchBy?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filter.tahunMasuk && !isNaN(Number(filter.tahunMasuk))) {
      where.tahunMasuk = Number(filter.tahunMasuk);
    }

    if (filter.sumberData && filter.sumberData.trim() !== '' && filter.sumberData !== '-- Semua Status --') {
      where.sumberData = { contains: filter.sumberData.trim(), mode: 'insensitive' };
    }

    if (filter.status && filter.status.trim() !== '' && filter.status !== '-- Semua Status --') {
      where.status = { equals: filter.status.trim(), mode: 'insensitive' };
    }

    if (filter.isDihubungi !== undefined) {
      where.isDihubungi = Boolean(filter.isDihubungi);
    }

    // Pencarian text
    if (filter.search && filter.search.trim() !== '') {
      const q = filter.search.trim();
      const sBy = filter.searchBy || 'all';

      if (sBy === 'nama') {
        where.namaLeads = { contains: q, mode: 'insensitive' };
      } else if (sBy === 'email') {
        where.email = { contains: q, mode: 'insensitive' };
      } else if (sBy === 'noHp') {
        where.noHp = { contains: q, mode: 'insensitive' };
      } else if (sBy === 'kontak') {
        where.OR = [
          { email: { contains: q, mode: 'insensitive' } },
          { noHp: { contains: q, mode: 'insensitive' } },
        ];
      } else {
        where.OR = [
          { namaLeads: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { noHp: { contains: q, mode: 'insensitive' } },
          { sumberData: { contains: q, mode: 'insensitive' } },
        ];
      }
    }

    const [totalItems, items] = await Promise.all([
      prisma.leadsMaukuliah.count({ where }),
      prisma.leadsMaukuliah.findMany({
        where,
        skip,
        take: limit,
        orderBy: { tanggalMasuk: 'desc' },
      }),
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    const formatTgl = (d: Date | null) => {
      if (!d) return '-';
      const day = d.getDate();
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      const secs = String(d.getSeconds()).padStart(2, '0');
      return `${day} ${month} ${year}, ${hours}:${mins}:${secs}`;
    };

    const formatTglLahir = (d: Date | null) => {
      if (!d) return '-';
      const day = d.getDate();
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    };

    const formattedData = items.map((item) => {
      const isProspect = item.sumberData.toLowerCase() === 'prospect';
      const isDihubungi = item.isDihubungi || item.status.toLowerCase() === 'sudah dihubungi';

      return {
        id: item.id,
        tanggalMasukRaw: item.tanggalMasuk,
        tanggalMasuk: formatTgl(item.tanggalMasuk),
        namaLeads: item.namaLeads,
        kontak: {
          email: item.email || null,
          noHp: item.noHp || null,
        },
        tanggalLahirRaw: item.tanggalLahir,
        tanggalLahir: formatTglLahir(item.tanggalLahir),
        sumberData: {
          label: item.sumberData,
          badgeColor: isProspect ? 'warning' : 'info',
        },
        status: {
          label: isDihubungi ? 'Sudah dihubungi' : 'Belum dihubungi',
          variant: isDihubungi ? 'success' : 'danger',
          isDihubungi,
        },
        tanggalDihubungiRaw: item.tanggalDihubungi,
        tanggalDihubungi: formatTgl(item.tanggalDihubungi),
        petugasFollowUp: item.petugasFollowUp,
        catatan: item.catatan || null,
        tahunMasuk: item.tahunMasuk,
      };
    });

    return {
      data: formattedData,
      pagination: {
        totalItems,
        currentPage: page,
        limit,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  /**
   * Detail 1 Leads Maukuliah
   */
  async getLeadsDetail(id: number) {
    const item = await prisma.leadsMaukuliah.findUnique({
      where: { id: Number(id) },
    });

    if (!item) {
      throw new Error(`Data Leads dengan ID "${id}" tidak ditemukan.`);
    }

    return item;
  }

  /**
   * Aksi Tombol Hijau Checkmark: Tandai Sudah Dihubungi / Follow up
   */
  async hubungiLeads(id: number, data?: { catatan?: string; petugas?: string }) {
    const item = await prisma.leadsMaukuliah.findUnique({
      where: { id: Number(id) },
    });

    if (!item) {
      throw new Error(`Data Leads dengan ID "${id}" tidak ditemukan.`);
    }

    const updated = await prisma.leadsMaukuliah.update({
      where: { id: Number(id) },
      data: {
        status: 'Sudah dihubungi',
        isDihubungi: true,
        tanggalDihubungi: new Date(),
        petugasFollowUp: data?.petugas || 'Admin PMB',
        catatan: data?.catatan || item.catatan || 'Telah dihubungi oleh petugas admin PMB.',
      },
    });

    return {
      success: true,
      message: `Leads ${updated.namaLeads} berhasil ditandai 'Sudah dihubungi'.`,
      data: updated,
    };
  }

  /**
   * Tambah Leads Baru secara manual atau via webhook Maukuliah
   */
  async createLeads(data: any) {
    if (!data.namaLeads && !data.nama) {
      throw new Error('Nama leads wajib diisi.');
    }

    const tglLahir = data.tanggalLahir ? new Date(data.tanggalLahir) : null;

    const created = await prisma.leadsMaukuliah.create({
      data: {
        namaLeads: String(data.namaLeads || data.nama).trim(),
        email: data.email ? String(data.email).trim().toLowerCase() : null,
        noHp: data.noHp || data.telepon || null,
        tanggalLahir: tglLahir && !isNaN(tglLahir.getTime()) ? tglLahir : null,
        sumberData: data.sumberData || 'Prospect',
        status: 'Belum dihubungi',
        isDihubungi: false,
        tahunMasuk: data.tahunMasuk ? Number(data.tahunMasuk) : new Date().getFullYear(),
      },
    });

    return {
      success: true,
      message: 'Data Leads Maukuliah berhasil ditambahkan.',
      data: created,
    };
  }
}

export const adminPendaftarService = new AdminPendaftarService();
