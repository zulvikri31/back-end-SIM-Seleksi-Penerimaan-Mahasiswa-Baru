import prisma from '../config/database';

export interface FilterLaporanUkt {
  periodeId?: number;
  jalurId?: number;
  gelombangId?: number;
  sistemKuliahId?: number;
  prodiDiterimaId?: number;
  kelompokUkt?: string;
  format?: 'HTML' | 'PDF' | 'EXCEL';
  gunakanKop?: boolean;
}

export class AdminLaporanService {
  /**
   * Laporan UKT Pendaftar (Sesuai Screenshot 4)
   */
  async getLaporanUkt(filter: FilterLaporanUkt) {
    const where: any = {};

    if (filter.periodeId) where.periodeId = Number(filter.periodeId);
    if (filter.jalurId) where.jalurPendaftaranId = Number(filter.jalurId);
    if (filter.gelombangId) where.gelombangId = Number(filter.gelombangId);
    if (filter.sistemKuliahId) where.sistemKuliahId = Number(filter.sistemKuliahId);
    if (filter.prodiDiterimaId) where.prodiDiterimaId = Number(filter.prodiDiterimaId);
    if (filter.kelompokUkt && filter.kelompokUkt !== 'all') {
      where.kelompokUkt = filter.kelompokUkt;
    }

    const items = await prisma.pendaftar.findMany({
      where,
      orderBy: { id: 'asc' },
      include: {
        user: true,
        periode: true,
        gelombang: true,
        jalurPendaftaran: true,
        sistemKuliah: true,
        prodiDiterima: true,
        programStudi: true,
        orangTua: true,
      },
    });

    const rows = items.map((p, index) => {
      const prodi = p.prodiDiterima || p.programStudi;
      return {
        no: index + 1,
        idPendaftar: p.noPendaftaran || `411256${String(p.id).padStart(4, '0')}`,
        nama: p.user.nama,
        email: p.user.email,
        noHp: p.noHp || '-',
        prodi: prodi ? `${prodi.jenjang} - ${prodi.namaProdi}` : '-',
        jalur: p.jalurPendaftaran.nama,
        gelombang: p.gelombang.nama,
        sistemKuliah: p.sistemKuliah.nama,
        kelompokUkt: p.kelompokUkt || (p.isKip ? 'KIP-Kuliah' : 'UKT 2'),
        nominalUkt: p.nominalUkt || (p.isKip ? 0 : 3500000),
        penghasilanOrtu: p.orangTua?.penghasilanOrtu || 'Rp 2.000.000 - Rp 4.000.000',
        pekerjaanAyah: p.orangTua?.pekerjaanAyah || '-',
        statusDaftarUlang: p.isDaftarUlang ? 'Lunas / Terdaftar' : 'Belum Bayar',
      };
    });

    // Ringkasan per Kelompok UKT
    const summaryByKelompok: Record<string, { count: number; totalNominal: number }> = {};
    rows.forEach((r) => {
      const k = r.kelompokUkt;
      if (!summaryByKelompok[k]) {
        summaryByKelompok[k] = { count: 0, totalNominal: 0 };
      }
      summaryByKelompok[k].count += 1;
      summaryByKelompok[k].totalNominal += r.nominalUkt;
    });

    return {
      kop: {
        instansi: 'UNIVERSITAS IBN KHALDUN BOGOR',
        unit: 'Seleksi Penerimaan Mahasiswa Baru (SPMB)',
        alamat: 'Jl. KH. Sholeh Iskandar Km. 2, Kedung Badak, Tanah Sareal, Kota Bogor 16162',
        telepon: '(0251) 8356884',
        website: 'https://uika-bogor.ac.id',
        useKop: filter.gunakanKop ?? true,
      },
      judul: 'LAPORAN PENETAPAN UKT PENDAFTAR MAHASISWA BARU',
      tanggalCetak: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      filterApplied: {
        periodeId: filter.periodeId,
        jalurId: filter.jalurId,
        gelombangId: filter.gelombangId,
        sistemKuliahId: filter.sistemKuliahId,
        prodiDiterimaId: filter.prodiDiterimaId,
        kelompokUkt: filter.kelompokUkt || 'Semua Kelompok',
        format: filter.format || 'HTML',
      },
      totalPendaftar: rows.length,
      totalNominalUkt: rows.reduce((acc, r) => acc + r.nominalUkt, 0),
      summaryByKelompok,
      data: rows,
    };
  }

  /**
   * Laporan Biodata Pendaftar
   */
  async getLaporanBiodata(filter: any) {
    const where: any = {};
    if (filter.periodeId) where.periodeId = Number(filter.periodeId);
    if (filter.gelombangId) where.gelombangId = Number(filter.gelombangId);
    if (filter.jalurId) where.jalurPendaftaranId = Number(filter.jalurId);

    const items = await prisma.pendaftar.findMany({
      where,
      include: {
        user: true,
        periode: true,
        gelombang: true,
        jalurPendaftaran: true,
        programStudi: true,
        pilihanProdi2: true,
        pilihanProdi3: true,
        orangTua: true,
      },
    });

    return items.map((p, idx) => ({
      no: idx + 1,
      idPendaftar: p.noPendaftaran,
      nama: p.user.nama,
      email: p.user.email,
      nik: p.nik || '-',
      jenisKelamin: p.jenisKelamin || '-',
      tempatTanggalLahir: `${p.tempatLahir || '-'}, ${p.tanggalLahir ? p.tanggalLahir.toISOString().split('T')[0] : '-'}`,
      alamat: p.alamat || '-',
      kabupatenKota: p.kabupatenKota || '-',
      provinsi: p.provinsi || '-',
      asalSekolah: p.asalSekolah || '-',
      pilihan1: p.programStudi ? p.programStudi.namaProdi : '-',
      pilihan2: p.pilihanProdi2 ? p.pilihanProdi2.namaProdi : '-',
      pilihan3: p.pilihanProdi3 ? p.pilihanProdi3.namaProdi : '-',
      namaAyah: p.orangTua?.namaAyah || '-',
      namaIbu: p.orangTua?.namaIbu || '-',
      statusPendaftar: p.statusPendaftar,
    }));
  }

  /**
   * Laporan Rekapitulasi Pendaftar Per Prodi
   */
  async getLaporanRekapitulasi(periodeId?: number) {
    const prodis = await prisma.programStudi.findMany({
      include: {
        pendaftar: true,
        pendaftarPilihan2: true,
        pendaftarPilihan3: true,
        pendaftarDiterima: true,
      },
    });

    return prodis.map((pr, idx) => {
      const p1 = pr.pendaftar.length;
      const p2 = pr.pendaftarPilihan2.length;
      const p3 = pr.pendaftarPilihan3.length;
      const totalPeminat = p1 + p2 + p3;
      const diterima = pr.pendaftarDiterima.length;
      const daftarUlang = pr.pendaftarDiterima.filter((p) => p.isDaftarUlang).length;

      return {
        no: idx + 1,
        jenjang: pr.jenjang,
        namaProdi: pr.namaProdi,
        pilihan1: p1,
        pilihan2: p2,
        pilihan3: p3,
        totalPeminat,
        lulus: diterima,
        daftarUlang,
      };
    });
  }
}

export const adminLaporanService = new AdminLaporanService();
