import prisma from '../config/database';

export interface DashboardChartsFilter {
  periodeId?: number;
  kodePeriode?: string;
  tahun?: number;
}

export class AdminDashboardService {
  async getChartsData(filter: DashboardChartsFilter = {}) {
    // 1. Ambil daftar semua periode untuk dropdown filter
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
      if (selectedPeriode) {
        selectedPeriodeId = selectedPeriode.id;
      }
    } else if (periodeAktif) {
      selectedPeriodeId = periodeAktif.id;
      selectedPeriode = periodeAktif;
    }

    // 3. Filter query untuk Pendaftar berdasarkan periode
    const pendaftarWhere: any = {};
    if (selectedPeriodeId) {
      pendaftarWhere.periodeId = selectedPeriodeId;
    }

    // Ambil seluruh data pendaftar sesuai filter
    const pendaftarList = await prisma.pendaftar.findMany({
      where: pendaftarWhere,
      include: {
        user: {
          select: { id: true, nama: true, email: true, createdAt: true },
        },
        periode: {
          select: { id: true, kode: true, nama: true },
        },
        programStudi: {
          select: { id: true, namaProdi: true, jenjang: true },
        },
      },
    });

    // Ambil data User CAMABA untuk perhitungan Funnel Tahap 1 (Peminat)
    const userCamabaCount = await prisma.user.count({
      where: { role: 'CAMABA' },
    });

    // Peminat pada periode ini: pendaftar di periode ini + (user tanpa pendaftar jika periode aktif/tidak difilter)
    const totalPendaftarPeriode = pendaftarList.length;
    const usersWithoutPendaftar = await prisma.user.count({
      where: {
        role: 'CAMABA',
        pendaftar: null,
      },
    });
    const totalPeminat = selectedPeriodeId
      ? totalPendaftarPeriode + usersWithoutPendaftar
      : userCamabaCount;

    // ==========================================
    // 4. GRAFIK FUNNEL 8 TAHAPAN
    // ==========================================
    // Tahap 1: Peminat (Semua akun calon mahasiswa yang mendaftar di sistem)
    // Tahap 2: Memilih Jalur & Prodi / Terdaftar (Data pendaftar telah terbuat)
    // Tahap 3: Mengisi Biodata (isBiodataLengkap === true)
    // Tahap 4: Finalisasi Data (isFinalisasi === true)
    // Tahap 5: Mengikuti Seleksi (isIkutSeleksi === true)
    // Tahap 6: Lulus Seleksi (isDiterima === true)
    // Tahap 7: Daftar Ulang (isDaftarUlang === true)
    // Tahap 8: Generate NIM (nim !== null dan nim !== '')

    const countTahap1 = totalPeminat;
    const countTahap2 = totalPendaftarPeriode;
    const countTahap3 = pendaftarList.filter((p) => p.isBiodataLengkap).length;
    const countTahap4 = pendaftarList.filter((p) => p.isFinalisasi).length;
    const countTahap5 = pendaftarList.filter((p) => p.isIkutSeleksi).length;
    const countTahap6 = pendaftarList.filter((p) => p.isDiterima).length;
    const countTahap7 = pendaftarList.filter((p) => p.isDaftarUlang).length;
    const countTahap8 = pendaftarList.filter((p) => p.nim && p.nim.trim() !== '').length;

    const calculatePercentage = (val: number, base: number) => {
      if (base <= 0) return 0;
      return Math.round((val / base) * 1000) / 10; // 1 angka di belakang koma (misal 85.5)
    };

    const funnelTahapan = [
      {
        tahap: 1,
        nama: 'Peminat',
        deskripsi: 'Calon mahasiswa baru yang telah registrasi akun',
        total: countTahap1,
        persentase: countTahap1 > 0 ? 100 : 0,
        konversiDariSebelumnya: 100,
      },
      {
        tahap: 2,
        nama: 'Memilih Jalur & Prodi',
        deskripsi: 'Calon mahasiswa yang telah memilih program studi dan jalur pendaftaran',
        total: countTahap2,
        persentase: calculatePercentage(countTahap2, countTahap1),
        konversiDariSebelumnya: calculatePercentage(countTahap2, countTahap1),
      },
      {
        tahap: 3,
        nama: 'Mengisi Biodata',
        deskripsi: 'Pendaftar yang telah melengkapi biodata diri dan berkas',
        total: countTahap3,
        persentase: calculatePercentage(countTahap3, countTahap1),
        konversiDariSebelumnya: calculatePercentage(countTahap3, countTahap2),
      },
      {
        tahap: 4,
        nama: 'Finalisasi Data',
        deskripsi: 'Pendaftar yang telah memfinalisasi dan mengunci berkas pendaftaran',
        total: countTahap4,
        persentase: calculatePercentage(countTahap4, countTahap1),
        konversiDariSebelumnya: calculatePercentage(countTahap4, countTahap3),
      },
      {
        tahap: 5,
        nama: 'Mengikuti Seleksi',
        deskripsi: 'Pendaftar yang hadir mengikuti ujian CBT / penilaian seleksi masuk',
        total: countTahap5,
        persentase: calculatePercentage(countTahap5, countTahap1),
        konversiDariSebelumnya: calculatePercentage(countTahap5, countTahap4),
      },
      {
        tahap: 6,
        nama: 'Lulus Seleksi',
        deskripsi: 'Pendaftar yang dinyatakan lulus seleksi dan diterima di program studi',
        total: countTahap6,
        persentase: calculatePercentage(countTahap6, countTahap1),
        konversiDariSebelumnya: calculatePercentage(countTahap6, countTahap5),
      },
      {
        tahap: 7,
        nama: 'Daftar Ulang',
        deskripsi: 'Pendaftar yang telah melakukan pembayaran dan verifikasi daftar ulang',
        total: countTahap7,
        persentase: calculatePercentage(countTahap7, countTahap1),
        konversiDariSebelumnya: calculatePercentage(countTahap7, countTahap6),
      },
      {
        tahap: 8,
        nama: 'Generate NIM',
        deskripsi: 'Mahasiswa baru yang telah diterbitkan Nomor Induk Mahasiswa resmi',
        total: countTahap8,
        persentase: calculatePercentage(countTahap8, countTahap1),
        konversiDariSebelumnya: calculatePercentage(countTahap8, countTahap7),
      },
    ];

    // ==========================================
    // 5. GRAFIK FREKUENSI BULANAN
    // ==========================================
    // Frekuensi bulanan pendaftar berdasarkan createdAt pendaftar
    const targetTahun = filter.tahun ? Number(filter.tahun) : new Date().getFullYear();
    const namaBulan = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];

    const monthlyCounts = namaBulan.map((bulan, idx) => ({
      bulan,
      bulanAngka: idx + 1,
      tahun: targetTahun,
      pendaftar: 0,
      finalisasi: 0,
      lulus: 0,
      daftarUlang: 0,
    }));

    for (const p of pendaftarList) {
      if (p.createdAt) {
        const d = new Date(p.createdAt);
        if (d.getFullYear() === targetTahun) {
          const m = d.getMonth();
          monthlyCounts[m].pendaftar += 1;
        }
      }
      if (p.tanggalFinalisasi) {
        const d = new Date(p.tanggalFinalisasi);
        if (d.getFullYear() === targetTahun) {
          const m = d.getMonth();
          monthlyCounts[m].finalisasi += 1;
        }
      }
      if (p.tanggalLulus) {
        const d = new Date(p.tanggalLulus);
        if (d.getFullYear() === targetTahun) {
          const m = d.getMonth();
          monthlyCounts[m].lulus += 1;
        }
      }
      if (p.tanggalDaftarUlang) {
        const d = new Date(p.tanggalDaftarUlang);
        if (d.getFullYear() === targetTahun) {
          const m = d.getMonth();
          monthlyCounts[m].daftarUlang += 1;
        }
      }
    }

    const frekuensiBulanan = {
      tahun: targetTahun,
      detail: monthlyCounts,
      categories: namaBulan,
      series: [
        {
          name: 'Pendaftar',
          data: monthlyCounts.map((m) => m.pendaftar),
        },
        {
          name: 'Finalisasi',
          data: monthlyCounts.map((m) => m.finalisasi),
        },
        {
          name: 'Lulus',
          data: monthlyCounts.map((m) => m.lulus),
        },
        {
          name: 'Daftar Ulang',
          data: monthlyCounts.map((m) => m.daftarUlang),
        },
      ],
    };

    // ==========================================
    // 6. GRAFIK SUMBER TRAFIK PENDAFTAR
    // ==========================================
    const sumberTrafikMap = new Map<string, number>();
    for (const p of pendaftarList) {
      const src = p.sumberTrafik && p.sumberTrafik.trim() !== '' ? p.sumberTrafik.trim() : 'Lainnya / Tidak Diketahui';
      sumberTrafikMap.set(src, (sumberTrafikMap.get(src) || 0) + 1);
    }

    const sumberTrafikData = Array.from(sumberTrafikMap.entries())
      .map(([sumber, total]) => ({
        sumber,
        total,
        persentase: calculatePercentage(total, totalPendaftarPeriode),
      }))
      .sort((a, b) => b.total - a.total);

    const sumberTrafik = {
      labels: sumberTrafikData.map((d) => d.sumber),
      data: sumberTrafikData.map((d) => d.total),
      detail: sumberTrafikData,
    };

    // ==========================================
    // 7. PIE CHART JENIS KELAMIN
    // ==========================================
    const jenisKelaminMap = new Map<string, number>();
    for (const p of pendaftarList) {
      const jk = p.jenisKelamin && p.jenisKelamin.trim() !== '' ? p.jenisKelamin.trim() : 'Belum Diisi';
      jenisKelaminMap.set(jk, (jenisKelaminMap.get(jk) || 0) + 1);
    }

    const jenisKelaminData = Array.from(jenisKelaminMap.entries())
      .map(([jenisKelamin, total]) => ({
        jenisKelamin,
        total,
        persentase: calculatePercentage(total, totalPendaftarPeriode),
      }))
      .sort((a, b) => b.total - a.total);

    const jenisKelamin = {
      labels: jenisKelaminData.map((d) => d.jenisKelamin),
      data: jenisKelaminData.map((d) => d.total),
      detail: jenisKelaminData,
    };

    // ==========================================
    // 8. PIE CHART TAHUN LULUS
    // ==========================================
    const tahunLulusMap = new Map<string, number>();
    for (const p of pendaftarList) {
      const thn = p.tahunLulus ? String(p.tahunLulus) : 'Belum Diisi';
      tahunLulusMap.set(thn, (tahunLulusMap.get(thn) || 0) + 1);
    }

    const tahunLulusData = Array.from(tahunLulusMap.entries())
      .map(([tahun, total]) => ({
        tahun,
        total,
        persentase: calculatePercentage(total, totalPendaftarPeriode),
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

    // ==========================================
    // 9. PIE CHART JENIS PENDIDIKAN (SMA / SMK / MA)
    // ==========================================
    const jenisPendidikanMap = new Map<string, number>();
    for (const p of pendaftarList) {
      const jp = p.jenisPendidikan && p.jenisPendidikan.trim() !== '' ? p.jenisPendidikan.trim().toUpperCase() : 'LAINNYA';
      jenisPendidikanMap.set(jp, (jenisPendidikanMap.get(jp) || 0) + 1);
    }

    const jenisPendidikanData = Array.from(jenisPendidikanMap.entries())
      .map(([jenisPendidikan, total]) => ({
        jenisPendidikan,
        total,
        persentase: calculatePercentage(total, totalPendaftarPeriode),
      }))
      .sort((a, b) => b.total - a.total);

    const jenisPendidikan = {
      labels: jenisPendidikanData.map((d) => d.jenisPendidikan),
      data: jenisPendidikanData.map((d) => d.total),
      detail: jenisPendidikanData,
    };

    // ==========================================
    // 10. PIE CHART JURUSAN PENDIDIKAN
    // ==========================================
    const jurusanPendidikanMap = new Map<string, number>();
    for (const p of pendaftarList) {
      const jur = p.jurusanPendidikan && p.jurusanPendidikan.trim() !== '' ? p.jurusanPendidikan.trim() : 'Lainnya / Belum Diisi';
      jurusanPendidikanMap.set(jur, (jurusanPendidikanMap.get(jur) || 0) + 1);
    }

    const jurusanPendidikanData = Array.from(jurusanPendidikanMap.entries())
      .map(([jurusan, total]) => ({
        jurusan,
        total,
        persentase: calculatePercentage(total, totalPendaftarPeriode),
      }))
      .sort((a, b) => b.total - a.total);

    const jurusanPendidikan = {
      labels: jurusanPendidikanData.map((d) => d.jurusan),
      data: jurusanPendidikanData.map((d) => d.total),
      detail: jurusanPendidikanData,
    };

    // ==========================================
    // 11. KARTU STATISTIK RINGKASAN (SUMMARY CARDS)
    // ==========================================
    const summary = {
      totalPeminat: countTahap1,
      totalPendaftar: countTahap2,
      totalBiodataLengkap: countTahap3,
      totalFinalisasi: countTahap4,
      totalIkutSeleksi: countTahap5,
      totalLulus: countTahap6,
      totalDaftarUlang: countTahap7,
      totalGenerateNim: countTahap8,
    };

    return {
      filter: {
        selectedPeriode,
        periodeAktif,
        daftarPeriode,
      },
      summary,
      charts: {
        frekuensiBulanan,
        sumberTrafik,
        funnelTahapan,
        jenisKelamin,
        tahunLulus,
        jenisPendidikan,
        jurusanPendidikan,
      },
    };
  }

  /**
   * Ringkasan ringkas kartu statistik (summary cards)
   */
  async getSummaryData(filter: DashboardChartsFilter = {}) {
    const data = await this.getChartsData(filter);
    return {
      filter: data.filter,
      summary: data.summary,
    };
  }
}

export const adminDashboardService = new AdminDashboardService();
