import prisma from '../../config/database';

export interface UpdateBiodataCamabaDTO {
  nik?: string;
  jenisKelamin?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  noHp?: string;
  alamat?: string;
  provinsi?: string;
  kabupatenKota?: string;
  asalSekolah?: string;
  jenisPendidikan?: string;
  jurusanPendidikan?: string;
  tahunLulus?: number;
  beratBadan?: number;
  tinggiBadan?: number;
  suku?: string;
  agama?: string;
  kebutuhanKhusus?: string;
  nisn?: string;
  npsn?: string;
  noKk?: string;
  noPaspor?: string;
  telepon?: string;
  ukuranJasAlmamater?: string;
  pemberiRekomendasi?: string;
  pilihanProdi2Id?: number;
  pilihanProdi3Id?: number;
  isFinalisasi?: boolean;
  // Data Riwayat Pendidikan Tinggi / Pekerjaan
  asalPerguruanTinggi?: string;
  namaPerusahaan?: string;
  // Data Orang Tua
  namaAyah?: string;
  pekerjaanAyah?: string;
  pendidikanAyah?: string;
  namaIbu?: string;
  pekerjaanIbu?: string;
  pendidikanIbu?: string;
  penghasilanOrtu?: string;
  noHpOrtu?: string;
}

export class CamabaBiodataService {
  /**
   * Cek Status Pendaftaran & Biodata untuk Camaba yang sedang login
   */
  async getStatusPendaftaranByUserId(userId: number) {
    const pendaftar = await prisma.pendaftar.findUnique({
      where: { userId },
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
        berkas: true,
        orangTua: true,
        nilaiSeleksi: true,
      },
    });

    if (!pendaftar) {
      return null;
    }

    const prodiDiterimaFormatted = pendaftar.prodiDiterima
      ? `${pendaftar.prodiDiterima.jenjang} - ${pendaftar.prodiDiterima.namaProdi}`
      : `${pendaftar.programStudi.jenjang} - ${pendaftar.programStudi.namaProdi}`;

    return {
      noPendaftaran: pendaftar.noPendaftaran,
      nim: pendaftar.nim,
      nama: pendaftar.user.nama,
      email: pendaftar.user.email,
      noHp: pendaftar.noHp,
      nik: pendaftar.nik,
      jenjang: pendaftar.programStudi.jenjang,
      programStudi: pendaftar.programStudi.namaProdi,
      sistemKuliah: pendaftar.sistemKuliah.nama,
      jalurPendaftaran: pendaftar.jalurPendaftaran.nama,
      gelombang: pendaftar.gelombang.nama,
      periode: pendaftar.periode.nama,
      prodiPilihan: {
        pilihan1: pendaftar.programStudi ? `${pendaftar.programStudi.jenjang} - ${pendaftar.programStudi.namaProdi}` : '-',
        pilihan2: pendaftar.pilihanProdi2 ? `${pendaftar.pilihanProdi2.jenjang} - ${pendaftar.pilihanProdi2.namaProdi}` : '-',
        pilihan3: pendaftar.pilihanProdi3 ? `${pendaftar.pilihanProdi3.jenjang} - ${pendaftar.pilihanProdi3.namaProdi}` : '-',
      },
      prodiDiterima: pendaftar.prodiDiterima
        ? {
            id: pendaftar.prodiDiterima.id,
            jenjang: pendaftar.prodiDiterima.jenjang,
            namaProdi: pendaftar.prodiDiterima.namaProdi,
            namaLengkap: prodiDiterimaFormatted,
          }
        : null,
      statusKelulusan: pendaftar.statusKelulusan,
      hasilSeleksi: {
        statusKelulusan: pendaftar.statusKelulusan,
        isLulus: pendaftar.statusKelulusan === 'LULUS',
        ucapanSelamat: `Selamat, ${pendaftar.user.nama}`,
        pesan:
          pendaftar.statusKelulusan === 'LULUS'
            ? `Selamat Anda telah dinyatakan Lulus Seleksi pendaftaran mahasiswa baru ${pendaftar.periode.nama}. Berikut detail hasil seleksi yang telah dilakukan.`
            : pendaftar.statusKelulusan === 'TIDAK_LULUS'
            ? 'Mohon maaf, Anda belum dinyatakan lulus seleksi pada periode ini.'
            : 'Hasil seleksi Anda saat ini masih dalam proses peninjauan.',
        perguruanTinggi: 'Universitas Ibn Khaldun',
        jalurPendaftaran: `JALUR ${pendaftar.jalurPendaftaran.nama} - ${pendaftar.jalurPendaftaran.nama} ${pendaftar.gelombang.nama} (${pendaftar.sistemKuliah.nama})`,
        diterimaDiProdi: prodiDiterimaFormatted,
        cetakLoaUrl: `/api/camaba/loa/download/${pendaftar.noPendaftaran}`,
        langkahPendaftaran: [
          { no: 1, nama: 'Biodata', isCompleted: pendaftar.isBiodataLengkap },
          { no: 2, nama: 'Berkas Administrasi', isCompleted: (pendaftar.berkas?.length || 0) > 0 },
          { no: 3, nama: 'KIP Kuliah', isCompleted: pendaftar.isKip },
          { no: 4, nama: 'Pengumpulan Data', isCompleted: pendaftar.isFinalisasi },
          { no: 5, nama: 'Hasil Seleksi', isCompleted: pendaftar.statusKelulusan === 'LULUS', isActive: true },
          { no: 6, nama: 'Daftar Ulang', isCompleted: pendaftar.isDaftarUlang },
          { no: 7, nama: 'Pengumuman Daftar Ulang', isCompleted: Boolean(pendaftar.nim) },
        ],
      },
      tahapan: {
        isBiodataLengkap: pendaftar.isBiodataLengkap,
        isFinalisasi: pendaftar.isFinalisasi,
        isIkutSeleksi: pendaftar.isIkutSeleksi,
        isDiterima: pendaftar.isDiterima,
        isDaftarUlang: pendaftar.isDaftarUlang,
      },
      biodata: {
        nik: pendaftar.nik,
        jenisKelamin: pendaftar.jenisKelamin,
        tempatLahir: pendaftar.tempatLahir,
        tanggalLahir: pendaftar.tanggalLahir,
        alamat: pendaftar.alamat,
        provinsi: pendaftar.provinsi,
        kabupatenKota: pendaftar.kabupatenKota,
        asalSekolah: pendaftar.asalSekolah,
        jenisPendidikan: pendaftar.jenisPendidikan,
        jurusanPendidikan: pendaftar.jurusanPendidikan,
        tahunLulus: pendaftar.tahunLulus,
        asalPerguruanTinggi: pendaftar.asalPerguruanTinggi,
        namaPerusahaan: pendaftar.namaPerusahaan,
        beratBadan: pendaftar.beratBadan,
        tinggiBadan: pendaftar.tinggiBadan,
        suku: pendaftar.suku,
        agama: pendaftar.agama,
        kebutuhanKhusus: pendaftar.kebutuhanKhusus,
        nisn: pendaftar.nisn,
        npsn: pendaftar.npsn,
        noKk: pendaftar.noKk,
        noPaspor: pendaftar.noPaspor,
        telepon: pendaftar.telepon,
        ukuranJasAlmamater: pendaftar.ukuranJasAlmamater,
        pemberiRekomendasi: pendaftar.pemberiRekomendasi,
      },
      orangTua: pendaftar.orangTua,
      berkas: pendaftar.berkas,
      nilaiSeleksi: pendaftar.nilaiSeleksi,
      tanggalDaftar: pendaftar.createdAt,
    };
  }

  /**
   * Update Biodata Camaba (Profil pribadi, domisili, sekolah, prodi pilihan 2 & 3, data orang tua)
   */
  async updateBiodata(userId: number, data: UpdateBiodataCamabaDTO) {
    const pendaftar = await prisma.pendaftar.findUnique({
      where: { userId },
    });

    if (!pendaftar) {
      throw new Error('Data pendaftar tidak ditemukan untuk akun ini.');
    }

    if (pendaftar.isFinalisasi && !data.isFinalisasi) {
      throw new Error('Data pendaftaran sudah difinalisasi dan tidak dapat diubah lagi. Hubungi Admin jika ingin mengajukan revisi.');
    }

    const updated = await prisma.pendaftar.update({
      where: { userId },
      data: {
        nik: data.nik !== undefined ? data.nik : pendaftar.nik,
        jenisKelamin: data.jenisKelamin !== undefined ? data.jenisKelamin : pendaftar.jenisKelamin,
        tempatLahir: data.tempatLahir !== undefined ? data.tempatLahir : pendaftar.tempatLahir,
        tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir) : pendaftar.tanggalLahir,
        noHp: data.noHp !== undefined ? data.noHp : pendaftar.noHp,
        alamat: data.alamat !== undefined ? data.alamat : pendaftar.alamat,
        provinsi: data.provinsi !== undefined ? data.provinsi : pendaftar.provinsi,
        kabupatenKota: data.kabupatenKota !== undefined ? data.kabupatenKota : pendaftar.kabupatenKota,
        asalSekolah: data.asalSekolah !== undefined ? data.asalSekolah : pendaftar.asalSekolah,
        jenisPendidikan: data.jenisPendidikan !== undefined ? data.jenisPendidikan : pendaftar.jenisPendidikan,
        jurusanPendidikan: data.jurusanPendidikan !== undefined ? data.jurusanPendidikan : pendaftar.jurusanPendidikan,
        tahunLulus: data.tahunLulus !== undefined ? Number(data.tahunLulus) : pendaftar.tahunLulus,
        asalPerguruanTinggi: data.asalPerguruanTinggi !== undefined ? data.asalPerguruanTinggi : pendaftar.asalPerguruanTinggi,
        namaPerusahaan: data.namaPerusahaan !== undefined ? data.namaPerusahaan : pendaftar.namaPerusahaan,
        beratBadan: data.beratBadan !== undefined ? Number(data.beratBadan) : pendaftar.beratBadan,
        tinggiBadan: data.tinggiBadan !== undefined ? Number(data.tinggiBadan) : pendaftar.tinggiBadan,
        suku: data.suku !== undefined ? data.suku : pendaftar.suku,
        agama: data.agama !== undefined ? data.agama : pendaftar.agama,
        kebutuhanKhusus: data.kebutuhanKhusus !== undefined ? data.kebutuhanKhusus : pendaftar.kebutuhanKhusus,
        nisn: data.nisn !== undefined ? data.nisn : pendaftar.nisn,
        npsn: data.npsn !== undefined ? data.npsn : pendaftar.npsn,
        noKk: data.noKk !== undefined ? data.noKk : pendaftar.noKk,
        noPaspor: data.noPaspor !== undefined ? data.noPaspor : pendaftar.noPaspor,
        telepon: data.telepon !== undefined ? data.telepon : pendaftar.telepon,
        ukuranJasAlmamater: data.ukuranJasAlmamater !== undefined ? data.ukuranJasAlmamater : pendaftar.ukuranJasAlmamater,
        pemberiRekomendasi: data.pemberiRekomendasi !== undefined ? data.pemberiRekomendasi : pendaftar.pemberiRekomendasi,
        pilihanProdi2Id:
          data.pilihanProdi2Id !== undefined
            ? data.pilihanProdi2Id
              ? Number(data.pilihanProdi2Id)
              : null
            : pendaftar.pilihanProdi2Id,
        pilihanProdi3Id:
          data.pilihanProdi3Id !== undefined
            ? data.pilihanProdi3Id
              ? Number(data.pilihanProdi3Id)
              : null
            : pendaftar.pilihanProdi3Id,
        isFinalisasi: data.isFinalisasi !== undefined ? Boolean(data.isFinalisasi) : pendaftar.isFinalisasi,
        statusPendaftar: data.isFinalisasi ? 'SUDAH_FINALISASI' : pendaftar.statusPendaftar,
        tanggalFinalisasi: data.isFinalisasi ? new Date() : pendaftar.tanggalFinalisasi,
        isBiodataLengkap: true,
      },
    });

    // Simpan Data Orang Tua jika disertakan
    if (
      data.namaAyah ||
      data.pekerjaanAyah ||
      data.pendidikanAyah ||
      data.namaIbu ||
      data.pekerjaanIbu ||
      data.pendidikanIbu ||
      data.penghasilanOrtu ||
      data.noHpOrtu
    ) {
      await prisma.orangTua.upsert({
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

    return updated;
  }

  /**
   * Finalisasi Berkas & Data Pendaftaran (Mengunci formulir)
   */
  async finalisasiPendaftaran(userId: number) {
    const pendaftar = await prisma.pendaftar.findUnique({
      where: { userId },
    });

    if (!pendaftar) {
      throw new Error('Data pendaftar tidak ditemukan.');
    }

    if (pendaftar.isFinalisasi) {
      return {
        success: true,
        message: 'Data pendaftaran sudah difinalisasi sebelumnya.',
        data: pendaftar,
      };
    }

    const updated = await prisma.pendaftar.update({
      where: { userId },
      data: {
        isFinalisasi: true,
        statusPendaftar: 'SUDAH_FINALISASI',
        tanggalFinalisasi: new Date(),
      },
    });

    return {
      success: true,
      message: 'Finalisasi pendaftaran berhasil. Data Anda telah dikunci untuk proses seleksi.',
      data: updated,
    };
  }
}

export const camabaBiodataService = new CamabaBiodataService();
