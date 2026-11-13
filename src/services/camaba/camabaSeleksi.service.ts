import prisma from '../../config/database';

export class CamabaSeleksiService {
  /**
   * Data Kartu Peserta Ujian Seleksi Masuk
   */
  async getKartuUjian(userId: number) {
    const pendaftar = await prisma.pendaftar.findUnique({
      where: { userId },
      include: {
        user: true,
        programStudi: true,
        pilihanProdi2: true,
        pilihanProdi3: true,
        jalurPendaftaran: true,
        gelombang: true,
        periode: true,
        sistemKuliah: true,
      },
    });

    if (!pendaftar) {
      throw new Error('Data pendaftar tidak ditemukan.');
    }

    if (!pendaftar.isFinalisasi) {
      throw new Error('Kartu ujian hanya dapat diunduh/dilihat setelah formulir pendaftaran difinalisasi.');
    }

    const nomorUjian = pendaftar.nomorUjian || `UJN-${pendaftar.noPendaftaran}`;

    return {
      judul: 'KARTU TANDA PESERTA UJIAN SELEKSI MASUK',
      institusi: 'UNIVERSITAS IBN KHALDUN BOGOR',
      tahunAkademik: pendaftar.periode.nama,
      nomorUjian,
      noPendaftaran: pendaftar.noPendaftaran,
      namaLengkap: pendaftar.user.nama,
      email: pendaftar.user.email,
      jalurPendaftaran: pendaftar.jalurPendaftaran.nama,
      gelombang: pendaftar.gelombang.nama,
      sistemKuliah: pendaftar.sistemKuliah.nama,
      pilihanProdi: [
        { prioritas: 1, prodi: `${pendaftar.programStudi.jenjang} - ${pendaftar.programStudi.namaProdi}` },
        ...(pendaftar.pilihanProdi2
          ? [{ prioritas: 2, prodi: `${pendaftar.pilihanProdi2.jenjang} - ${pendaftar.pilihanProdi2.namaProdi}` }]
          : []),
        ...(pendaftar.pilihanProdi3
          ? [{ prioritas: 3, prodi: `${pendaftar.pilihanProdi3.jenjang} - ${pendaftar.pilihanProdi3.namaProdi}` }]
          : []),
      ],
      jadwalUjian: {
        jenisUjian: 'Computer Based Test (CBT) & Wawancara Online',
        lokasiUjian: 'Gedung Rektorat UIKA / Sistem CBT Online SPMB',
        linkUjianOnline: 'https://cbt.uika-bogor.ac.id',
        waktuPelaksanaan: 'Sesuai jadwal gelombang aktif (Pukul 08:30 - 11:30 WIB)',
      },
      tataTertib: [
        '1. Peserta wajib membawa Kartu Peserta Ujian dan KTP/Identitas asli saat mengikuti ujian.',
        '2. Hadir di lokasi ujian atau login di sistem CBT 15 menit sebelum ujian dimulai.',
        '3. Berpakaian rapi, sopan, dan berkerah (tidak diperkenankan memakai kaos oblong atau celana sobek).',
        '4. Dilarang menggunakan alat komunikasi atau bantuan orang lain selama ujian berlangsung.',
      ],
    };
  }

  /**
   * Hasil Pengumuman Seleksi & Rincian Nilai
   */
  async getHasilSeleksi(userId: number) {
    const pendaftar = await prisma.pendaftar.findUnique({
      where: { userId },
      include: {
        user: true,
        programStudi: true,
        prodiDiterima: true,
        jalurPendaftaran: true,
        gelombang: true,
        periode: true,
        sistemKuliah: true,
        nilaiSeleksi: true,
      },
    });

    if (!pendaftar) {
      throw new Error('Data pendaftar tidak ditemukan.');
    }

    const prodiDiterimaFormatted = pendaftar.prodiDiterima
      ? `${pendaftar.prodiDiterima.jenjang} - ${pendaftar.prodiDiterima.namaProdi}`
      : pendaftar.statusKelulusan === 'LULUS'
      ? `${pendaftar.programStudi.jenjang} - ${pendaftar.programStudi.namaProdi}`
      : null;

    const pesanKelulusan =
      pendaftar.statusKelulusan === 'LULUS'
        ? `Selamat! Anda dinyatakan LULUS Seleksi Penerimaan Mahasiswa Baru Universitas Ibn Khaldun Bogor pada program studi ${prodiDiterimaFormatted}.`
        : pendaftar.statusKelulusan === 'TIDAK_LULUS'
        ? 'Mohon maaf, Anda belum memenuhi kualifikasi seleksi pada periode ini. Tetap semangat dan Anda dapat mencoba di gelombang selanjutnya.'
        : pendaftar.statusKelulusan === 'CADANGAN'
        ? 'Status Anda saat ini adalah PESERTA CADANGAN. Keputusan akhir kelulusan akan diumumkan setelah proses daftar ulang peserta utama selesai.'
        : 'Hasil seleksi masih dalam proses evaluasi oleh Panitia PMB. Silakan cek kembali secara berkala.';

    return {
      noPendaftaran: pendaftar.noPendaftaran,
      namaCamaba: pendaftar.user.nama,
      statusKelulusan: pendaftar.statusKelulusan, // LULUS, TIDAK_LULUS, CADANGAN, MENUNGGU
      isLulus: pendaftar.statusKelulusan === 'LULUS',
      pesan: pesanKelulusan,
      prodiDiterima: prodiDiterimaFormatted,
      jalur: pendaftar.jalurPendaftaran.nama,
      gelombang: pendaftar.gelombang.nama,
      periode: pendaftar.periode.nama,
      rincianNilai: pendaftar.nilaiSeleksi.map((n) => ({
        mataUji: n.jenisTes,
        skor: n.nilai,
        statusLulusUji: n.lulusTes ? 'Lulus' : 'Belum Memenuhi',
        catatan: n.catatan,
      })),
      isDaftarUlang: pendaftar.isDaftarUlang,
      nim: pendaftar.nim,
      letterOfAcceptance:
        pendaftar.statusKelulusan === 'LULUS'
          ? {
              nomorSurat: `SK-PMB/UIKA/${new Date().getFullYear()}/${pendaftar.id.toString().padStart(4, '0')}`,
              perihal: 'Surat Keterangan Kelulusan (Letter of Acceptance)',
              tanggalTerbit: pendaftar.tanggalGenerateNim || new Date(),
              tautanUnduhLoa: `/api/camaba/seleksi/download-loa/${pendaftar.noPendaftaran}`,
            }
          : null,
    };
  }
}

export const camabaSeleksiService = new CamabaSeleksiService();

