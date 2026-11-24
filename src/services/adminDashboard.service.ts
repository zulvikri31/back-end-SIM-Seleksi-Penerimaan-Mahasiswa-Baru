import prisma from '../config/database';

export interface GlobalDashboardFilter {
  periodeId?: number;
  periodeIds?: number[];
  kodePeriode?: string;
  // Multi-Select Unit / Program Studi (Pilihan 1, 2, atau 3)
  programStudiIds?: number[];
  programStudiId?: number;
  unitIds?: number[];
  prodiIds?: number[];
  // Multi-Select Jalur Pendaftaran
  jalurPendaftaranIds?: number[];
  jalurIds?: number[];
  jalurId?: number;
  // Multi-Select Sistem Kuliah
  sistemKuliahIds?: number[];
  sistemIds?: number[];
  sistemKuliahId?: number;
  // Multi-Select Gelombang
  gelombangIds?: number[];
  gelombangId?: number;
  // Multi-Select Jenis Pendaftaran & Jenjang
  jenisPendaftaran?: string[];
  jenjang?: string[];
  // Parameter Tambahan Grafik & Tabel
  frekuensi?: 'bulanan' | 'harian';
  jenisPerhitungan?: 'reguler' | 'kumulatif';
  tahun?: number;
  search?: string;
  page?: number;
  limit?: number;
  mode?: string;
  sebaran?: string;
  kabupatenKota?: string;
  provinsi?: string;
  topKotaLimit?: number;
  jenisPeriode?: string;
}

export type DashboardChartsFilter = GlobalDashboardFilter;

export class AdminDashboardService {
  /**
   * Helper Resolusi Filter Global & Pembangunan Where Clause Prisma
   * Aturan:
   * 1. Multi-Select Array IDs menggunakan operator { in: [...] }.
   * 2. Program Studi dicek di pilihan 1, 2, atau 3 (pendaftarWhere.OR).
   * 3. Satu pendaftar hanya dihitung 1 kali (deduplikasi baris pendaftar).
   * 4. Logika identik 100% dengan modul Daftar Pendaftar dan ODS.
   */
  public async buildWhereClause(filter: GlobalDashboardFilter = {}) {
    // 1. Normalisasi Program Studi (Unit) & Jenjang
    const rawProdiIds = (filter.programStudiIds && filter.programStudiIds.length > 0)
      ? filter.programStudiIds
      : filter.unitIds && filter.unitIds.length > 0
      ? filter.unitIds
      : filter.prodiIds && filter.prodiIds.length > 0
      ? filter.prodiIds
      : filter.programStudiId
      ? [filter.programStudiId]
      : [];

    const jenjangList = filter.jenjang && filter.jenjang.length > 0 ? filter.jenjang : [];
    let effectiveProdiIds: number[] = [];

    if (jenjangList.length > 0) {
      const prodisWithJenjang = await prisma.programStudi.findMany({
        where: {
          jenjang: { in: jenjangList, mode: 'insensitive' },
        },
        select: { id: true },
      });
      const idsWithJenjang = prodisWithJenjang.map((p) => p.id);

      if (rawProdiIds.length > 0) {
        effectiveProdiIds = rawProdiIds.filter((id) => idsWithJenjang.includes(id));
      } else {
        effectiveProdiIds = idsWithJenjang;
      }
    } else {
      effectiveProdiIds = rawProdiIds;
    }

    // 2. Normalisasi Jalur Pendaftaran & Jenis Pendaftaran
    const rawJalurIds = (filter.jalurPendaftaranIds && filter.jalurPendaftaranIds.length > 0)
      ? filter.jalurPendaftaranIds
      : filter.jalurIds && filter.jalurIds.length > 0
      ? filter.jalurIds
      : filter.jalurId
      ? [filter.jalurId]
      : [];

    const jenisList = filter.jenisPendaftaran && filter.jenisPendaftaran.length > 0 ? filter.jenisPendaftaran : [];
    let effectiveJalurIds: number[] = [];

    if (jenisList.length > 0) {
      const allJalurs = await prisma.jalurPendaftaran.findMany({
        select: { id: true, nama: true },
      });

      const matchedJalurIds = allJalurs
        .filter((j) => {
          const jNama = (j.nama || '').toLowerCase();
          let jenis = 'Peserta Didik Baru';
          if (jNama.includes('perolehan')) jenis = 'RPL Perolehan SKS';
          else if (jNama.includes('transfer')) jenis = 'RPL Transfer SKS';
          else if (jNama.includes('rpl')) jenis = 'RPL Perolehan SKS';
          else if (jNama.includes('pindahan')) jenis = 'Pindahan';
          else if (jNama.includes('alih') || jNama.includes('ekstensi')) jenis = 'Alih Jenjang';

          return jenisList.some((jl) => jl.toLowerCase() === jenis.toLowerCase() || jNama.includes(jl.toLowerCase()));
        })
        .map((j) => j.id);

      if (rawJalurIds.length > 0) {
        effectiveJalurIds = rawJalurIds.filter((id) => matchedJalurIds.includes(id));
      } else {
        effectiveJalurIds = matchedJalurIds;
      }
    } else {
      effectiveJalurIds = rawJalurIds;
    }

    // 3. Normalisasi Sistem Kuliah & Gelombang
    const sistemIds = (filter.sistemKuliahIds && filter.sistemKuliahIds.length > 0)
      ? filter.sistemKuliahIds
      : filter.sistemIds && filter.sistemIds.length > 0
      ? filter.sistemIds
      : filter.sistemKuliahId
      ? [filter.sistemKuliahId]
      : [];

    const gelombangIds = (filter.gelombangIds && filter.gelombangIds.length > 0)
      ? filter.gelombangIds
      : filter.gelombangId
      ? [filter.gelombangId]
      : [];

    // 4. Normalisasi Periode
    const periodeIds = (filter.periodeIds && filter.periodeIds.length > 0)
      ? filter.periodeIds
      : filter.periodeId
      ? [filter.periodeId]
      : [];

    // 5. Susun Prisma Where Clause yang Terstandarisasi
    const where: any = {};

    if (periodeIds.length === 1) {
      where.periodeId = periodeIds[0];
    } else if (periodeIds.length > 1) {
      where.periodeId = { in: periodeIds };
    }

    if (effectiveProdiIds.length > 0) {
      // Pengecekan di pilihan 1, pilihan 2, atau pilihan 3
      where.OR = [
        { programStudiId: { in: effectiveProdiIds } },
        { pilihanProdi2Id: { in: effectiveProdiIds } },
        { pilihanProdi3Id: { in: effectiveProdiIds } },
      ];
    }

    if (effectiveJalurIds.length > 0) {
      where.jalurPendaftaranId = { in: effectiveJalurIds };
    }

    if (sistemIds.length > 0) {
      where.sistemKuliahId = { in: sistemIds };
    }

    if (gelombangIds.length > 0) {
      where.gelombangId = { in: gelombangIds };
    }

    if (filter.kabupatenKota && filter.kabupatenKota !== '-- Semua Kota / Kabupaten --') {
      where.kabupatenKota = { contains: filter.kabupatenKota, mode: 'insensitive' };
    }

    if (filter.provinsi) {
      where.provinsi = { contains: filter.provinsi, mode: 'insensitive' };
    }

    return {
      where,
      effectiveProdiIds,
      effectiveJalurIds,
      sistemIds,
      gelombangIds,
      periodeIds,
      jenjangList,
      jenisList,
    };
  }

  /**
   * Endpoint Utama: Mengambil Seluruh Data Indikator, Grafik & Analytics Dashboard
   */
  async getChartsData(filter: GlobalDashboardFilter = {}) {
    // 1. Ambil daftar semua periode untuk dropdown & perbandingan bar chart
    const daftarPeriode = await prisma.periode.findMany({
      orderBy: { kode: 'desc' },
      select: { id: true, kode: true, nama: true, isActive: true },
    });

    const periodeAktif = daftarPeriode.find((p) => p.isActive) || daftarPeriode[0] || null;

    // 2. Tentukan periode yang dipilih
    let selectedPeriodeId: number | undefined;
    let selectedPeriode = null;

    if (filter.periodeId) {
      selectedPeriodeId = Number(filter.periodeId);
      selectedPeriode = daftarPeriode.find((p) => p.id === selectedPeriodeId) || null;
    } else if (filter.kodePeriode) {
      selectedPeriode = daftarPeriode.find((p) => p.kode === String(filter.kodePeriode)) || null;
      if (selectedPeriode) selectedPeriodeId = selectedPeriode.id;
    } else if (periodeAktif) {
      selectedPeriodeId = periodeAktif.id;
      selectedPeriode = periodeAktif;
    }

    // Tentukan periode sebelumnya untuk komparasi Bar Chart Funnel
    let periodeSebelumnya: any = null;
    if (selectedPeriode) {
      const currentIndex = daftarPeriode.findIndex((p) => p.id === selectedPeriode!.id);
      if (currentIndex !== -1 && currentIndex + 1 < daftarPeriode.length) {
        periodeSebelumnya = daftarPeriode[currentIndex + 1];
      }
    }

    // 3. Bangun Where Clause dengan Deduplikasi Terjamin
    const resolvedFilter = { ...filter, periodeId: selectedPeriodeId };
    const { where, effectiveProdiIds, effectiveJalurIds, sistemIds, gelombangIds } =
      await this.buildWhereClause(resolvedFilter);

    // 4. Query Pendaftar Periode Terpilih
    const pendaftarList = await prisma.pendaftar.findMany({
      where,
      include: {
        user: {
          select: { id: true, nama: true, email: true, createdAt: true, isActive: true },
        },
        periode: {
          select: { id: true, kode: true, nama: true },
        },
        programStudi: {
          select: { id: true, namaProdi: true, jenjang: true, fakultas: true },
        },
        pilihanProdi2: {
          select: { id: true, namaProdi: true, jenjang: true },
        },
        pilihanProdi3: {
          select: { id: true, namaProdi: true, jenjang: true },
        },
        prodiDiterima: {
          select: { id: true, namaProdi: true, jenjang: true },
        },
        jalurPendaftaran: true,
        sistemKuliah: true,
        gelombang: true,
      },
    });

    // Peminat: Akun Camaba (termasuk yang belum memilih prodi jika tidak ada filter prodi/jalur spesifik)
    const isFilteredSpecific = effectiveProdiIds.length > 0 || effectiveJalurIds.length > 0 || sistemIds.length > 0 || gelombangIds.length > 0;
    const usersWithoutPendaftar = isFilteredSpecific
      ? 0
      : await prisma.user.count({
          where: {
            role: 'CAMABA',
            pendaftar: null,
          },
        });

    // =========================================================================
    // 2. DEFINISI 4 SUMMARY CARDS UTAMA (KPI) & 8 TAHAPAN FUNNEL
    // =========================================================================
    // 1. Peminat: Akun Camaba yang belum aktif (user.isActive = false atau belum bayar tagihan formulir)
    // 2. Pendaftar: Akun Camaba yang sudah aktif (user.isActive = true / sudah bayar formulir / memiliki nomor pendaftaran)
    // 3. Diterima Program Studi: Camaba yang sudah dinyatakan lulus (isDiterima = true atau statusKelulusan = 'LULUS')
    // 4. Daftar Ulang: Camaba yang sudah daftar ulang (isDaftarUlang = true)

    // Klasifikasi Peminat & Pendaftar
    const isPendaftarAktif = (p: typeof pendaftarList[0]) => {
      return Boolean(p.user?.isActive || p.isTagihanFormulir || (p.noPendaftaran && p.noPendaftaran.trim() !== ''));
    };

    const countPendaftarAktif = pendaftarList.filter(isPendaftarAktif).length;
    const countPendaftarBelumAktif = pendaftarList.filter((p) => !isPendaftarAktif(p)).length + usersWithoutPendaftar;

    // Total Peminat (Tahap 1)
    const totalPeminat = pendaftarList.length + usersWithoutPendaftar;
    // Total Pendaftar (Tahap 2)
    const totalPendaftar = countPendaftarAktif;

    // Tahap 3: Mengisi Biodata
    const countTahap3 = pendaftarList.filter((p) => p.isBiodataLengkap).length;
    // Tahap 4: Finalisasi Data
    const countTahap4 = pendaftarList.filter((p) => p.isFinalisasi).length;
    // Tahap 5: Mengikuti Seleksi
    const countTahap5 = pendaftarList.filter((p) => p.isIkutSeleksi).length;
    // Tahap 6: Lulus / Diterima Program Studi
    const countTahap6 = pendaftarList.filter((p) => p.isDiterima || p.statusKelulusan === 'LULUS').length;
    // Tahap 7: Daftar Ulang
    const countTahap7 = pendaftarList.filter((p) => p.isDaftarUlang).length;
    // Tahap 8: Memiliki NIM (Generate NIM)
    const countTahap8 = pendaftarList.filter((p) => p.nim && p.nim.trim() !== '').length;

    // Sub-badges Diterima: Pilihan 1 vs Pilihan Lainnya
    const diterimaPilihan1 = pendaftarList.filter(
      (p) => (p.isDiterima || p.statusKelulusan === 'LULUS') && (!p.prodiDiterimaId || p.prodiDiterimaId === p.programStudiId)
    ).length;
    const diterimaPilihanLainnya = Math.max(0, countTahap6 - diterimaPilihan1);

    // Sub-badges Daftar Ulang
    const sudahDaftarUlang = countTahap7;
    const belumDaftarUlang = Math.max(0, countTahap6 - countTahap7);

    // Rumus Persentase Funnel Terhadap Total Peminat (Tahap 1): (jumlah_tahap / total_peminat) * 100
    const calcPct = (val: number, base: number) => {
      if (base <= 0) return 0;
      return Math.round((val / base) * 10000) / 100; // 2 desimal (contoh: 85.47%)
    };

    // 4 Summary Cards Utama (KPI)
    const summary = {
      totalPeminat,
      totalPendaftar,
      totalDiterima: countTahap6,
      totalLulus: countTahap6,
      totalDaftarUlang: countTahap7,
      totalBiodataLengkap: countTahap3,
      totalFinalisasi: countTahap4,
      totalIkutSeleksi: countTahap5,
      totalGenerateNim: countTahap8,

      // Detail Kartu KPI dengan Sub-Badges (SEVIMA UI)
      jumlahPeminat: {
        total: totalPeminat,
        akunAktif: countPendaftarAktif,
        akunBelumAktif: countPendaftarBelumAktif,
        label: 'Jumlah Peminat',
      },
      jumlahPendaftar: {
        total: totalPendaftar,
        sudahFinalisasi: countTahap4,
        belumFinalisasi: Math.max(0, totalPendaftar - countTahap4),
        label: 'Jumlah Pendaftar',
      },
      diterimaProgramStudi: {
        total: countTahap6,
        pilihan1: diterimaPilihan1,
        pilihanLainnya: diterimaPilihanLainnya,
        label: 'Diterima Program Studi',
      },
      jumlahDaftarUlang: {
        total: countTahap7,
        sudahDaftarUlang,
        belumDaftarUlang,
        label: 'Jumlah Daftar Ulang',
      },
    };

    // =========================================================================
    // 3A. PROSES PENDAFTARAN MAHASISWA BARU (MODE FUNNEL & BAR CHART)
    // =========================================================================
    // Query periode sebelumnya untuk bar chart komparasi
    let prevStages = [0, 0, 0, 0, 0, 0, 0, 0];
    if (periodeSebelumnya) {
      const prevFilter = { ...filter, periodeId: periodeSebelumnya.id };
      const { where: prevWhere } = await this.buildWhereClause(prevFilter);

      const prevPendaftar = await prisma.pendaftar.findMany({
        where: prevWhere,
        include: {
          user: { select: { isActive: true } },
        },
      });

      const pCount = prevPendaftar.length;
      const prevAktif = prevPendaftar.filter((p) => p.user?.isActive || p.isTagihanFormulir || p.noPendaftaran).length;

      prevStages = [
        pCount > 0 ? pCount : 0,
        prevAktif,
        prevPendaftar.filter((p) => p.isBiodataLengkap).length,
        prevPendaftar.filter((p) => p.isFinalisasi).length,
        prevPendaftar.filter((p) => p.isIkutSeleksi).length,
        prevPendaftar.filter((p) => p.isDiterima || p.statusKelulusan === 'LULUS').length,
        prevPendaftar.filter((p) => p.isDaftarUlang).length,
        prevPendaftar.filter((p) => p.nim && p.nim.trim() !== '').length,
      ];
    }

    const funnelTahapan = [
      {
        tahap: 1,
        nama: 'Peminat',
        deskripsi: 'Calon mahasiswa baru yang telah registrasi akun PMB',
        total: totalPeminat,
        totalSebelumnya: prevStages[0],
        persentase: 100,
        konversiDariSebelumnya: 100,
      },
      {
        tahap: 2,
        nama: 'Pendaftar',
        deskripsi: 'Akun aktif yang telah memilih jalur & membayar formulir',
        total: totalPendaftar,
        totalSebelumnya: prevStages[1],
        persentase: calcPct(totalPendaftar, totalPeminat),
        konversiDariSebelumnya: calcPct(totalPendaftar, totalPeminat),
      },
      {
        tahap: 3,
        nama: 'Mengisi Biodata',
        deskripsi: 'Pendaftar yang telah melengkapi biodata diri dan berkas',
        total: countTahap3,
        totalSebelumnya: prevStages[2],
        persentase: calcPct(countTahap3, totalPeminat),
        konversiDariSebelumnya: calcPct(countTahap3, totalPendaftar),
      },
      {
        tahap: 4,
        nama: 'Finalisasi Data',
        deskripsi: 'Pendaftar yang telah melakukan kunci data pendaftaran permanen',
        total: countTahap4,
        totalSebelumnya: prevStages[3],
        persentase: calcPct(countTahap4, totalPeminat),
        konversiDariSebelumnya: calcPct(countTahap4, countTahap3),
      },
      {
        tahap: 5,
        nama: 'Mengikuti Seleksi',
        deskripsi: 'Pendaftar yang telah mengikuti ujian CBT / verifikasi berkas nilai',
        total: countTahap5,
        totalSebelumnya: prevStages[4],
        persentase: calcPct(countTahap5, totalPeminat),
        konversiDariSebelumnya: calcPct(countTahap5, countTahap4),
      },
      {
        tahap: 6,
        nama: 'Lulus',
        deskripsi: 'Pendaftar yang dinyatakan lulus seleksi dan diterima di program studi',
        total: countTahap6,
        totalSebelumnya: prevStages[5],
        persentase: calcPct(countTahap6, totalPeminat),
        konversiDariSebelumnya: calcPct(countTahap6, countTahap5),
      },
      {
        tahap: 7,
        nama: 'Daftar Ulang',
        deskripsi: 'Calon mahasiswa baru yang telah menyelesaikan registrasi ulang',
        total: countTahap7,
        totalSebelumnya: prevStages[6],
        persentase: calcPct(countTahap7, totalPeminat),
        konversiDariSebelumnya: calcPct(countTahap7, countTahap6),
      },
      {
        tahap: 8,
        nama: 'Memiliki NIM',
        deskripsi: 'Mahasiswa baru resmi yang telah diterbitkan Nomor Induk Mahasiswa',
        total: countTahap8,
        totalSebelumnya: prevStages[7],
        persentase: calcPct(countTahap8, totalPeminat),
        konversiDariSebelumnya: calcPct(countTahap8, countTahap7),
      },
    ];

    const funnelBarChart = {
      categories: ['Peminat', 'Pendaftar', 'Mengisi Biodata', 'Finalisasi', 'Mengikuti Seleksi', 'Lulus', 'Daftar Ulang', 'Memiliki NIM'],
      series: [
        {
          name: `Periode ${selectedPeriode?.nama || selectedPeriode?.kode || 'Aktif'}`,
          data: [totalPeminat, totalPendaftar, countTahap3, countTahap4, countTahap5, countTahap6, countTahap7, countTahap8],
        },
        {
          name: `Periode ${periodeSebelumnya?.nama || periodeSebelumnya?.kode || 'Sebelumnya'}`,
          data: prevStages,
        },
      ],
    };

    // =========================================================================
    // 3B. SUMBER TRAFIK PENDAFTAR (DONUT / PIE CHART)
    // =========================================================================
    const defaultTrafficCategories = ['Portal PMB', 'Admin PMB', 'Import Excel', 'Sumber Lainnya'];
    const sumberTrafikMap = new Map<string, number>();
    defaultTrafficCategories.forEach((cat) => sumberTrafikMap.set(cat, 0));

    for (const p of pendaftarList) {
      const src = (p.sumberTrafik || '').toLowerCase();
      if (src.includes('admin') || src.includes('didaftarkan')) {
        sumberTrafikMap.set('Admin PMB', (sumberTrafikMap.get('Admin PMB') || 0) + 1);
      } else if (src.includes('excel') || src.includes('import')) {
        sumberTrafikMap.set('Import Excel', (sumberTrafikMap.get('Import Excel') || 0) + 1);
      } else if (src.includes('portal') || src.includes('mandiri') || src.includes('web') || !src) {
        sumberTrafikMap.set('Portal PMB', (sumberTrafikMap.get('Portal PMB') || 0) + 1);
      } else {
        sumberTrafikMap.set('Sumber Lainnya', (sumberTrafikMap.get('Sumber Lainnya') || 0) + 1);
      }
    }

    const totalPendaftarUntukTrafik = totalPendaftar > 0 ? totalPendaftar : pendaftarList.length;
    const sumberTrafikData = Array.from(sumberTrafikMap.entries()).map(([sumber, total]) => ({
      sumber,
      total,
      persentase: calcPct(total, totalPendaftarUntukTrafik),
    }));

    const sumberTrafik = {
      labels: sumberTrafikData.map((d) => d.sumber),
      data: sumberTrafikData.map((d) => d.total),
      detail: sumberTrafikData,
      totalPendaftar: totalPendaftarUntukTrafik,
    };

    // =========================================================================
    // 3C. STATISTIK PENDAFTARAN TIME-SERIES (LINE CHART: BULANAN / HARIAN)
    // =========================================================================
    const frekuensi = filter.frekuensi === 'harian' ? 'harian' : 'bulanan';
    const jenisPerhitungan = filter.jenisPerhitungan === 'kumulatif' ? 'kumulatif' : 'reguler';
    const targetTahun = filter.tahun ? Number(filter.tahun) : new Date().getFullYear();

    // Hitung Target Penerimaan dari Pembukaan Jalur / Target Default
    let targetPenerimaan = 0;
    if (selectedPeriodeId || effectiveProdiIds.length > 0) {
      const kuotaWhere: any = {};
      if (selectedPeriodeId) kuotaWhere.periodeId = selectedPeriodeId;
      if (effectiveProdiIds.length > 0) kuotaWhere.programStudiId = { in: effectiveProdiIds };

      const kuotaSum = await prisma.pembukaanJalur.aggregate({
        where: kuotaWhere,
        _sum: { kuota: true },
      });
      targetPenerimaan = kuotaSum._sum.kuota || 0;
    }
    if (targetPenerimaan <= 0) {
      targetPenerimaan = 1500; // Target penerimaan default konfigurasi PMB
    }

    let categories: string[] = [];
    let daftarLine: number[] = [];
    let aktifLine: number[] = [];
    let finalisasiLine: number[] = [];
    let lulusLine: number[] = [];
    let daftarUlangLine: number[] = [];

    if (frekuensi === 'harian') {
      // 31 Hari dalam bulan
      const daysCount = 31;
      categories = Array.from({ length: daysCount }, (_, i) => `Tgl ${i + 1}`);
      daftarLine = Array(daysCount).fill(0);
      aktifLine = Array(daysCount).fill(0);
      finalisasiLine = Array(daysCount).fill(0);
      lulusLine = Array(daysCount).fill(0);
      daftarUlangLine = Array(daysCount).fill(0);

      const targetBulan = new Date().getMonth(); // Bulan berjalan

      for (const p of pendaftarList) {
        if (p.createdAt) {
          const d = new Date(p.createdAt);
          if (d.getFullYear() === targetTahun && d.getMonth() === targetBulan) {
            const dayIdx = Math.min(daysCount - 1, d.getDate() - 1);
            daftarLine[dayIdx]++;
            if (isPendaftarAktif(p)) aktifLine[dayIdx]++;
          }
        }
        if (p.tanggalFinalisasi) {
          const d = new Date(p.tanggalFinalisasi);
          if (d.getFullYear() === targetTahun && d.getMonth() === targetBulan) {
            finalisasiLine[Math.min(daysCount - 1, d.getDate() - 1)]++;
          }
        }
        if (p.tanggalLulus) {
          const d = new Date(p.tanggalLulus);
          if (d.getFullYear() === targetTahun && d.getMonth() === targetBulan) {
            lulusLine[Math.min(daysCount - 1, d.getDate() - 1)]++;
          }
        }
        if (p.tanggalDaftarUlang) {
          const d = new Date(p.tanggalDaftarUlang);
          if (d.getFullYear() === targetTahun && d.getMonth() === targetBulan) {
            daftarUlangLine[Math.min(daysCount - 1, d.getDate() - 1)]++;
          }
        }
      }
    } else {
      // 12 Bulan (Januari - Desember)
      const namaBulan = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
      ];
      categories = namaBulan;
      daftarLine = Array(12).fill(0);
      aktifLine = Array(12).fill(0);
      finalisasiLine = Array(12).fill(0);
      lulusLine = Array(12).fill(0);
      daftarUlangLine = Array(12).fill(0);

      for (const p of pendaftarList) {
        if (p.createdAt) {
          const d = new Date(p.createdAt);
          if (d.getFullYear() === targetTahun) {
            const m = d.getMonth();
            daftarLine[m]++;
            if (isPendaftarAktif(p)) aktifLine[m]++;
          }
        }
        if (p.tanggalFinalisasi) {
          const d = new Date(p.tanggalFinalisasi);
          if (d.getFullYear() === targetTahun) finalisasiLine[d.getMonth()]++;
        }
        if (p.tanggalLulus) {
          const d = new Date(p.tanggalLulus);
          if (d.getFullYear() === targetTahun) lulusLine[d.getMonth()]++;
        }
        if (p.tanggalDaftarUlang) {
          const d = new Date(p.tanggalDaftarUlang);
          if (d.getFullYear() === targetTahun) daftarUlangLine[d.getMonth()]++;
        }
      }
    }

    // Jika mode kumulatif, lakukan akumulasi berjalan
    if (jenisPerhitungan === 'kumulatif') {
      const accumulate = (arr: number[]) => {
        let running = 0;
        return arr.map((v) => {
          running += v;
          return running;
        });
      };
      daftarLine = accumulate(daftarLine);
      aktifLine = accumulate(aktifLine);
      finalisasiLine = accumulate(finalisasiLine);
      lulusLine = accumulate(lulusLine);
      daftarUlangLine = accumulate(daftarUlangLine);
    }

    const statistikWaktu = {
      frekuensi,
      jenisPerhitungan,
      tahun: targetTahun,
      targetPenerimaan,
      categories,
      series: [
        { name: 'Daftar', data: daftarLine, color: '#3b82f6' },
        { name: 'Aktif', data: aktifLine, color: '#10b981' },
        { name: 'Finalisasi', data: finalisasiLine, color: '#f59e0b' },
        { name: 'Lulus', data: lulusLine, color: '#8b5cf6' },
        { name: 'Daftar Ulang', data: daftarUlangLine, color: '#06b6d4' },
        {
          name: 'Target Penerimaan',
          type: 'line',
          dashStyle: 'Dash',
          color: '#ef4444',
          data: Array(categories.length).fill(targetPenerimaan),
        },
      ],
    };

    // =========================================================================
    // 3D. INFORMASI PENDAFTAR (5 PIE / DONUT CHARTS)
    // =========================================================================
    // 1. Jalur Pendaftaran
    const jalurMap = new Map<string, number>();
    for (const p of pendaftarList) {
      const j = p.jalurPendaftaran?.nama || 'Lainnya';
      jalurMap.set(j, (jalurMap.get(j) || 0) + 1);
    }
    const jalurData = Array.from(jalurMap.entries())
      .map(([jalur, total]) => ({
        jalur,
        total,
        persentase: calcPct(total, totalPendaftarUntukTrafik),
      }))
      .sort((a, b) => b.total - a.total);

    const jalurPendaftaran = {
      labels: jalurData.map((d) => d.jalur),
      data: jalurData.map((d) => d.total),
      detail: jalurData,
    };

    // 2. Jenis Pendaftaran (Peserta Didik Baru, RPL Perolehan SKS, RPL Transfer SKS, Pindahan, Alih Jenjang)
    const jenisPendaftaranMap = new Map<string, number>();
    for (const p of pendaftarList) {
      const jNama = (p.jalurPendaftaran?.nama || '').toLowerCase();
      let jenis = 'Peserta Didik Baru';
      if (jNama.includes('perolehan')) jenis = 'RPL Perolehan SKS';
      else if (jNama.includes('transfer')) jenis = 'RPL Transfer SKS';
      else if (jNama.includes('rpl')) jenis = 'RPL Perolehan SKS';
      else if (jNama.includes('pindahan')) jenis = 'Pindahan';
      else if (jNama.includes('alih') || jNama.includes('ekstensi')) jenis = 'Alih Jenjang';
      jenisPendaftaranMap.set(jenis, (jenisPendaftaranMap.get(jenis) || 0) + 1);
    }
    const jenisPendaftaranData = Array.from(jenisPendaftaranMap.entries())
      .map(([jenis, total]) => ({
        jenis,
        total,
        persentase: calcPct(total, totalPendaftarUntukTrafik),
      }))
      .sort((a, b) => b.total - a.total);

    const jenisPendaftaran = {
      labels: jenisPendaftaranData.map((d) => d.jenis),
      data: jenisPendaftaranData.map((d) => d.total),
      detail: jenisPendaftaranData,
    };

    // 3. Sistem Kuliah (Reguler, Karyawan, dll.)
    const sistemMap = new Map<string, number>();
    for (const p of pendaftarList) {
      const s = p.sistemKuliah?.nama || 'Reguler';
      sistemMap.set(s, (sistemMap.get(s) || 0) + 1);
    }
    const sistemData = Array.from(sistemMap.entries())
      .map(([sistem, total]) => ({
        sistem,
        total,
        persentase: calcPct(total, totalPendaftarUntukTrafik),
      }))
      .sort((a, b) => b.total - a.total);

    const sistemKuliah = {
      labels: sistemData.map((d) => d.sistem),
      data: sistemData.map((d) => d.total),
      detail: sistemData,
    };

    // 4. Jenis Kelamin (Laki-laki, Perempuan)
    const jkMap = new Map<string, number>();
    for (const p of pendaftarList) {
      const jk = p.jenisKelamin?.trim() || 'Belum Diisi';
      jkMap.set(jk, (jkMap.get(jk) || 0) + 1);
    }
    const jkData = Array.from(jkMap.entries())
      .map(([jenisKelamin, total]) => ({
        jenisKelamin,
        total,
        persentase: calcPct(total, totalPendaftarUntukTrafik),
      }))
      .sort((a, b) => b.total - a.total);

    const jenisKelamin = {
      labels: jkData.map((d) => d.jenisKelamin),
      data: jkData.map((d) => d.total),
      detail: jkData,
    };

    // 5. Tahun Lulus (Tahun kelulusan sekolah/kampus sebelumnya)
    const tahunLulusMap = new Map<string, number>();
    for (const p of pendaftarList) {
      const thn = p.tahunLulus ? String(p.tahunLulus) : 'Belum Diisi';
      tahunLulusMap.set(thn, (tahunLulusMap.get(thn) || 0) + 1);
    }
    const tahunLulusData = Array.from(tahunLulusMap.entries())
      .map(([tahun, total]) => ({
        tahun,
        total,
        persentase: calcPct(total, totalPendaftarUntukTrafik),
      }))
      .sort((a, b) => {
        if (a.tahun === 'Belum Diisi') return 1;
        if (b.tahun === 'Belum Diisi') return -1;
        return Number(b.tahun) - Number(a.tahun);
      });

    const tahunLulus = {
      labels: tahunLulusData.map((d) => d.tahun),
      data: tahunLulusData.map((d) => d.total),
      detail: tahunLulusData,
    };

    // =========================================================================
    // 3E. PROGRAM STUDI & PERGURUAN TINGGI ASAL (HORIZONTAL BAR CHART)
    // Khusus pendaftar yang memiliki riwayat pendidikan tinggi sebelumnya
    // =========================================================================
    const pendaftarKuliahSebelumnya = pendaftarList.filter(
      (p) => p.asalPerguruanTinggi && p.asalPerguruanTinggi.trim() !== ''
    );

    const ptCountMap: Record<string, number> = {};
    const prodiAsalCountMap: Record<string, number> = {};

    for (const p of pendaftarKuliahSebelumnya) {
      const pt = p.asalPerguruanTinggi!.trim();
      ptCountMap[pt] = (ptCountMap[pt] || 0) + 1;

      const jur = p.jurusanPendidikan?.trim() || 'Umum';
      prodiAsalCountMap[jur] = (prodiAsalCountMap[jur] || 0) + 1;
    }

    const ptSorted = Object.entries(ptCountMap)
      .map(([nama, total]) => ({
        nama,
        total,
        persentase: calcPct(total, pendaftarKuliahSebelumnya.length),
      }))
      .sort((a, b) => b.total - a.total);

    const prodiAsalSorted = Object.entries(prodiAsalCountMap)
      .map(([nama, total]) => ({
        nama,
        total,
        persentase: calcPct(total, pendaftarKuliahSebelumnya.length),
      }))
      .sort((a, b) => b.total - a.total);

    const perguruanTinggiAsal = {
      totalPendaftarPendidikanTinggi: pendaftarKuliahSebelumnya.length,
      labels: ptSorted.map((d) => d.nama),
      data: ptSorted.map((d) => d.total),
      detail: ptSorted,
    };

    const programStudiAsal = {
      totalPendaftarPendidikanTinggi: pendaftarKuliahSebelumnya.length,
      labels: prodiAsalSorted.map((d) => d.nama),
      data: prodiAsalSorted.map((d) => d.total),
      detail: prodiAsalSorted,
    };

    // =========================================================================
    // 3F. ASAL TEMPAT KERJA PENDAFTAR (HORIZONTAL BAR CHART)
    // =========================================================================
    const normalizeCompanyName = (name: string): string => {
      const cleaned = name.trim();
      const lower = cleaned.toLowerCase();
      if (lower.includes('sevima')) return 'SEVIMA';
      if (lower.includes('paragon')) return 'PT Paragon Technology and Innovation';
      if (lower.includes('bca') || lower.includes('central asia')) return 'Bank Central Asia (BCA)';
      if (lower.includes('telkom')) return 'Telkom Indonesia';
      if (lower.includes('astra')) return 'PT Astra International Tbk';
      if (lower.includes('wika') || lower.includes('wijaya karya')) return 'PT Wijaya Karya (WIKA)';
      if (lower.includes('tokopedia')) return 'Tokopedia';
      if (lower.includes('shopee')) return 'Shopee';
      if (lower.includes('mandiri')) return 'Bank Mandiri (Persero) Tbk';
      return cleaned;
    };

    const perusMap: Record<string, { total: number; prodis: Record<string, number> }> = {};
    const prodiKerjaMap: Record<string, number> = {};
    let totalPendaftarBekerja = 0;

    for (const p of pendaftarList) {
      if (p.namaPerusahaan && p.namaPerusahaan.trim() !== '') {
        totalPendaftarBekerja++;
        const norm = normalizeCompanyName(p.namaPerusahaan);
        if (!perusMap[norm]) {
          perusMap[norm] = { total: 0, prodis: {} };
        }
        perusMap[norm].total += 1;

        const prodiNama = p.programStudi ? `${p.programStudi.jenjang} - ${p.programStudi.namaProdi}` : 'Umum';
        perusMap[norm].prodis[prodiNama] = (perusMap[norm].prodis[prodiNama] || 0) + 1;
        prodiKerjaMap[prodiNama] = (prodiKerjaMap[prodiNama] || 0) + 1;
      }
    }

    const perusSorted = Object.entries(perusMap)
      .map(([namaPerusahaan, info]) => ({
        namaPerusahaan,
        total: info.total,
        persentase: calcPct(info.total, totalPendaftarUntukTrafik),
      }))
      .sort((a, b) => b.total - a.total);

    const prodiKerjaSorted = Object.entries(prodiKerjaMap)
      .map(([namaProdi, total]) => ({
        namaProdi,
        total,
        persentase: calcPct(total, totalPendaftarBekerja),
      }))
      .sort((a, b) => b.total - a.total);

    const persentaseBekerja = calcPct(totalPendaftarBekerja, totalPendaftarUntukTrafik);

    let headlineInsight = '';
    if (perusSorted.length > 0) {
      const topPerus = perusSorted[0];
      const prodiKeys = Object.entries(perusMap[topPerus.namaPerusahaan]?.prodis || {}).sort((a, b) => b[1] - a[1]);
      const topProdi = prodiKeys[0] ? prodiKeys[0][0] : 'Program Studi Unggulan';
      headlineInsight = `${topPerus.namaPerusahaan} menyumbang ${topPerus.total} pendaftar, mayoritas memilih ${topProdi}.`;
    }

    const asalTempatKerja = {
      totalPendaftarBekerja,
      persentaseBekerja,
      persentaseBekerjaFormatted: `${persentaseBekerja}% pendaftar mengisi asal perusahaan`,
      headlineInsight,
      perusahaan: {
        labels: perusSorted.map((d) => d.namaPerusahaan),
        data: perusSorted.map((d) => d.total),
        detail: perusSorted,
      },
      prodi: {
        labels: prodiKerjaSorted.map((d) => d.namaProdi),
        data: prodiKerjaSorted.map((d) => d.total),
        detail: prodiKerjaSorted,
      },
      perusahaanPopuler: perusSorted,
      catatan: 'Nama perusahaan yang ditulis berbeda (misal: "PT Maju Jaya" dan "maju jaya") sudah digabung secara otomatis.',
    };

    // Metadata Active Filters untuk Pill Badges di Front-End
    const [selectedProdis, selectedJalurs, selectedSistems, selectedGelombangs] = await Promise.all([
      effectiveProdiIds.length > 0
        ? prisma.programStudi.findMany({ where: { id: { in: effectiveProdiIds } }, select: { id: true, namaProdi: true, jenjang: true } })
        : [],
      effectiveJalurIds.length > 0
        ? prisma.jalurPendaftaran.findMany({ where: { id: { in: effectiveJalurIds } }, select: { id: true, nama: true } })
        : [],
      sistemIds.length > 0
        ? prisma.sistemKuliah.findMany({ where: { id: { in: sistemIds } }, select: { id: true, nama: true } })
        : [],
      gelombangIds.length > 0
        ? prisma.gelombang.findMany({ where: { id: { in: gelombangIds } }, select: { id: true, nama: true } })
        : [],
    ]);

    const activeFilters = {
      periode: selectedPeriode ? { id: selectedPeriode.id, kode: selectedPeriode.kode, nama: selectedPeriode.nama } : null,
      unit: {
        count: effectiveProdiIds.length,
        label: effectiveProdiIds.length > 0 ? `${effectiveProdiIds.length} unit dipilih` : '-- Semua Unit / Program Studi --',
        badgeText: effectiveProdiIds.length > 0 ? `Unit: ${selectedProdis.map((p) => `${p.jenjang} - ${p.namaProdi}`).join(', ')}` : null,
        ids: effectiveProdiIds,
        items: selectedProdis,
      },
      jalur: {
        count: effectiveJalurIds.length,
        label: effectiveJalurIds.length > 0 ? `${effectiveJalurIds.length} jalur dipilih` : '-- Semua Jalur Pendaftaran --',
        badgeText: effectiveJalurIds.length > 0 ? `Jalur: ${selectedJalurs.map((j) => j.nama).join(', ')}` : null,
        ids: effectiveJalurIds,
        items: selectedJalurs,
      },
      sistemKuliah: {
        count: sistemIds.length,
        label: sistemIds.length > 0 ? `${sistemIds.length} sistem kuliah dipilih` : '-- Semua Sistem Kuliah --',
        ids: sistemIds,
        items: selectedSistems,
      },
      gelombang: {
        count: gelombangIds.length,
        label: gelombangIds.length > 0 ? `${gelombangIds.length} gelombang dipilih` : '-- Semua Gelombang --',
        ids: gelombangIds,
        items: selectedGelombangs,
      },
      jenisPendaftaran: filter.jenisPendaftaran || [],
      jenjang: filter.jenjang || [],
    };

    return {
      filter: {
        selectedPeriode,
        periodeAktif,
        daftarPeriode,
        activeFilters,
      },
      summary,
      charts: {
        frekuensiBulanan: statistikWaktu,
        statistikWaktu,
        sumberTrafik,
        funnelTahapan,
        funnelBarChart,
        informasiPendaftar: {
          jalurPendaftaran,
          jenisPendaftaran,
          sistemKuliah,
          jenisKelamin,
          tahunLulus,
        },
        jalurPendaftaran,
        jenisPendaftaran,
        sistemKuliah,
        jenisKelamin,
        tahunLulus,
        perguruanTinggiAsal,
        programStudiAsal,
        asalTempatKerja,
      },
    };
  }

  /**
   * Mengambil struktur hierarki Unit / Program Studi (Universitas -> Fakultas -> Program Studi)
   */
  async getUnitTree(search?: string, format?: string) {
    const where: any = {};
    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { namaProdi: { contains: q, mode: 'insensitive' } },
        { fakultas: { contains: q, mode: 'insensitive' } },
        { jenjang: { contains: q, mode: 'insensitive' } },
      ];
    }

    const prodis = await prisma.programStudi.findMany({
      where,
      orderBy: [{ fakultas: 'asc' }, { jenjang: 'asc' }, { namaProdi: 'asc' }],
    });

    const urutanFakultas = [
      'Fakultas Keguruan dan Ilmu Pendidikan',
      'Fakultas Hukum',
      'Fakultas Ekonomi dan Bisnis',
      'Fakultas Agama Islam',
      'Fakultas Teknik dan Sains',
      'Sekolah Pascasarjana',
      'Fakultas Ilmu Kesehatan',
    ];

    const fakultasMap = new Map<string, any[]>();
    for (const p of prodis) {
      const fak = p.fakultas || 'Universitas Ibn Khaldun';
      if (!fakultasMap.has(fak)) {
        fakultasMap.set(fak, []);
      }
      fakultasMap.get(fak)!.push({
        id: p.id,
        key: p.id,
        value: p.id,
        namaProdi: p.namaProdi,
        jenjang: p.jenjang,
        label: `${p.jenjang} - ${p.namaProdi}`,
        akreditasi: p.akreditasi,
        fakultas: fak,
      });
    }

    // Urutkan fakultas sesuai urutan resmi UIKA pada screenshot UI
    const sortedEntries = Array.from(fakultasMap.entries()).sort((a, b) => {
      const idxA = urutanFakultas.indexOf(a[0]);
      const idxB = urutanFakultas.indexOf(b[0]);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a[0].localeCompare(b[0]);
    });

    const fakultasList = sortedEntries.map(([fakultas, prodiList], idx) => ({
      id: `fak-${idx + 1}`,
      key: `fak-${idx + 1}`,
      value: `fak-${idx + 1}`,
      nama: fakultas,
      label: fakultas,
      fakultas,
      totalProdi: prodiList.length,
      prodi: prodiList,
      children: prodiList,
    }));

    // Jika parameter ?format=root atau ?tree=true dikirim oleh FE, bungkus dalam root 'Universitas Ibn Khaldun'
    if (format === 'root' || format === 'tree') {
      return [
        {
          id: 'uika-root',
          key: 'uika-root',
          value: 'uika-root',
          nama: 'Universitas Ibn Khaldun',
          label: 'Universitas Ibn Khaldun',
          institusi: 'Universitas Ibn Khaldun',
          totalFakultas: fakultasList.length,
          totalProdi: prodis.length,
          children: fakultasList,
        },
      ];
    }

    return fakultasList;
  }

  /**
   * Mengambil opsi filter untuk Modal "Filter Lanjutan"
   */
  async getFilterOptions() {
    const [periodes, jalurs, gelombangs, sistems, prodis] = await Promise.all([
      prisma.periode.findMany({ orderBy: { kode: 'desc' } }),
      prisma.jalurPendaftaran.findMany({ orderBy: { id: 'asc' } }),
      prisma.gelombang.findMany({ orderBy: { id: 'asc' } }),
      prisma.sistemKuliah.findMany({ orderBy: { id: 'asc' } }),
      prisma.programStudi.findMany({ orderBy: [{ fakultas: 'asc' }, { jenjang: 'asc' }] }),
    ]);

    const jenisPendaftaranOptions = [
      { value: 'Peserta Didik Baru', label: 'Peserta Didik Baru' },
      { value: 'RPL Perolehan SKS', label: 'RPL Perolehan SKS' },
      { value: 'RPL Transfer SKS', label: 'RPL Transfer SKS' },
      { value: 'Pindahan', label: 'Pindahan' },
      { value: 'Alih Jenjang', label: 'Alih Jenjang' },
    ];

    const jenjangList = Array.from(new Set(prodis.map((p) => p.jenjang))).filter(Boolean);

    return {
      periode: periodes.map((p) => ({ id: p.id, kode: p.kode, nama: p.nama, isActive: p.isActive })),
      gelombang: gelombangs.map((g) => ({ id: g.id, nama: g.nama })),
      jalurPendaftaran: jalurs.map((j) => ({ id: j.id, nama: j.nama })),
      jenisPendaftaran: jenisPendaftaranOptions,
      sistemKuliah: sistems.map((s) => ({ id: s.id, nama: s.nama })),
      jenjang: jenjangList.map((j) => ({ value: j, label: j })),
    };
  }

  /**
   * Ringkasan 4 Kartu KPI Utama dengan Sub-Badges
   */
  async getSummaryData(filter: GlobalDashboardFilter = {}) {
    const data = await this.getChartsData(filter);
    return {
      filter: data.filter,
      summary: data.summary,
    };
  }

  // =========================================================================
  // TAB 3: FUNNEL PENDAFTARAN TREE (Universitas -> Fakultas -> Prodi)
  // =========================================================================
  async getFunnelPendaftaranTree(filter: GlobalDashboardFilter = {}) {
    const daftarPeriode = await prisma.periode.findMany({ orderBy: { kode: 'desc' } });
    let selectedPeriode = null;
    if (filter.periodeId) {
      selectedPeriode = daftarPeriode.find((p) => p.id === Number(filter.periodeId)) || null;
    } else if (filter.kodePeriode) {
      selectedPeriode = daftarPeriode.find((p) => p.kode === String(filter.kodePeriode)) || null;
    } else {
      selectedPeriode = daftarPeriode.find((p) => p.isActive) || daftarPeriode[0] || null;
    }

    let periodeSebelumnya: any = null;
    if (selectedPeriode) {
      const idx = daftarPeriode.findIndex((p) => p.id === selectedPeriode!.id);
      if (idx !== -1 && idx + 1 < daftarPeriode.length) {
        periodeSebelumnya = daftarPeriode[idx + 1];
      }
    }

    const { where: whereNow, effectiveProdiIds } = await this.buildWhereClause({
      ...filter,
      periodeId: selectedPeriode?.id,
    });

    const prodiWhere: any = {};
    if (effectiveProdiIds.length > 0) {
      prodiWhere.id = { in: effectiveProdiIds };
    }

    const allProdi = await prisma.programStudi.findMany({
      where: prodiWhere,
      orderBy: [{ fakultas: 'asc' }, { jenjang: 'asc' }, { namaProdi: 'asc' }],
    });

    const pendaftarNow = await prisma.pendaftar.findMany({
      where: whereNow,
      include: {
        programStudi: true,
        prodiDiterima: true,
        user: true,
      },
    });

    let pendaftarPrev: any[] = [];
    if (periodeSebelumnya) {
      const { where: wherePrev } = await this.buildWhereClause({
        ...filter,
        periodeId: periodeSebelumnya.id,
      });
      pendaftarPrev = await prisma.pendaftar.findMany({
        where: wherePrev,
        select: {
          id: true,
          programStudiId: true,
          prodiDiterimaId: true,
          isDaftarUlang: true,
          nim: true,
          isDiterima: true,
        },
      });
    }

    const topLimit = Number(filter.topKotaLimit) || 3;
    const computeTopKota = (list: any[]) => {
      const counts: Record<string, number> = {};
      for (const item of list) {
        const k = item.kabupatenKota?.trim();
        if (k && k !== '' && k.toLowerCase() !== 'lain-lain') {
          counts[k] = (counts[k] || 0) + 1;
        }
      }
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, topLimit)
        .map(([kota, total]) => ({ kota, total }));
    };

    const calcGrowth = (now: number, prev: number) => {
      if (prev === 0) return now > 0 ? 100 : 0;
      return Math.round(((now - prev) / prev) * 1000) / 10;
    };

    const fakultasMap = new Map<string, typeof allProdi>();
    for (const pr of allProdi) {
      const fak = pr.fakultas || 'Universitas Ibn Khaldun (UIKA)';
      if (!fakultasMap.has(fak)) fakultasMap.set(fak, []);
      fakultasMap.get(fak)!.push(pr);
    }

    const fakultasNodes: any[] = [];
    let univPeminat = 0, univPendaftar = 0, univLulus = 0, univDaftarUlang = 0, univMahasiswa = 0, univDaftarUlangPrev = 0;

    for (const [fakNama, prodiList] of fakultasMap.entries()) {
      let fakPeminat = 0, fakPendaftar = 0, fakLulus = 0, fakDaftarUlang = 0, fakMahasiswa = 0, fakDaftarUlangPrev = 0;
      const fakPendaftarList: any[] = [];

      const prodiNodes = prodiList.map((pr) => {
        const pList = pendaftarNow.filter((p) => p.programStudiId === pr.id || p.pilihanProdi2Id === pr.id || p.pilihanProdi3Id === pr.id);
        fakPendaftarList.push(...pList);

        const peminat = pList.length;
        const pendaftar = pList.filter((p) => p.user?.isActive || p.isTagihanFormulir || p.noPendaftaran).length;
        const lulus = pList.filter((p) => (p.isDiterima || p.statusKelulusan === 'LULUS') && (p.prodiDiterimaId === pr.id || (!p.prodiDiterimaId && p.programStudiId === pr.id))).length;
        const daftarUlang = pList.filter((p) => p.isDaftarUlang && (p.prodiDiterimaId === pr.id || (!p.prodiDiterimaId && p.programStudiId === pr.id))).length;
        const mahasiswa = pList.filter((p) => p.nim && (p.prodiDiterimaId === pr.id || (!p.prodiDiterimaId && p.programStudiId === pr.id))).length;

        const prevDu = pendaftarPrev.filter((p) => p.isDaftarUlang && (p.prodiDiterimaId === pr.id || (!p.prodiDiterimaId && p.programStudiId === pr.id))).length;

        fakPeminat += peminat;
        fakPendaftar += pendaftar;
        fakLulus += lulus;
        fakDaftarUlang += daftarUlang;
        fakMahasiswa += mahasiswa;
        fakDaftarUlangPrev += prevDu;

        return {
          id: pr.id,
          unitKerja: `${pr.jenjang} - ${pr.namaProdi}`,
          level: 'prodi',
          peminat,
          pendaftar,
          lulus,
          daftarUlang,
          mahasiswa,
          daftarUlangPeriodeLalu: prevDu,
          pertumbuhanPersen: calcGrowth(daftarUlang, prevDu),
          topKota: computeTopKota(pList),
        };
      });

      univPeminat += fakPeminat;
      univPendaftar += fakPendaftar;
      univLulus += fakLulus;
      univDaftarUlang += fakDaftarUlang;
      univMahasiswa += fakMahasiswa;
      univDaftarUlangPrev += fakDaftarUlangPrev;

      fakultasNodes.push({
        id: `fak-${fakNama.toLowerCase().replace(/\s+/g, '-')}`,
        unitKerja: fakNama,
        level: 'fakultas',
        peminat: fakPeminat,
        pendaftar: fakPendaftar,
        lulus: fakLulus,
        daftarUlang: fakDaftarUlang,
        mahasiswa: fakMahasiswa,
        daftarUlangPeriodeLalu: fakDaftarUlangPrev,
        pertumbuhanPersen: calcGrowth(fakDaftarUlang, fakDaftarUlangPrev),
        topKota: computeTopKota(fakPendaftarList),
        children: prodiNodes,
      });
    }

    const tree = [
      {
        id: 'universitas-ibn-khaldun',
        unitKerja: 'Universitas Ibn Khaldun',
        level: 'universitas',
        peminat: univPeminat,
        pendaftar: univPendaftar,
        lulus: univLulus,
        daftarUlang: univDaftarUlang,
        mahasiswa: univMahasiswa,
        daftarUlangPeriodeLalu: univDaftarUlangPrev,
        pertumbuhanPersen: calcGrowth(univDaftarUlang, univDaftarUlangPrev),
        topKota: computeTopKota(pendaftarNow),
        children: fakultasNodes,
      },
    ];

    return {
      periode: selectedPeriode ? { id: selectedPeriode.id, kode: selectedPeriode.kode, nama: selectedPeriode.nama } : null,
      periodeSebelumnya: periodeSebelumnya ? { id: periodeSebelumnya.id, kode: periodeSebelumnya.kode, nama: periodeSebelumnya.nama } : null,
      tree,
    };
  }

  // =========================================================================
  // TAB 4: FUNNEL BULANAN TREE (Jan - Des per Fakultas & Prodi)
  // =========================================================================
  async getFunnelBulananTree(filter: GlobalDashboardFilter = {}) {
    const targetTahun = filter.tahun ? Number(filter.tahun) : new Date().getFullYear();
    const namaBulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    const { where, effectiveProdiIds } = await this.buildWhereClause(filter);

    const prodiWhere: any = {};
    if (effectiveProdiIds.length > 0) prodiWhere.id = { in: effectiveProdiIds };

    const [allProdi, pendaftarList] = await Promise.all([
      prisma.programStudi.findMany({
        where: prodiWhere,
        orderBy: [{ fakultas: 'asc' }, { jenjang: 'asc' }, { namaProdi: 'asc' }],
      }),
      prisma.pendaftar.findMany({
        where,
        select: {
          id: true,
          programStudiId: true,
          pilihanProdi2Id: true,
          pilihanProdi3Id: true,
          createdAt: true,
        },
      }),
    ]);

    const fakultasMap = new Map<string, typeof allProdi>();
    for (const pr of allProdi) {
      const fak = pr.fakultas || 'Universitas Ibn Khaldun (UIKA)';
      if (!fakultasMap.has(fak)) fakultasMap.set(fak, []);
      fakultasMap.get(fak)!.push(pr);
    }

    const univMonthly = Array(12).fill(0);
    const fakultasNodes: any[] = [];

    for (const [fakNama, prodiList] of fakultasMap.entries()) {
      const fakMonthly = Array(12).fill(0);

      const prodiNodes = prodiList.map((pr) => {
        const prMonthly = Array(12).fill(0);
        const myPendaftar = pendaftarList.filter(
          (p) => p.programStudiId === pr.id || p.pilihanProdi2Id === pr.id || p.pilihanProdi3Id === pr.id
        );

        for (const p of myPendaftar) {
          if (p.createdAt) {
            const d = new Date(p.createdAt);
            if (d.getFullYear() === targetTahun) {
              prMonthly[d.getMonth()]++;
            }
          }
        }

        for (let i = 0; i < 12; i++) {
          fakMonthly[i] += prMonthly[i];
        }

        const monthlyObj: Record<string, number> = {};
        namaBulan.forEach((b, idx) => (monthlyObj[b] = prMonthly[idx]));

        return {
          id: pr.id,
          unitKerja: `${pr.jenjang} - ${pr.namaProdi}`,
          level: 'prodi',
          total: prMonthly.reduce((a, b) => a + b, 0),
          bulanan: monthlyObj,
        };
      });

      for (let i = 0; i < 12; i++) {
        univMonthly[i] += fakMonthly[i];
      }

      const fakMonthlyObj: Record<string, number> = {};
      namaBulan.forEach((b, idx) => (fakMonthlyObj[b] = fakMonthly[idx]));

      fakultasNodes.push({
        id: `fak-${fakNama.toLowerCase().replace(/\s+/g, '-')}`,
        unitKerja: fakNama,
        level: 'fakultas',
        total: fakMonthly.reduce((a, b) => a + b, 0),
        bulanan: fakMonthlyObj,
        children: prodiNodes,
      });
    }

    const univMonthlyObj: Record<string, number> = {};
    namaBulan.forEach((b, idx) => (univMonthlyObj[b] = univMonthly[idx]));

    const tree = [
      {
        id: 'universitas-ibn-khaldun',
        unitKerja: 'Universitas Ibn Khaldun',
        level: 'universitas',
        total: univMonthly.reduce((a, b) => a + b, 0),
        bulanan: univMonthlyObj,
        children: fakultasNodes,
      },
    ];

    return {
      tahun: targetTahun,
      namaBulan,
      tree,
    };
  }

  // =========================================================================
  // TAB 5: MAHASISWA BARU KOMPARASI TAHUNAN (2023 - 2027)
  // =========================================================================
  async getMahasiswaKomparasiTahunan(filter: GlobalDashboardFilter = {}) {
    const tahunList = [2023, 2024, 2025, 2026, 2027];
    const { where, effectiveProdiIds } = await this.buildWhereClause(filter);

    const prodiWhere: any = {};
    if (effectiveProdiIds.length > 0) prodiWhere.id = { in: effectiveProdiIds };

    const [allProdi, pendaftarList] = await Promise.all([
      prisma.programStudi.findMany({
        where: prodiWhere,
        orderBy: [{ fakultas: 'asc' }, { jenjang: 'asc' }, { namaProdi: 'asc' }],
      }),
      prisma.pendaftar.findMany({
        where: {
          ...where,
          isDaftarUlang: true,
        },
        include: {
          periode: true,
        },
      }),
    ]);

    const fakultasMap = new Map<string, typeof allProdi>();
    for (const pr of allProdi) {
      const fak = pr.fakultas || 'Universitas Ibn Khaldun (UIKA)';
      if (!fakultasMap.has(fak)) fakultasMap.set(fak, []);
      fakultasMap.get(fak)!.push(pr);
    }

    const fakultasNodes: any[] = [];
    const univTahunanMap: Record<number, number> = {};
    tahunList.forEach((y) => (univTahunanMap[y] = 0));

    for (const [fakNama, prodiList] of fakultasMap.entries()) {
      const fakTahunanMap: Record<number, number> = {};
      tahunList.forEach((y) => (fakTahunanMap[y] = 0));

      const prodiNodes = prodiList.map((pr) => {
        const prodiTahunan: Record<string, { total: number }> = {};

        for (let i = 0; i < tahunList.length; i++) {
          const y = tahunList[i];
          const yStr = String(y);

          const count = pendaftarList.filter((p) => {
            const matchesProdi = p.prodiDiterimaId === pr.id || (p.programStudiId === pr.id && !p.prodiDiterimaId);
            if (!matchesProdi) return false;
            const pKode = p.periode?.kode || '';
            const pNama = p.periode?.nama || '';
            return pKode.startsWith(yStr) || pNama.includes(yStr);
          }).length;

          fakTahunanMap[y] += count;
          prodiTahunan[yStr] = { total: count };
        }

        return {
          id: pr.id,
          unitKerja: `${pr.jenjang} - ${pr.namaProdi}`,
          level: 'prodi',
          tahunan: prodiTahunan,
        };
      });

      for (const y of tahunList) {
        univTahunanMap[y] += fakTahunanMap[y];
      }

      const fakTahunan: Record<string, { total: number }> = {};
      tahunList.forEach((y) => (fakTahunan[String(y)] = { total: fakTahunanMap[y] }));

      fakultasNodes.push({
        id: `fak-${fakNama.toLowerCase().replace(/\s+/g, '-')}`,
        unitKerja: fakNama,
        level: 'fakultas',
        tahunan: fakTahunan,
        children: prodiNodes,
      });
    }

    const univTahunan: Record<string, { total: number }> = {};
    tahunList.forEach((y) => (univTahunan[String(y)] = { total: univTahunanMap[y] }));

    const tree = [
      {
        id: 'universitas-ibn-khaldun',
        unitKerja: 'Universitas Ibn Khaldun',
        level: 'universitas',
        tahunan: univTahunan,
        children: fakultasNodes,
      },
    ];

    return {
      tahunList,
      tree,
    };
  }

  // =========================================================================
  // TAB 6: WILAYAH (Penerimaan Mahasiswa Baru per Kota/Kabupaten & Peta Sebaran)
  // Mendukung Toggle [Table] & [Maps] serta Filter Sebaran
  // =========================================================================
  async getPenerimaanWilayah(filter: GlobalDashboardFilter = {}) {
    const { where } = await this.buildWhereClause(filter);

    const pendaftarList = await prisma.pendaftar.findMany({
      where,
      select: {
        id: true,
        provinsi: true,
        kabupatenKota: true,
        isFinalisasi: true,
        noPendaftaran: true,
        isDiterima: true,
        isDaftarUlang: true,
        nim: true,
        user: { select: { isActive: true } },
      },
    });

    const KOTA_COORDS: Record<string, { lat: number; lng: number }> = {
      'KOTA BOGOR': { lat: -6.595038, lng: 106.816635 },
      'KABUPATEN BOGOR': { lat: -6.474478, lng: 106.862446 },
      'KOTA PALOPO': { lat: -2.992644, lng: 120.197089 },
      'KABUPATEN LUWU': { lat: -3.275529, lng: 120.301323 },
      'KOTA MAKASSAR': { lat: -5.147665, lng: 119.432732 },
      'KABUPATEN LUWU UTARA': { lat: -2.600000, lng: 120.300000 },
      'KOTA KENDARI': { lat: -3.998460, lng: 122.512604 },
      'KOTA DEPOK': { lat: -6.402484, lng: 106.794243 },
      'KOTA JAKARTA SELATAN': { lat: -6.261493, lng: 106.810600 },
      'KOTA JAKARTA TIMUR': { lat: -6.225014, lng: 106.900447 },
      'KOTA JAKARTA PUSAT': { lat: -6.180511, lng: 106.828384 },
      'KOTA JAKARTA BARAT': { lat: -6.168329, lng: 106.758849 },
      'KOTA JAKARTA UTARA': { lat: -6.138414, lng: 106.864014 },
      'KOTA BEKASI': { lat: -6.238270, lng: 106.975571 },
      'KABUPATEN BEKASI': { lat: -6.250000, lng: 107.166667 },
      'KABUPATEN SUKABUMI': { lat: -6.927703, lng: 106.929886 },
      'KOTA SUKABUMI': { lat: -6.927703, lng: 106.929886 },
      'KOTA BANDUNG': { lat: -6.917464, lng: 107.619125 },
      'KABUPATEN BANDUNG': { lat: -7.025253, lng: 107.519760 },
      'KOTA TANGERANG': { lat: -6.178306, lng: 106.631889 },
      'KOTA TANGERANG SELATAN': { lat: -6.288667, lng: 106.717889 },
      'KABUPATEN TANGERANG': { lat: -6.200000, lng: 106.466667 },
      'KOTA CIREBON': { lat: -6.732044, lng: 108.552315 },
      'KABUPATEN CIANJUR': { lat: -6.820000, lng: 107.140000 },
      'KABUPATEN KARAWANG': { lat: -6.300000, lng: 107.300000 },
      'KOTA SEMARANG': { lat: -6.966667, lng: 110.416664 },
      'KOTA SURABAYA': { lat: -7.257472, lng: 112.752090 },
      'KOTA YOGYAKARTA': { lat: -7.795580, lng: 110.369492 },
      'KOTA MEDAN': { lat: 3.595196, lng: 98.672226 },
      'KOTA PADANG': { lat: -0.947083, lng: 100.417183 },
      'KOTA PALEMBANG': { lat: -2.976074, lng: 104.775431 },
      'KOTA BANDAR LAMPUNG': { lat: -5.450000, lng: 105.266670 },
      'KOTA PEKANBARU': { lat: 0.507068, lng: 101.447777 },
      'KOTA BANJARMASIN': { lat: -3.319384, lng: 114.590752 },
      'KOTA SAMARINDA': { lat: -0.502106, lng: 117.153709 },
      'KOTA DENPASAR': { lat: -8.670458, lng: 115.212629 },
      'KOTA MATARAM': { lat: -8.583333, lng: 116.116667 },
      'KOTA KUPANG': { lat: -10.177200, lng: 123.607033 },
      'KOTA AMBON': { lat: -3.655379, lng: 128.190773 },
      'KOTA JAYAPURA': { lat: -2.591603, lng: 140.669006 },
      'KOTA MANADO': { lat: 1.474830, lng: 124.842079 },
    };

    const PROVINSI_CENTERS: Record<string, { lat: number; lng: number }> = {
      'JAWA BARAT': { lat: -6.914744, lng: 107.609810 },
      'DKI JAKARTA': { lat: -6.208763, lng: 106.845599 },
      'BANTEN': { lat: -6.405817, lng: 106.064018 },
      'JAWA TENGAH': { lat: -7.150975, lng: 110.140259 },
      'JAWA TIMUR': { lat: -7.536064, lng: 112.238402 },
      'DI YOGYAKARTA': { lat: -7.795580, lng: 110.369492 },
      'SULAWESI SELATAN': { lat: -3.668799, lng: 119.974053 },
      'SULAWESI TENGGARA': { lat: -4.144910, lng: 122.174605 },
      'SULAWESI UTARA': { lat: 0.624693, lng: 123.975002 },
      'SULAWESI TENGAH': { lat: -1.430025, lng: 121.445618 },
      'SUMATERA UTARA': { lat: 2.115355, lng: 99.545097 },
      'SUMATERA BARAT': { lat: -0.739940, lng: 100.800005 },
      'SUMATERA SELATAN': { lat: -3.319437, lng: 104.914710 },
      'LAMPUNG': { lat: -4.558585, lng: 105.406808 },
      'RIAU': { lat: 0.293347, lng: 101.706825 },
      'BALI': { lat: -8.409518, lng: 115.188916 },
      'KALIMANTAN TIMUR': { lat: 0.538659, lng: 116.419389 },
    };

    const kotaMap: Record<string, {
      provinsi: string;
      kabupatenKota: string;
      peminat: number;
      pendaftar: number;
      lulus: number;
      daftarUlang: number;
      mahasiswa: number;
    }> = {};

    for (const p of pendaftarList) {
      const prov = p.provinsi?.trim() || 'Jawa Barat';
      const kota = p.kabupatenKota?.trim() || 'Kota Bogor';
      const key = kota.toUpperCase();

      if (!kotaMap[key]) {
        kotaMap[key] = {
          provinsi: prov,
          kabupatenKota: kota,
          peminat: 0,
          pendaftar: 0,
          lulus: 0,
          daftarUlang: 0,
          mahasiswa: 0,
        };
      }

      kotaMap[key].peminat += 1;
      if (p.isFinalisasi || p.noPendaftaran || p.user?.isActive) kotaMap[key].pendaftar += 1;
      if (p.isDiterima) kotaMap[key].lulus += 1;
      if (p.isDaftarUlang) kotaMap[key].daftarUlang += 1;
      if (p.isDaftarUlang && p.nim) kotaMap[key].mahasiswa += 1;
    }

    const kotaList = Object.values(kotaMap);
    const sebaranMetric = (filter.sebaran || 'pendaftar').toLowerCase();

    const getMetricVal = (item: any) => {
      switch (sebaranMetric) {
        case 'peminat': return item.peminat;
        case 'lulus': return item.lulus;
        case 'daftarulang':
        case 'daftar_ulang': return item.daftarUlang;
        case 'mahasiswa': return item.mahasiswa;
        default: return item.pendaftar;
      }
    };

    const sortedKota = [...kotaList].sort((a, b) => getMetricVal(b) - getMetricVal(a));
    const totalNilai = sortedKota.reduce((acc, cur) => acc + getMetricVal(cur), 0);
    const maxVal = sortedKota.length > 0 ? getMetricVal(sortedKota[0]) : 0;

    const top5 = sortedKota
      .filter((k) => k.kabupatenKota.toLowerCase() !== 'lain-lain')
      .slice(0, 5)
      .map((k, idx) => ({
        rank: idx + 1,
        nama: k.kabupatenKota.toUpperCase(),
        total: getMetricVal(k),
      }));

    const getColorForValue = (val: number): string => {
      if (val <= 0) return '#ffffff';
      if (val === 1) return '#c6dbef';
      if (val === 2) return '#9ecae1';
      if (val === 3) return '#6baed6';
      if (val >= 4 && val <= 11) return '#2171b5';
      return '#08306b';
    };

    const legend = [
      { level: 1, label: '1', min: 1, max: 1, color: '#c6dbef' },
      { level: 2, label: '2', min: 2, max: 2, color: '#9ecae1' },
      { level: 3, label: '3', min: 3, max: 3, color: '#6baed6' },
      { level: 4, label: '4 - 11', min: 4, max: Math.min(11, maxVal), color: '#2171b5' },
      { level: 5, label: `12 - ${Math.max(12, maxVal)}`, min: 12, max: Math.max(12, maxVal), color: '#08306b' },
      { level: 0, label: 'Tidak ada', min: 0, max: 0, color: '#ffffff' },
    ];

    const titikWilayah = sortedKota.map((k) => {
      const upper = k.kabupatenKota.toUpperCase().trim();
      const provUpper = k.provinsi.toUpperCase().trim();
      const coords = KOTA_COORDS[upper] || PROVINSI_CENTERS[provUpper] || null;
      const val = getMetricVal(k);

      return {
        id: upper,
        kabupatenKota: k.kabupatenKota,
        provinsi: k.provinsi,
        coordinates: coords ? [coords.lat, coords.lng] : null,
        koordinat: coords,
        total: val,
        nilai: val,
        color: getColorForValue(val),
        isMappable: coords !== null && upper !== 'LAIN-LAIN',
      };
    });

    const terpetakan = titikWilayah.filter((t) => t.isMappable).length;
    const tidakTerpetakan = titikWilayah.filter((t) => !t.isMappable).length;

    const peta = {
      metrik: sebaranMetric,
      labelMetrik: sebaranMetric.charAt(0).toUpperCase() + sebaranMetric.slice(1),
      totalNilai,
      totalKotaTerpetakan: terpetakan,
      totalKotaTidakTerpetakan: tidakTerpetakan,
      top5,
      legend: {
        title: `Sebaran ${sebaranMetric.charAt(0).toUpperCase() + sebaranMetric.slice(1)}`,
        subtitle: `Total ${totalNilai.toLocaleString('id-ID')} dari ${terpetakan} kota / kabupaten.`,
        buckets: legend,
      },
      titikWilayah,
      catatan: `${tidakTerpetakan} kota / kabupaten tidak dapat dipetakan karena belum memiliki batas wilayah maupun koordinat: Lain-lain`,
      attribution: 'Leaflet | Batas wilayah Indonesia: geoBoundaries / BPS (CC BY 3.0 IGO). Batas negara: Natural Earth',
    };

    const rekap = sortedKota.map((item, idx) => ({
      no: idx + 1,
      ...item,
    }));

    const summary = {
      totalKota: rekap.length,
      totalPeminat: rekap.reduce((acc, cur) => acc + cur.peminat, 0),
      totalPendaftar: rekap.reduce((acc, cur) => acc + cur.pendaftar, 0),
      totalLulus: rekap.reduce((acc, cur) => acc + cur.lulus, 0),
      totalDaftarUlang: rekap.reduce((acc, cur) => acc + cur.daftarUlang, 0),
      totalMahasiswa: rekap.reduce((acc, cur) => acc + cur.mahasiswa, 0),
    };

    return {
      table: {
        rekap,
        summary,
      },
      peta,
      rekap,
      summary,
    };
  }

  /**
   * Endpoint Khusus Peta Leaflet Wilayah Sebaran
   */
  async getPetaWilayahSebaran(filter: GlobalDashboardFilter = {}) {
    const data = await this.getPenerimaanWilayah(filter);
    return data.peta;
  }

  // =========================================================================
  // TAB 7: SEKOLAH (Penerimaan Mahasiswa Baru per Nama Sekolah Asal)
  // =========================================================================
  async getPenerimaanSekolah(filter: GlobalDashboardFilter = {}) {
    const { where } = await this.buildWhereClause(filter);

    if (filter.search) {
      where.OR = [
        { asalSekolah: { contains: filter.search, mode: 'insensitive' } },
        { kabupatenKota: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const pendaftarList = await prisma.pendaftar.findMany({
      where,
      select: {
        id: true,
        asalSekolah: true,
        kabupatenKota: true,
        provinsi: true,
        isFinalisasi: true,
        noPendaftaran: true,
        isDiterima: true,
        isDaftarUlang: true,
        nim: true,
        user: { select: { isActive: true } },
      },
    });

    const grouped: Record<string, {
      asalSekolah: string;
      kabupatenKota: string;
      provinsi: string;
      peminat: number;
      pendaftar: number;
      lulus: number;
      daftarUlang: number;
      mahasiswa: number;
    }> = {};

    for (const p of pendaftarList) {
      const sekolah = p.asalSekolah?.trim() || 'SMA Negeri 1 Bogor';
      const kota = p.kabupatenKota?.trim() || 'Kota Bogor';
      const prov = p.provinsi?.trim() || 'Jawa Barat';
      const key = `${sekolah}___${kota}`;

      if (!grouped[key]) {
        grouped[key] = {
          asalSekolah: sekolah,
          kabupatenKota: kota,
          provinsi: prov,
          peminat: 0,
          pendaftar: 0,
          lulus: 0,
          daftarUlang: 0,
          mahasiswa: 0,
        };
      }

      grouped[key].peminat += 1;
      if (p.isFinalisasi || p.noPendaftaran || p.user?.isActive) grouped[key].pendaftar += 1;
      if (p.isDiterima) grouped[key].lulus += 1;
      if (p.isDaftarUlang) grouped[key].daftarUlang += 1;
      if (p.isDaftarUlang && p.nim) grouped[key].mahasiswa += 1;
    }

    const rekap = Object.values(grouped)
      .sort((a, b) => b.peminat - a.peminat)
      .map((item, idx) => ({
        no: idx + 1,
        ...item,
      }));

    const summary = {
      totalSekolah: rekap.length,
      totalPeminat: rekap.reduce((acc, cur) => acc + cur.peminat, 0),
      totalPendaftar: rekap.reduce((acc, cur) => acc + cur.pendaftar, 0),
      totalLulus: rekap.reduce((acc, cur) => acc + cur.lulus, 0),
      totalDaftarUlang: rekap.reduce((acc, cur) => acc + cur.daftarUlang, 0),
      totalMahasiswa: rekap.reduce((acc, cur) => acc + cur.mahasiswa, 0),
    };

    return {
      rekap,
      summary,
    };
  }

  // =========================================================================
  // TAB 8 / SEKSI H: TABEL PERKEMBANGAN ASAL PERGURUAN TINGGI / PRODI
  // Mendukung Toggle [Perguruan Tinggi] vs [Program Studi] & Pagination (Load More)
  // Kolom Wajib: Nama PT/Prodi, Peminat, Pendaftar, Lulus, Daftar Ulang, Mahasiswa
  // =========================================================================
  async getPerguruanTinggi(filter: GlobalDashboardFilter = {}) {
    const { where } = await this.buildWhereClause(filter);

    const pendaftarList = await prisma.pendaftar.findMany({
      where,
      include: {
        programStudi: true,
        prodiDiterima: true,
        user: true,
      },
    });

    const isModeProdi = filter.mode === 'prodi';
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 10));

    if (isModeProdi) {
      const grouped: Record<string, {
        nama: string;
        programStudi: string;
        peminat: number;
        pendaftar: number;
        lulus: number;
        daftarUlang: number;
        mahasiswa: number;
      }> = {};

      for (const p of pendaftarList) {
        const prodiNama = p.programStudi ? `${p.programStudi.jenjang} - ${p.programStudi.namaProdi}` : 'Belum Memilih Prodi';

        if (!grouped[prodiNama]) {
          grouped[prodiNama] = {
            nama: prodiNama,
            programStudi: prodiNama,
            peminat: 0,
            pendaftar: 0,
            lulus: 0,
            daftarUlang: 0,
            mahasiswa: 0,
          };
        }

        grouped[prodiNama].peminat += 1;
        if (p.isFinalisasi || p.noPendaftaran || p.user?.isActive) grouped[prodiNama].pendaftar += 1;
        if (p.isDiterima || p.statusKelulusan === 'LULUS') grouped[prodiNama].lulus += 1;
        if (p.isDaftarUlang) grouped[prodiNama].daftarUlang += 1;
        if (p.isDaftarUlang && p.nim) grouped[prodiNama].mahasiswa += 1;
      }

      let allItems = Object.values(grouped).sort((a, b) => b.pendaftar - a.pendaftar || b.peminat - a.peminat);

      if (filter.search && filter.search.trim() !== '') {
        const q = filter.search.trim().toLowerCase();
        allItems = allItems.filter((i) => i.nama.toLowerCase().includes(q));
      }

      const totalData = allItems.length;
      const totalPages = Math.ceil(totalData / limit);
      const startIndex = (page - 1) * limit;
      const pagedItems = allItems.slice(startIndex, startIndex + limit).map((item, idx) => ({
        no: startIndex + idx + 1,
        ...item,
        jumlahPeminat: item.peminat,
        jumlahPendaftar: item.pendaftar,
        jumlahLulus: item.lulus,
        jumlahDaftarUlang: item.daftarUlang,
        jumlahMahasiswa: item.mahasiswa,
      }));

      return {
        mode: 'prodi',
        rekap: pagedItems,
        pagination: {
          page,
          limit,
          totalData,
          totalPages,
          hasMore: page < totalPages,
        },
        summary: {
          totalPeminat: allItems.reduce((a, b) => a + b.peminat, 0),
          totalPendaftar: allItems.reduce((a, b) => a + b.pendaftar, 0),
          totalLulus: allItems.reduce((a, b) => a + b.lulus, 0),
          totalDaftarUlang: allItems.reduce((a, b) => a + b.daftarUlang, 0),
          totalMahasiswa: allItems.reduce((a, b) => a + b.mahasiswa, 0),
        },
      };
    } else {
      // Mode Perguruan Tinggi
      const grouped: Record<string, {
        nama: string;
        namaPerguruanTinggi: string;
        peminat: number;
        pendaftar: number;
        lulus: number;
        daftarUlang: number;
        mahasiswa: number;
      }> = {};

      for (const p of pendaftarList) {
        const pt = p.asalPerguruanTinggi?.trim() || 'Lainnya / Tidak Mengisi';

        if (!grouped[pt]) {
          grouped[pt] = {
            nama: pt,
            namaPerguruanTinggi: pt,
            peminat: 0,
            pendaftar: 0,
            lulus: 0,
            daftarUlang: 0,
            mahasiswa: 0,
          };
        }

        grouped[pt].peminat += 1;
        if (p.isFinalisasi || p.noPendaftaran || p.user?.isActive) grouped[pt].pendaftar += 1;
        if (p.isDiterima || p.statusKelulusan === 'LULUS') grouped[pt].lulus += 1;
        if (p.isDaftarUlang) grouped[pt].daftarUlang += 1;
        if (p.isDaftarUlang && p.nim) grouped[pt].mahasiswa += 1;
      }

      let allItems = Object.values(grouped).sort((a, b) => b.pendaftar - a.pendaftar || b.peminat - a.peminat);

      if (filter.search && filter.search.trim() !== '') {
        const q = filter.search.trim().toLowerCase();
        allItems = allItems.filter((i) => i.nama.toLowerCase().includes(q));
      }

      const totalData = allItems.length;
      const totalPages = Math.ceil(totalData / limit);
      const startIndex = (page - 1) * limit;
      const pagedItems = allItems.slice(startIndex, startIndex + limit).map((item, idx) => ({
        no: startIndex + idx + 1,
        ...item,
        jumlahPeminat: item.peminat,
        jumlahPendaftar: item.pendaftar,
        jumlahLulus: item.lulus,
        jumlahDaftarUlang: item.daftarUlang,
        jumlahMahasiswa: item.mahasiswa,
      }));

      return {
        mode: 'pt',
        rekap: pagedItems,
        pagination: {
          page,
          limit,
          totalData,
          totalPages,
          hasMore: page < totalPages,
        },
        summary: {
          totalPeminat: allItems.reduce((a, b) => a + b.peminat, 0),
          totalPendaftar: allItems.reduce((a, b) => a + b.pendaftar, 0),
          totalLulus: allItems.reduce((a, b) => a + b.lulus, 0),
          totalDaftarUlang: allItems.reduce((a, b) => a + b.daftarUlang, 0),
          totalMahasiswa: allItems.reduce((a, b) => a + b.mahasiswa, 0),
        },
      };
    }
  }

  // =========================================================================
  // TAB 9: PERUSAHAAN (Penerimaan Mahasiswa Baru per Asal Tempat Kerja Pendaftar)
  // =========================================================================
  async getPerusahaan(filter: GlobalDashboardFilter = {}) {
    const { where } = await this.buildWhereClause(filter);

    const pendaftarList = await prisma.pendaftar.findMany({
      where,
      include: {
        programStudi: true,
        prodiDiterima: true,
        user: true,
      },
    });

    const isModeProdi = filter.mode === 'prodi';
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 10));

    if (isModeProdi) {
      const grouped: Record<string, {
        nama: string;
        programStudi: string;
        peminat: number;
        pendaftar: number;
        lulus: number;
        daftarUlang: number;
        mahasiswa: number;
      }> = {};

      for (const p of pendaftarList) {
        if (!p.namaPerusahaan || p.namaPerusahaan.trim() === '') continue;
        const prodiNama = p.programStudi ? `${p.programStudi.jenjang} - ${p.programStudi.namaProdi}` : 'Belum Memilih Prodi';

        if (!grouped[prodiNama]) {
          grouped[prodiNama] = {
            nama: prodiNama,
            programStudi: prodiNama,
            peminat: 0,
            pendaftar: 0,
            lulus: 0,
            daftarUlang: 0,
            mahasiswa: 0,
          };
        }

        grouped[prodiNama].peminat += 1;
        if (p.isFinalisasi || p.noPendaftaran || p.user?.isActive) grouped[prodiNama].pendaftar += 1;
        if (p.isDiterima || p.statusKelulusan === 'LULUS') grouped[prodiNama].lulus += 1;
        if (p.isDaftarUlang) grouped[prodiNama].daftarUlang += 1;
        if (p.isDaftarUlang && p.nim) grouped[prodiNama].mahasiswa += 1;
      }

      let allItems = Object.values(grouped).sort((a, b) => b.pendaftar - a.pendaftar);
      if (filter.search) {
        const q = filter.search.toLowerCase();
        allItems = allItems.filter((i) => i.nama.toLowerCase().includes(q));
      }

      const totalData = allItems.length;
      const totalPages = Math.ceil(totalData / limit);
      const startIndex = (page - 1) * limit;
      const pagedItems = allItems.slice(startIndex, startIndex + limit).map((item, idx) => ({
        no: startIndex + idx + 1,
        ...item,
      }));

      return {
        mode: 'prodi',
        rekap: pagedItems,
        pagination: { page, limit, totalData, totalPages, hasMore: page < totalPages },
        summary: {
          totalPeminat: allItems.reduce((a, b) => a + b.peminat, 0),
          totalPendaftar: allItems.reduce((a, b) => a + b.pendaftar, 0),
          totalLulus: allItems.reduce((a, b) => a + b.lulus, 0),
          totalDaftarUlang: allItems.reduce((a, b) => a + b.daftarUlang, 0),
          totalMahasiswa: allItems.reduce((a, b) => a + b.mahasiswa, 0),
        },
      };
    } else {
      const grouped: Record<string, {
        nama: string;
        namaPerusahaan: string;
        peminat: number;
        pendaftar: number;
        lulus: number;
        daftarUlang: number;
        mahasiswa: number;
      }> = {};

      for (const p of pendaftarList) {
        if (!p.namaPerusahaan || p.namaPerusahaan.trim() === '') continue;
        const perus = p.namaPerusahaan.trim();

        if (!grouped[perus]) {
          grouped[perus] = {
            nama: perus,
            namaPerusahaan: perus,
            peminat: 0,
            pendaftar: 0,
            lulus: 0,
            daftarUlang: 0,
            mahasiswa: 0,
          };
        }

        grouped[perus].peminat += 1;
        if (p.isFinalisasi || p.noPendaftaran || p.user?.isActive) grouped[perus].pendaftar += 1;
        if (p.isDiterima || p.statusKelulusan === 'LULUS') grouped[perus].lulus += 1;
        if (p.isDaftarUlang) grouped[perus].daftarUlang += 1;
        if (p.isDaftarUlang && p.nim) grouped[perus].mahasiswa += 1;
      }

      let allItems = Object.values(grouped).sort((a, b) => b.pendaftar - a.pendaftar);
      if (filter.search) {
        const q = filter.search.toLowerCase();
        allItems = allItems.filter((i) => i.nama.toLowerCase().includes(q));
      }

      const totalData = allItems.length;
      const totalPages = Math.ceil(totalData / limit);
      const startIndex = (page - 1) * limit;
      const pagedItems = allItems.slice(startIndex, startIndex + limit).map((item, idx) => ({
        no: startIndex + idx + 1,
        ...item,
      }));

      return {
        mode: 'perusahaan',
        rekap: pagedItems,
        pagination: { page, limit, totalData, totalPages, hasMore: page < totalPages },
        summary: {
          totalPeminat: allItems.reduce((a, b) => a + b.peminat, 0),
          totalPendaftar: allItems.reduce((a, b) => a + b.pendaftar, 0),
          totalLulus: allItems.reduce((a, b) => a + b.lulus, 0),
          totalDaftarUlang: allItems.reduce((a, b) => a + b.daftarUlang, 0),
          totalMahasiswa: allItems.reduce((a, b) => a + b.mahasiswa, 0),
        },
      };
    }
  }

  // =========================================================================
  // TAB 10: SELEKSI (Rekapitulasi Nilai Seleksi PMB)
  // =========================================================================
  async getDashboardSeleksi(filter: GlobalDashboardFilter = {}) {
    const { where } = await this.buildWhereClause(filter);

    const nilaiList = await prisma.nilaiSeleksi.findMany({
      where: {
        pendaftar: where,
      },
      include: {
        pendaftar: {
          select: { id: true, noPendaftaran: true, user: true },
        },
      },
    });

    const seleksiMap: Record<string, typeof nilaiList> = {};
    for (const item of nilaiList) {
      const nama = item.jenisTes?.trim() || 'Ujian Seleksi PMB';
      if (!seleksiMap[nama]) seleksiMap[nama] = [];
      seleksiMap[nama].push(item);
    }

    const defaultTesList = [
      'Tes Potensi Akademik (TPA)',
      'Ujian Masuk CBT PMB',
      'Tes Wawancara Keislaman & Baca Tulis Al-Qur\'an',
      'Tes Kemampuan Bahasa Inggris (TOEFL Prediction)',
    ];

    for (const def of defaultTesList) {
      if (!seleksiMap[def]) seleksiMap[def] = [];
    }

    const rekap = Object.entries(seleksiMap).map(([namaSeleksi, items], idx) => {
      const jumlahPeserta = items.length;
      const pesertaBelumDinilai = items.filter((i) => i.nilai === null || i.nilai === 0).length;
      const nilaiValid = items.filter((i) => i.nilai !== null && i.nilai > 0).map((i) => i.nilai);

      const nilaiTerendah = nilaiValid.length > 0 ? Math.min(...nilaiValid) : 0;
      const nilaiTertinggi = nilaiValid.length > 0 ? Math.max(...nilaiValid) : 0;
      const nilaiRerata =
        nilaiValid.length > 0
          ? Math.round((nilaiValid.reduce((a, b) => a + b, 0) / nilaiValid.length) * 10) / 10
          : 0;

      return {
        no: idx + 1,
        namaSeleksi,
        jumlahPeserta,
        pesertaBelumMemilikiNilai: pesertaBelumDinilai,
        nilaiTerendah,
        nilaiTertinggi,
        nilaiRerata,
      };
    });

    return {
      rekap,
      summary: {
        totalSeleksi: rekap.length,
        totalPeserta: rekap.reduce((a, b) => a + b.jumlahPeserta, 0),
        pesertaBelumMemilikiNilai: rekap.reduce((a, b) => a + b.pesertaBelumMemilikiNilai, 0),
      },
    };
  }

  // =========================================================================
  // TAB 11: KUESIONER (Hasil Kuesioner PMB)
  // =========================================================================
  async getDashboardKuesioner(filter: GlobalDashboardFilter = {}) {
    const { where } = await this.buildWhereClause(filter);

    const pendaftarList = await prisma.pendaftar.findMany({
      where,
      select: {
        id: true,
        sumberTrafik: true,
        alasanMemilih: true,
      },
    });

    const totalResponden = pendaftarList.length;

    const sumberCounts: Record<string, number> = {
      'Media Sosial (Instagram / TikTok / YouTube)': 0,
      'Website Resmi UIKA Bogor (uika-bogor.ac.id)': 0,
      'Sosialisasi Sekolah / Guru BK': 0,
      'Rekomendasi Keluarga / Teman / Alumni': 0,
      'Pameran Pendidikan (Edu Fair)': 0,
    };

    const alasanCounts: Record<string, number> = {
      'Kampus Berbasis Nilai-Nilai Islami Unggul': 0,
      'Reputasi & Akreditasi Program Studi (Unggul / A)': 0,
      'Lokasi Strategis di Pusat Kota Bogor': 0,
      'Biaya Kuliah Terjangkau & Peluang Beasiswa': 0,
      'Prospek Kerja Lulusan yang Luas': 0,
    };

    for (const p of pendaftarList) {
      if (p.sumberTrafik) {
        const match = Object.keys(sumberCounts).find((k) =>
          k.toLowerCase().includes(p.sumberTrafik!.toLowerCase()) || p.sumberTrafik!.toLowerCase().includes(k.toLowerCase())
        );
        if (match) sumberCounts[match] += 1;
        else sumberCounts['Media Sosial (Instagram / TikTok / YouTube)'] += 1;
      }

      if (p.alasanMemilih) {
        const match = Object.keys(alasanCounts).find((k) =>
          k.toLowerCase().includes(p.alasanMemilih!.toLowerCase()) || p.alasanMemilih!.toLowerCase().includes(k.toLowerCase())
        );
        if (match) alasanCounts[match] += 1;
        else alasanCounts['Kampus Berbasis Nilai-Nilai Islami Unggul'] += 1;
      }
    }

    const formatPersen = (val: number, total: number) => {
      if (total <= 0) return '0.0%';
      return `${Math.round((val / total) * 1000) / 10}%`;
    };

    const rekap: any[] = [];
    const p1Judul = 'Dari mana Anda mengetahui informasi PMB Universitas Ibn Khaldun Bogor?';
    let p1Nomor = 1;
    for (const [jawaban, jumlah] of Object.entries(sumberCounts)) {
      rekap.push({
        pertanyaan: p1Judul,
        nomor: p1Nomor++,
        jawaban,
        jumlah,
        persen: formatPersen(jumlah, totalResponden),
      });
    }

    const p2Judul = 'Apa alasan utama Anda memilih Universitas Ibn Khaldun Bogor?';
    let p2Nomor = 1;
    for (const [jawaban, jumlah] of Object.entries(alasanCounts)) {
      rekap.push({
        pertanyaan: p2Judul,
        nomor: p2Nomor++,
        jawaban,
        jumlah,
        persen: formatPersen(jumlah, totalResponden),
      });
    }

    return {
      rekap,
      totalResponden,
    };
  }

  // =========================================================================
  // TAB 12: ORANG TUA (Sebaran Profil Orang Tua)
  // =========================================================================
  async getDashboardOrangTua(filter: GlobalDashboardFilter = {}) {
    const { where } = await this.buildWhereClause(filter);

    const ortuList = await prisma.orangTua.findMany({
      where: {
        pendaftar: where,
      },
      select: {
        id: true,
        pendidikanAyah: true,
        pekerjaanAyah: true,
        pendidikanIbu: true,
        pekerjaanIbu: true,
        penghasilanOrtu: true,
      },
    });

    const totalResponden = ortuList.length;

    const formatPersen = (val: number, total: number) => {
      if (total <= 0) return '0.0%';
      return `${Math.round((val / total) * 1000) / 10}%`;
    };

    const pendAyahCounts: Record<string, number> = {
      'SD / MI': 0,
      'SMP / MTs': 0,
      'SMA / SMK / MA': 0,
      'Diploma (D1 / D2 / D3 / D4)': 0,
      'Sarjana (S1)': 0,
      'Magister (S2)': 0,
      'Doktor (S3)': 0,
    };

    const pekAyahCounts: Record<string, number> = {
      'PNS / TNI / POLRI': 0,
      'Pegawai Swasta / BUMN': 0,
      'Wiraswasta / Pengusaha': 0,
      'Guru / Dosen': 0,
      'Petani / Nelayan / Buruh': 0,
      'Pensiunan': 0,
      'Lainnya / Tidak Bekerja': 0,
    };

    const pekIbuCounts: Record<string, number> = {
      'Ibu Rumah Tangga': 0,
      'Pegawai Swasta / BUMN': 0,
      'PNS / TNI / POLRI / Guru': 0,
      'Wiraswasta / Pengusaha': 0,
      'Lainnya': 0,
    };

    const penghasilanCounts: Record<string, number> = {
      '< Rp 2.000.000': 0,
      'Rp 2.000.000 - Rp 5.000.000': 0,
      'Rp 5.000.000 - Rp 10.000.000': 0,
      '> Rp 10.000.000': 0,
    };

    for (const o of ortuList) {
      if (o.pendidikanAyah && pendAyahCounts[o.pendidikanAyah] !== undefined) pendAyahCounts[o.pendidikanAyah]++;
      else if (o.pendidikanAyah) pendAyahCounts['Sarjana (S1)']++;

      if (o.pekerjaanAyah && pekAyahCounts[o.pekerjaanAyah] !== undefined) pekAyahCounts[o.pekerjaanAyah]++;
      else if (o.pekerjaanAyah) pekAyahCounts['PNS / TNI / POLRI']++;

      if (o.pekerjaanIbu && pekIbuCounts[o.pekerjaanIbu] !== undefined) pekIbuCounts[o.pekerjaanIbu]++;
      else if (o.pekerjaanIbu) pekIbuCounts['Ibu Rumah Tangga']++;

      if (o.penghasilanOrtu && penghasilanCounts[o.penghasilanOrtu] !== undefined) penghasilanCounts[o.penghasilanOrtu]++;
      else if (o.penghasilanOrtu) penghasilanCounts['Rp 5.000.000 - Rp 10.000.000']++;
    }

    const tabelKiri: any[] = [];
    let idxKiri = 1;
    for (const [jawaban, jumlah] of Object.entries(pendAyahCounts)) {
      tabelKiri.push({
        pertanyaan: 'Pendidikan Terakhir Ayah',
        nomor: idxKiri++,
        jawaban,
        jumlah,
        persen: formatPersen(jumlah, totalResponden),
      });
    }
    idxKiri = 1;
    for (const [jawaban, jumlah] of Object.entries(pekAyahCounts)) {
      tabelKiri.push({
        pertanyaan: 'Pekerjaan Ayah',
        nomor: idxKiri++,
        jawaban,
        jumlah,
        persen: formatPersen(jumlah, totalResponden),
      });
    }

    const tabelKanan: any[] = [];
    let idxKanan = 1;
    for (const [jawaban, jumlah] of Object.entries(pekIbuCounts)) {
      tabelKanan.push({
        pertanyaan: 'Pekerjaan Ibu',
        nomor: idxKanan++,
        jawaban,
        jumlah,
        persen: formatPersen(jumlah, totalResponden),
      });
    }
    idxKanan = 1;
    for (const [jawaban, jumlah] of Object.entries(penghasilanCounts)) {
      tabelKanan.push({
        pertanyaan: 'Penghasilan Gabungan Orang Tua per Bulan',
        nomor: idxKanan++,
        jawaban,
        jumlah,
        persen: formatPersen(jumlah, totalResponden),
      });
    }

    return {
      tabelKiri,
      tabelKanan,
      rekap: [...tabelKiri, ...tabelKanan],
      totalResponden,
    };
  }
}

export const adminDashboardService = new AdminDashboardService();
