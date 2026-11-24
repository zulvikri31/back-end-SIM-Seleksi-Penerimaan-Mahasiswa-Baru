/**
 * Service Notifikasi WhatsApp SPMB UIKA
 * Mendukung pengiriman pesan dinamis verifikasi berkas ODS (Diterima, Ditolak, Perlu Perbaikan, Diproses),
 * format pesan otomatis berbasis catatan admin, link wa.me/api.whatsapp.com, serta integrasi gateway (Fonnte/Wablas/Webhook).
 */

export interface BerkasNotifikasiItem {
  id?: number;
  jenisBerkas: string;
  namaBerkas?: string;
  isWajib?: boolean;
  statusVerifikasi: string; // 'DITERIMA' | 'DITOLAK' | 'PERLU_PERBAIKAN' | 'DIPROSES' | 'MENUNGGU'
  catatan?: string | null;
}

export interface PendaftarNotifikasiInfo {
  id: number;
  noPendaftaran?: string | null;
  nama: string;
  noHp?: string | null;
  email?: string | null;
  periode?: string | null;
  jalur?: string | null;
  prodi?: string | null;
  gelombang?: string | null;
  sistemKuliah?: string | null;
}

export class WhatsappService {
  /**
   * Normalisasi nomor telepon ke format internasional Indonesia (628xxxxxxxx)
   */
  formatIndonesianPhone(phone?: string | null): string | null {
    if (!phone) return null;
    let clean = phone.replace(/[^0-9]/g, '');
    if (!clean) return null;

    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    } else if (clean.startsWith('8')) {
      clean = '62' + clean;
    } else if (clean.startsWith('62')) {
      // already valid
    }

    return clean;
  }

  /**
   * Generate teks pesan WhatsApp otomatis berdasarkan status dan catatan berkas yang diunggah
   */
  generateVerifikasiMessage(pendaftar: PendaftarNotifikasiInfo, berkasList: BerkasNotifikasiItem[], portalUrl?: string): {
    pesan: string;
    tipeNotifikasi: 'PERLU_PERBAIKAN' | 'DITOLAK' | 'DITERIMA' | 'DIPROSES';
    totalBerkas: number;
    totalPerluPerbaikan: number;
    totalDitolak: number;
    totalDiterima: number;
  } {
    const portal = portalUrl || process.env.FRONTEND_URL || 'https://spmb.uika-bogor.ac.id/login';

    const normaliseStatus = (st: string) => {
      const s = (st || '').toUpperCase().trim();
      if (s.includes('TOLAK')) return 'DITOLAK';
      if (s.includes('PERBAIK') || s.includes('TANGGUH')) return 'PERLU_PERBAIKAN';
      if (s.includes('TERIMA') || s.includes('SESUAI')) return 'DITERIMA';
      return 'DIPROSES';
    };

    const perluPerbaikanItems = berkasList.filter((b) => normaliseStatus(b.statusVerifikasi) === 'PERLU_PERBAIKAN');
    const ditolakItems = berkasList.filter((b) => normaliseStatus(b.statusVerifikasi) === 'DITOLAK');
    const diterimaItems = berkasList.filter((b) => normaliseStatus(b.statusVerifikasi) === 'DITERIMA');
    const diprosesItems = berkasList.filter((b) => normaliseStatus(b.statusVerifikasi) === 'DIPROSES');

    let tipeNotifikasi: 'PERLU_PERBAIKAN' | 'DITOLAK' | 'DITERIMA' | 'DIPROSES' = 'DITERIMA';
    if (ditolakItems.length > 0) {
      tipeNotifikasi = 'DITOLAK';
    } else if (perluPerbaikanItems.length > 0) {
      tipeNotifikasi = 'PERLU_PERBAIKAN';
    } else if (diprosesItems.length > 0 && diterimaItems.length === 0) {
      tipeNotifikasi = 'DIPROSES';
    }

    const lines: string[] = [];

    // Header Resmi
    lines.push('🏛️ *UNIVERSITAS IBN KHALDUN (UIKA) BOGOR*');
    lines.push('📋 *Pemberitahuan Verifikasi Berkas One Day Service (ODS)*');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push(`Yth. Calon Mahasiswa: *${pendaftar.nama.toUpperCase()}*`);
    if (pendaftar.noPendaftaran) {
      lines.push(`No. Pendaftaran: *${pendaftar.noPendaftaran}*`);
    }
    if (pendaftar.prodi) {
      lines.push(`Program Studi: *${pendaftar.prodi}*`);
    }
    if (pendaftar.jalur || pendaftar.periode) {
      lines.push(`Jalur / Periode: *${[pendaftar.jalur, pendaftar.periode].filter(Boolean).join(' - ')}*`);
    }
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('');

    // Skenario 1: Terdapat Berkas yang Ditolak atau Perlu Perbaikan
    if (ditolakItems.length > 0 || perluPerbaikanItems.length > 0) {
      lines.push('Halo Sdr/i *' + pendaftar.nama + '*,');
      lines.push('Tim Panitia One Day Service (ODS) SPMB UIKA Bogor telah memeriksa berkas pendaftaran Anda.');
      lines.push('');
      lines.push('⚠️ *STATUS: MEMERLUKAN PERBAIKAN / DITANGGUHKAN*');
      lines.push('Mohon perhatian, beberapa dokumen berikut belum memenuhi ketentuan dan wajib diperbaiki:');
      lines.push('');

      let nomor = 1;
      // Tampilkan yang ditolak
      for (const item of ditolakItems) {
        const nama = item.namaBerkas || item.jenisBerkas;
        const wajibTag = item.isWajib ? ' (Wajib)' : '';
        lines.push(`${nomor++}. ❌ *${nama}*${wajibTag}`);
        lines.push(`   ↳ Status: *Ditolak*`);
        if (item.catatan && item.catatan.trim() !== '') {
          lines.push(`   ↳ *Catatan Admin:* "${item.catatan.trim()}"`);
        } else {
          lines.push(`   ↳ *Catatan Admin:* Dokumen tidak sesuai ketentuan, mohon unggah ulang dokumen yang benar.`);
        }
        lines.push('');
      }

      // Tampilkan yang perlu perbaikan
      for (const item of perluPerbaikanItems) {
        const nama = item.namaBerkas || item.jenisBerkas;
        const wajibTag = item.isWajib ? ' (Wajib)' : '';
        lines.push(`${nomor++}. ⚠️ *${nama}*${wajibTag}`);
        lines.push(`   ↳ Status: *Perlu Perbaikan (Ditangguhkan)*`);
        if (item.catatan && item.catatan.trim() !== '') {
          lines.push(`   ↳ *Catatan Admin:* "${item.catatan.trim()}"`);
        } else {
          lines.push(`   ↳ *Catatan Admin:* Dokumen kurang jelas / terpotong, silakan unggah kembali.`);
        }
        lines.push('');
      }

      // Tampilkan ringkasan yang sudah diterima
      if (diterimaItems.length > 0) {
        lines.push('✅ *Dokumen yang sudah diverifikasi & diterima:*');
        for (const item of diterimaItems) {
          const nama = item.namaBerkas || item.jenisBerkas;
          lines.push(`  • ${nama}: *Sesuai (Diterima)*`);
        }
        lines.push('');
      }

      lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      lines.push('📌 *PETUNJUK PERBAIKAN DOKUMEN:*');
      lines.push('1. Masuk ke Portal SPMB UIKA:');
      lines.push(`   👉 ${portal}`);
      lines.push('2. Buka menu *Upload Berkas / Verifikasi Berkas*.');
      lines.push('3. Perbaiki file sesuai catatan admin di atas lalu unggah ulang.');
      lines.push('4. Simpan perubahan agar panitia dapat segera memverifikasi kembali.');
      lines.push('');
      lines.push('💡 _Layanan ODS memproses berkas Anda secara cepat setelah dokumen diperbaiki._');
    }
    // Skenario 2: Semua Berkas Diterima
    else if (diterimaItems.length > 0 && diprosesItems.length === 0) {
      lines.push('Halo Sdr/i *' + pendaftar.nama + '*,');
      lines.push('Kabar gembira! Seluruh dokumen administrasi pendaftaran Anda telah berhasil diverifikasi oleh Tim One Day Service (ODS) SPMB UIKA Bogor.');
      lines.push('');
      lines.push('🎉 *STATUS: BERKAS LENGKAP & DITERIMA (VERIFIED)*');
      lines.push('');
      lines.push('Daftar berkas yang telah disetujui:');
      for (const item of diterimaItems) {
        const nama = item.namaBerkas || item.jenisBerkas;
        lines.push(`  • ${nama}: ✅ *Diterima*`);
      }
      lines.push('');
      lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      lines.push('📌 *TAHAPAN SELANJUTNYA:*');
      lines.push('Silakan login ke Portal SPMB UIKA untuk melanjutkan tahapan pendaftaran:');
      lines.push(`👉 ${portal}`);
      lines.push('• Cetak Kartu Peserta Ujian / Seleksi (CBT)');
      lines.push('• Memeriksa jadwal seleksi / wawancara prodi');
      lines.push('• Menyiapkan tahapan registrasi ulang');
      lines.push('');
      lines.push('Selamat dan sukses atas proses pendaftaran Anda di UIKA Bogor!');
    }
    // Skenario 3: Masih dalam proses
    else {
      lines.push('Halo Sdr/i *' + pendaftar.nama + '*,');
      lines.push('Berkas pendaftaran Anda saat ini sedang dalam proses peninjauan oleh Tim One Day Service (ODS) SPMB UIKA.');
      lines.push('');
      lines.push('⏳ *STATUS: SEDANG DIPROSES*');
      lines.push('Panitia kami sedang melakukan pencocokan data dokumen yang Anda unggah. Anda akan menerima notifikasi kembali jika ada berkas yang memerlukan penyesuaian.');
      lines.push('');
      lines.push(`Cek progres berkas secara mandiri di: ${portal}`);
    }

    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('Apabila ada pertanyaan, silakan hubungi Layanan Helpdesk SPMB UIKA Bogor.');
    lines.push('Salam hangat,');
    lines.push('*Panitia SPMB Universitas Ibn Khaldun Bogor*');
    lines.push('_Jl. KH. Sholeh Iskandar Km. 2, Kota Bogor 16162_');

    return {
      pesan: lines.join('\n'),
      tipeNotifikasi,
      totalBerkas: berkasList.length,
      totalPerluPerbaikan: perluPerbaikanItems.length,
      totalDitolak: ditolakItems.length,
      totalDiterima: diterimaItems.length,
    };
  }

  /**
   * Generate teks notifikasi WhatsApp untuk Calon Mahasiswa pada tahap Daftar Ulang ODS
   */
  generateDaftarUlangMessage(
    pendaftar: PendaftarNotifikasiInfo,
    portalUrl?: string
  ): {
    pesan: string;
    tipeNotifikasi: string;
    waLink: string | null;
  } {
    const portal = portalUrl || process.env.FRONTEND_URL || 'https://spmb.uika-bogor.ac.id/login';
    const lines: string[] = [];

    lines.push('🏛️ *UNIVERSITAS IBN KHALDUN (UIKA) BOGOR*');
    lines.push('🎓 *Pemberitahuan Verifikasi Administrasi Daftar Ulang (ODS)*');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push(`Yth. Calon Mahasiswa: *${pendaftar.nama.toUpperCase()}*`);
    if (pendaftar.noPendaftaran) {
      lines.push(`No. Pendaftaran: *${pendaftar.noPendaftaran}*`);
    }
    if (pendaftar.prodi) {
      lines.push(`Program Studi Diterima: *${pendaftar.prodi}*`);
    }
    if (pendaftar.jalur || pendaftar.periode) {
      lines.push(`Jalur / Periode: *${[pendaftar.jalur, pendaftar.periode].filter(Boolean).join(' - ')}*`);
    }
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push(`Halo Sdr/i *${pendaftar.nama}*,`);
    lines.push('Alhamdulillah, berkas administrasi dan data pendaftaran Anda pada tahap *Daftar Ulang* telah berhasil diverifikasi oleh Tim One Day Service (ODS) SPMB UIKA Bogor.');
    lines.push('');
    lines.push('✅ *STATUS: ADMINISTRASI DAFTAR ULANG TERVERIFIKASI*');
    lines.push('');
    lines.push('Silakan login ke Portal SPMB UIKA untuk menyelesaikan prosedur registrasi ulang dan pembayaran her-registrasi:');
    lines.push(`👉 ${portal}`);
    lines.push('');
    lines.push('📌 *LANGKAH SELANJUTNYA:*');
    lines.push('1. Mengunduh Surat Keterangan Lulus (SKL) / Bukti Penerimaan Mahasiswa Baru');
    lines.push('2. Melakukan Pembayaran Biaya Kuliah / UKT Registrasi Ulang');
    lines.push('3. Memperoleh Nomor Induk Mahasiswa (NIM) Resmi');
    lines.push('4. Mengikuti Pengenalan Kehidupan Kampus Mahasiswa Baru (PKKMB) UIKA');
    lines.push('');
    lines.push('Selamat bergabung menjadi bagian dari Sivitas Akademika Universitas Ibn Khaldun Bogor!');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('Salam hangat,');
    lines.push('*Panitia SPMB Universitas Ibn Khaldun Bogor*');
    lines.push('_Jl. KH. Sholeh Iskandar Km. 2, Kota Bogor 16162_');

    const pesan = lines.join('\n');
    const waLink = pendaftar.noHp ? this.generateWaLink(pendaftar.noHp, pesan) : null;

    return {
      pesan,
      tipeNotifikasi: 'DAFTAR_ULANG_TERVERIFIKASI',
      waLink,
    };
  }

  /**
   * Membuat tautan WhatsApp Click-to-Chat (wa.me / api.whatsapp.com)
   */
  generateWaLink(phone: string, message: string): string {
    const formatted = this.formatIndonesianPhone(phone) || phone;
    return `https://api.whatsapp.com/send?phone=${formatted}&text=${encodeURIComponent(message)}`;
  }

  /**
   * Generate teks pesan WhatsApp pengingat untuk calon mahasiswa yang statusnya "Belum Finalisasi"
   */
  generateReminderBelumFinalisasiMessage(
    pendaftar: PendaftarNotifikasiInfo,
    berkasKurang?: string[],
    portalUrl?: string
  ): {
    pesan: string;
    tujuanNoHp: string | null;
    waLink: string | null;
  } {
    const portal = portalUrl || process.env.FRONTEND_URL || 'https://spmb.uika-bogor.ac.id/login';
    const lines: string[] = [];

    lines.push('🏛️ *UNIVERSITAS IBN KHALDUN (UIKA) BOGOR*');
    lines.push('📋 *Pengingat Kelengkapan Berkas Pendaftaran (One Day Service)*');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push(`Yth. Calon Mahasiswa: *${pendaftar.nama.toUpperCase()}*`);
    if (pendaftar.noPendaftaran) {
      lines.push(`No. Pendaftaran: *${pendaftar.noPendaftaran}*`);
    }
    if (pendaftar.prodi) {
      lines.push(`Program Studi Pilihan: *${pendaftar.prodi}*`);
    }
    if (pendaftar.jalur || pendaftar.periode) {
      lines.push(`Jalur / Periode: *${[pendaftar.jalur, pendaftar.periode].filter(Boolean).join(' - ')}*`);
    }
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push(`Halo Sdr/i *${pendaftar.nama}*,`);
    lines.push('Terima kasih telah memulai pendaftaran di Universitas Ibn Khaldun (UIKA) Bogor.');
    lines.push('');
    lines.push('⚠️ *STATUS PENDAFTARAN: BELUM FINALISASI*');
    lines.push('Panitia One Day Service (ODS) SPMB UIKA menginformasikan bahwa berkas dan biodata pendaftaran Anda saat ini *belum difinalisasi*.');
    lines.push('');

    if (berkasKurang && berkasKurang.length > 0) {
      lines.push('Dokumen persyaratan yang belum lengkap:');
      for (const b of berkasKurang) {
        lines.push(`  • ${b}: _Belum diunggah_`);
      }
      lines.push('');
    }

    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('📌 *PETUNJUK PENYELESAIAN PENDAFTARAN:*');
    lines.push('1. Masuk ke Portal SPMB UIKA:');
    lines.push(`   👉 ${portal}`);
    lines.push('2. Lengkapi isian biodata diri & unggah berkas persyaratan.');
    lines.push('3. Periksa kembali seluruh data Anda.');
    lines.push('4. Klik tombol *FINALISASI DATA* agar pendaftaran Anda dapat segera diverifikasi oleh tim panitia ODS.');
    lines.push('');
    lines.push('💡 _Segera finalisasi data Anda sebelum masa gelombang pendaftaran berakhir._');
    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('Jika Anda mengalami kendala saat pengisian formulir, silakan balas pesan ini. Tim ODS UIKA siap membantu Anda!');
    lines.push('Salam hangat,');
    lines.push('*Panitia SPMB Universitas Ibn Khaldun Bogor*');
    lines.push('_Jl. KH. Sholeh Iskandar Km. 2, Kota Bogor 16162_');

    const pesan = lines.join('\n');
    const waLink = pendaftar.noHp ? this.generateWaLink(pendaftar.noHp, pesan) : null;

    return {
      pesan,
      tujuanNoHp: pendaftar.noHp || null,
      waLink,
    };
  }

  /**
   * Generate teks pesan WhatsApp Pengumuman Kelulusan Seleksi (Lulus / Tidak Lulus)
   */
  generatePengumumanKelulusanMessage(
    pendaftar: PendaftarNotifikasiInfo,
    statusKelulusan: 'LULUS' | 'TIDAK_LULUS',
    prodiDiterimaNama?: string,
    portalUrl?: string
  ): {
    pesan: string;
    tujuanNoHp: string | null;
    waLink: string | null;
  } {
    const portal = portalUrl || process.env.FRONTEND_URL || 'https://spmb.uika-bogor.ac.id/login';
    const lines: string[] = [];

    lines.push('🏛️ *UNIVERSITAS IBN KHALDUN (UIKA) BOGOR*');
    lines.push('🎓 *Pengumuman Hasil Seleksi Penerimaan Mahasiswa Baru (ODS)*');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push(`Yth. Calon Mahasiswa: *${pendaftar.nama.toUpperCase()}*`);
    if (pendaftar.noPendaftaran) {
      lines.push(`No. Pendaftaran: *${pendaftar.noPendaftaran}*`);
    }
    if (pendaftar.jalur || pendaftar.periode) {
      lines.push(`Jalur / Periode: *${[pendaftar.jalur, pendaftar.periode].filter(Boolean).join(' - ')}*`);
    }
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('');

    if (statusKelulusan === 'LULUS') {
      lines.push(`Selamat Sdr/i *${pendaftar.nama}*!`);
      lines.push('Berdasarkan hasil evaluasi seleksi Panitia Penerimaan Mahasiswa Baru UIKA Bogor, Anda dinyatakan:');
      lines.push('');
      lines.push('🎉 *LULUS SELEKSI MAHASISWA BARU* 🎉');
      lines.push(`Program Studi Diterima: *${prodiDiterimaNama || pendaftar.prodi || 'Program Studi Pilihan'}*`);
      lines.push('');
      lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      lines.push('📌 *TAHAPAN REGISTRASI & DAFTAR ULANG:*');
      lines.push('1. Masuk ke Portal SPMB UIKA:');
      lines.push(`   👉 ${portal}`);
      lines.push('2. Unduh Surat Keputusan Kelulusan resmi.');
      lines.push('3. Lakukan pembayaran Biaya Kuliah / Daftar Ulang sesuai nomor Virtual Account di portal.');
      lines.push('4. Lengkapi berkas daftar ulang untuk penerbitan Nomor Induk Mahasiswa (NIM).');
      lines.push('');
      lines.push('Selamat bergabung menjadi bagian dari Sivitas Akademika Universitas Ibn Khaldun Bogor!');
    } else {
      lines.push(`Halo Sdr/i *${pendaftar.nama}*,`);
      lines.push('Terima kasih telah mengikuti rangkaian seleksi One Day Service di Universitas Ibn Khaldun (UIKA) Bogor.');
      lines.push('');
      lines.push('Berdasarkan hasil evaluasi nilai seleksi dan kuota program studi yang tersedia, saat ini pendaftaran Anda dinyatakan *Belum Memenuhi Kriteria Kelulusan*.');
      lines.push('');
      lines.push('Tetap semangat! Anda masih dapat mendaftar kembali pada gelombang berikutnya atau memilih program studi alternatif melalui portal:');
      lines.push(`👉 ${portal}`);
    }

    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('Apabila ada pertanyaan, silakan hubungi Layanan Helpdesk SPMB UIKA Bogor.');
    lines.push('Salam hangat,');
    lines.push('*Panitia SPMB Universitas Ibn Khaldun Bogor*');
    lines.push('_Jl. KH. Sholeh Iskandar Km. 2, Kota Bogor 16162_');

    const pesan = lines.join('\n');
    const waLink = pendaftar.noHp ? this.generateWaLink(pendaftar.noHp, pesan) : null;

    return {
      pesan,
      tujuanNoHp: pendaftar.noHp || null,
      waLink,
    };
  }

  /**
   * Mengirim notifikasi melalui WhatsApp Gateway eksternal jika terkonfigurasi (Fonnte / Webhook)
   */
  async kirimPesanGateway(phone: string, message: string): Promise<{
    sent: boolean;
    provider: string;
    response?: any;
    error?: string;
  }> {
    const target = this.formatIndonesianPhone(phone);
    if (!target) {
      return { sent: false, provider: 'NONE', error: 'Nomor WhatsApp tidak valid atau kosong.' };
    }

    // 1. Dukungan Fonnte (process.env.FONNTE_TOKEN)
    const fonnteToken = process.env.FONNTE_TOKEN;
    if (fonnteToken && fonnteToken.trim() !== '') {
      try {
        const res = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            Authorization: fonnteToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            target,
            message,
            countryCode: '62',
          }),
        });
        const json = await res.json();
        return { sent: res.ok, provider: 'FONNTE', response: json };
      } catch (err: any) {
        return { sent: false, provider: 'FONNTE', error: err.message };
      }
    }

    // 2. Dukungan Custom Webhook / WA Gateway (process.env.WA_GATEWAY_URL)
    const gatewayUrl = process.env.WA_GATEWAY_URL;
    if (gatewayUrl && gatewayUrl.trim() !== '') {
      try {
        const res = await fetch(gatewayUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.WA_GATEWAY_TOKEN ? { Authorization: `Bearer ${process.env.WA_GATEWAY_TOKEN}` } : {}),
          },
          body: JSON.stringify({
            phone: target,
            target,
            message,
          }),
        });
        const json = await res.json();
        return { sent: res.ok, provider: 'CUSTOM_GATEWAY', response: json };
      } catch (err: any) {
        return { sent: false, provider: 'CUSTOM_GATEWAY', error: err.message };
      }
    }

    // 3. Jika tidak ada gateway terkonfigurasi, sistem mengandalkan direct WA link
    return {
      sent: false,
      provider: 'DIRECT_LINK',
      error: 'WhatsApp Gateway belum dikonfigurasi di .env (dapat menggunakan link wa.me).',
    };
  }
}

export const whatsappService = new WhatsappService();
