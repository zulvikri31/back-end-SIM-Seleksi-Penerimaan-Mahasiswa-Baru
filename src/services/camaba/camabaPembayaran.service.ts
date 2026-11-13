import prisma from '../../config/database';

export class CamabaPembayaranService {
  /**
   * Mengambil Rincian Tagihan Pendaftaran & UKT Daftar Ulang
   */
  async getTagihan(userId: number) {
    const pendaftar = await prisma.pendaftar.findUnique({
      where: { userId },
      include: {
        user: true,
        programStudi: true,
        prodiDiterima: true,
        jalurPendaftaran: true,
        gelombang: true,
        periode: true,
      },
    });

    if (!pendaftar) {
      throw new Error('Data pendaftar tidak ditemukan.');
    }

    // Cari nominal biaya formulir dari pembukaan jalur yang sesuai
    const pembukaan = await prisma.pembukaanJalur.findFirst({
      where: {
        periodeId: pendaftar.periodeId,
        gelombangId: pendaftar.gelombangId,
        jalurPendaftaranId: pendaftar.jalurPendaftaranId,
        programStudiId: pendaftar.programStudiId,
      },
    });

    const biayaFormulir = pembukaan?.biayaPendaftaran || 300000;
    const isFormulirLunas = pendaftar.user.isActive;

    const formatRupiah = (val: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(val);
    };

    // Virtual Account simulasi
    const vaNumberFormulir = `8801${pendaftar.noPendaftaran?.replace(/\D/g, '') || pendaftar.id}`;
    const vaNumberUkt = `8802${pendaftar.noPendaftaran?.replace(/\D/g, '') || pendaftar.id}`;

    // Tagihan 1: Biaya Formulir Pendaftaran
    const tagihanFormulir = {
      jenisTagihan: 'BIAYA_FORMULIR',
      namaTagihan: `Biaya Formulir Pendaftaran - Jalur ${pendaftar.jalurPendaftaran.nama}`,
      nominal: biayaFormulir,
      nominalFormatted: formatRupiah(biayaFormulir),
      nomorVirtualAccount: vaNumberFormulir,
      bank: 'Bank Syariah Indonesia (BSI)',
      namaPenerima: 'Universitas Ibn Khaldun PMB',
      statusBayar: isFormulirLunas ? 'LUNAS' : 'BELUM_BAYAR',
      isLunas: isFormulirLunas,
      keterangan: isFormulirLunas
        ? 'Pembayaran formulir telah diverifikasi. Akun pendaftaran aktif.'
        : 'Silakan lakukan pembayaran untuk mengaktifkan akun dan melengkapi biodata.',
    };

    // Tagihan 2: Biaya Daftar Ulang / UKT (Hanya aktif jika sudah LULUS)
    const isLulus = pendaftar.statusKelulusan === 'LULUS';
    const prodiAktif = pendaftar.prodiDiterima || pendaftar.programStudi;
    const nominalUkt = pendaftar.nominalUkt || prodiAktif.biayaKuliah || 5000000;
    const isUktLunas = pendaftar.isDaftarUlang;

    const tagihanDaftarUlang = {
      jenisTagihan: 'BIAYA_DAFTAR_ULANG_UKT',
      namaTagihan: `Biaya Kuliah Awal (UKT Semester 1) - ${prodiAktif.namaProdi}`,
      nominal: nominalUkt,
      nominalFormatted: formatRupiah(nominalUkt),
      kelompokUkt: pendaftar.kelompokUkt || 'UKT Reguler',
      isKip: pendaftar.isKip,
      nomorVirtualAccount: vaNumberUkt,
      bank: 'Bank Syariah Indonesia (BSI)',
      namaPenerima: 'Universitas Ibn Khaldun Registrasi Ulang',
      statusBayar: isUktLunas ? 'LUNAS' : isLulus ? 'BELUM_BAYAR' : 'MENUNGGU_PENGUMUMAN_LULUS',
      isLunas: isUktLunas,
      isTersedia: isLulus,
      keterangan: isUktLunas
        ? 'Daftar ulang berhasil. Anda telah resmi terdaftar sebagai mahasiswa baru.'
        : isLulus
        ? 'Selamat Anda dinyatakan lulus! Silakan lakukan daftar ulang sebelum batas waktu.'
        : 'Tagihan daftar ulang akan terbit setelah pengumuman kelulusan.',
    };

    return {
      pendaftarId: pendaftar.id,
      noPendaftaran: pendaftar.noPendaftaran,
      namaCamaba: pendaftar.user.nama,
      email: pendaftar.user.email,
      daftarTagihan: [tagihanFormulir, ...(isLulus ? [tagihanDaftarUlang] : [])],
      instruksiPembayaran: [
        '1. Masukkan Kartu ATM BSI dan PIN Anda, atau buka aplikasi BSI Mobile.',
        '2. Pilih menu Pembayaran / Bayar > Akademik / Universitas.',
        '3. Masukkan Kode Institusi UIKA (1001) diikuti Nomor Virtual Account di atas.',
        '4. Periksa detail nama dan nominal, kemudian konfirmasi pembayaran.',
        '5. Status pembayaran di portal PMB akan otomatis terupdate dalam 1-3 menit.',
      ],
    };
  }

  /**
   * Simulasi Pembayaran Tagihan (Sangat bermanfaat untuk Postman / Dev Testing)
   */
  async simulasiBayar(userId: number, jenisTagihan: 'FORMULIR' | 'DAFTAR_ULANG') {
    const pendaftar = await prisma.pendaftar.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!pendaftar) {
      throw new Error('Data pendaftar tidak ditemukan.');
    }

    if (jenisTagihan === 'FORMULIR') {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
      });

      return {
        success: true,
        message: 'Pembayaran formulir pendaftaran berhasil disimulasikan! Akun kini aktif.',
        statusBayar: 'LUNAS',
        jenisTagihan,
      };
    } else if (jenisTagihan === 'DAFTAR_ULANG') {
      const updated = await prisma.pendaftar.update({
        where: { userId },
        data: {
          isDaftarUlang: true,
          tanggalDaftarUlang: new Date(),
          statusOds: 'DAFTAR_ULANG',
        },
      });

      return {
        success: true,
        message: 'Pembayaran daftar ulang (UKT) berhasil disimulasikan! Status Camaba kini Daftar Ulang.',
        statusBayar: 'LUNAS',
        jenisTagihan,
        data: updated,
      };
    } else {
      throw new Error("Jenis tagihan tidak valid. Gunakan 'FORMULIR' atau 'DAFTAR_ULANG'.");
    }
  }
}

export const camabaPembayaranService = new CamabaPembayaranService();

