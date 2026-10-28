import prisma from '../config/database';

export class AdminReferensiService {
  /**
   * Mengambil data master Gelombang (Sesuai Screenshot 2 tabel Gelombang)
   */
  async getGelombang() {
    const items = await prisma.gelombang.findMany({
      orderBy: { id: 'asc' },
    });

    return items.map((g) => ({
      kode: g.id,
      nama: g.nama,
    }));
  }

  /**
   * Mengambil data master Jalur Pendaftaran
   */
  async getJalurPendaftaran() {
    return prisma.jalurPendaftaran.findMany({
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Mengambil data master Sistem Kuliah
   */
  async getSistemKuliah() {
    return prisma.sistemKuliah.findMany({
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Mengambil data master Program Studi
   */
  async getProgramStudi() {
    return prisma.programStudi.findMany({
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Mengambil data master Periode
   */
  async getPeriode() {
    return prisma.periode.findMany({
      orderBy: { id: 'desc' },
    });
  }

  /**
   * Jenis Program (Referensi > Pendaftaran > Jenis Program)
   */
  async getJenisProgram() {
    return [
      { kode: 'D3', nama: 'Diploma Tiga (D3)' },
      { kode: 'D4', nama: 'Sarjana Terapan (D4)' },
      { kode: 'S1', nama: 'Sarjana (S1)' },
      { kode: 'S2', nama: 'Magister (S2)' },
      { kode: 'S3', nama: 'Doktor (S3)' },
      { kode: 'PROF', nama: 'Profesi' },
    ];
  }

  /**
   * Jenis Pendaftaran (Referensi > Pendaftaran > Jenis Pendaftaran)
   */
  async getJenisPendaftaran() {
    return [
      { kode: 'BARU', nama: 'Peserta Didik Baru' },
      { kode: 'PINDAHAN', nama: 'Pindahan' },
      { kode: 'ALIH_JENJANG', nama: 'Alih Jenjang / Ekstensi' },
      { kode: 'RPL', nama: 'Rekognisi Pembelajaran Lampau (RPL)' },
    ];
  }

  /**
   * Wilayah (Referensi > Wilayah)
   */
  async getWilayah() {
    return [
      {
        provinsi: 'Jawa Barat',
        kabupatenKota: ['Kota Bogor', 'Kabupaten Bogor', 'Kota Depok', 'Kota Bekasi', 'Kota Bandung', 'Kabupaten Sukabumi', 'Kabupaten Cianjur'],
      },
      {
        provinsi: 'DKI Jakarta',
        kabupatenKota: ['Jakarta Selatan', 'Jakarta Timur', 'Jakarta Barat', 'Jakarta Pusat', 'Jakarta Utara'],
      },
      {
        provinsi: 'Banten',
        kabupatenKota: ['Kota Tangerang', 'Kota Tangerang Selatan', 'Kabupaten Tangerang', 'Kota Serang'],
      },
      {
        provinsi: 'Jawa Tengah',
        kabupatenKota: ['Kota Semarang', 'Kota Solo', 'Kota Magelang', 'Kabupaten Banyumas'],
      },
      {
        provinsi: 'Jawa Timur',
        kabupatenKota: ['Kota Surabaya', 'Kota Malang', 'Kabupaten Sidoarjo'],
      },
      {
        provinsi: 'Luar Pulau Jawa',
        kabupatenKota: ['Kota Medan', 'Kota Palembang', 'Kota Padang', 'Kota Bandar Lampung', 'Kota Makassar'],
      },
    ];
  }

  /**
   * Dokumen RPL (Referensi > Jenis Dokumen RPL)
   */
  async getJenisDokumenRpl() {
    return [
      { kode: 'IJAZAH_TRANSKRIP', nama: 'Ijazah & Transkrip Nilai Pendidikan Formal Sebelumnya', wajib: true },
      { kode: 'CV_PORTFOLIO', nama: 'Daftar Riwayat Hidup (CV) & Portofolio Karya', wajib: true },
      { kode: 'SERTIFIKAT_KOMPETENSI', nama: 'Sertifikat Kompetensi / Profesi BNSP', wajib: false },
      { kode: 'SURAT_KETERANGAN_BEKERJA', nama: 'Surat Keterangan Pengalaman Kerja / SK Pengangkatan', wajib: true },
      { kode: 'BUKTI_KINERJA', nama: 'Logbook / Bukti Hasil Pekerjaan Relevan', wajib: false },
      { kode: 'FORM_EVALUASI_DIRI', nama: 'Formulir Asesmen Mandiri / Evaluasi Diri RPL', wajib: true },
    ];
  }

  /**
   * Mata Kuliah RPL (Kesiapan RPL)
   */
  async getMataKuliahRpl(programStudiId?: number) {
    const where: any = {};
    if (programStudiId) where.programStudiId = Number(programStudiId);

    const items = await prisma.mataKuliahRpl.findMany({
      where,
      include: { programStudi: true },
      orderBy: { id: 'asc' },
    });

    return items;
  }
}

export const adminReferensiService = new AdminReferensiService();
