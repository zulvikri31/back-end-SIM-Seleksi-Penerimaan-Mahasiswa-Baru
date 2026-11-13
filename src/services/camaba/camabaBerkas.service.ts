import prisma from '../../config/database';

export class CamabaBerkasService {
  /**
   * Mengambil daftar berkas administrasi yang diunggah oleh pendaftar
   */
  async getBerkasList(userId: number) {
    const pendaftar = await prisma.pendaftar.findUnique({
      where: { userId },
      include: {
        berkas: true,
      },
    });

    if (!pendaftar) {
      throw new Error('Data pendaftar tidak ditemukan.');
    }

    const daftarJenisWajib = [
      { kode: 'PAS_FOTO', nama: 'Pas Foto Terbaru (Latar Merah / Biru)', format: 'JPG, PNG (Maks 5 MB)', wajib: true },
      { kode: 'KTP', nama: 'Kartu Tanda Penduduk (KTP / Surat Ket. Domisili)', format: 'PDF, JPG (Maks 5 MB)', wajib: true },
      { kode: 'KARTU_KELUARGA', nama: 'Kartu Keluarga (KK)', format: 'PDF, JPG (Maks 5 MB)', wajib: true },
      { kode: 'IJAZAH', nama: 'Ijazah / Surat Keterangan Lulus (SKL)', format: 'PDF, JPG (Maks 5 MB)', wajib: true },
      { kode: 'TRANSKRIP', nama: 'Transkrip Nilai / Rapor Terakhir', format: 'PDF (Maks 5 MB)', wajib: false },
      { kode: 'SERTIFIKAT_PRESTASI', nama: 'Sertifikat Prestasi / Portofolio (Opsional)', format: 'PDF (Maks 5 MB)', wajib: false },
    ];

    const berkasUploadedMap = new Map();
    for (const b of pendaftar.berkas) {
      berkasUploadedMap.set(b.jenisBerkas.toUpperCase(), b);
    }

    const checklist = daftarJenisWajib.map((item) => {
      const uploaded = berkasUploadedMap.get(item.kode);
      return {
        ...item,
        isUploaded: Boolean(uploaded),
        berkasId: uploaded ? uploaded.id : null,
        fileUrl: uploaded ? uploaded.fileUrl : null,
        statusVerifikasi: uploaded ? uploaded.statusVerifikasi : 'BELUM_UPLOAD',
      };
    });

    return {
      pendaftarId: pendaftar.id,
      noPendaftaran: pendaftar.noPendaftaran,
      totalDiunggah: pendaftar.berkas.length,
      semuaWajibTerpenuhi: checklist.filter((c) => c.wajib).every((c) => c.isUploaded),
      checklist,
      berkas: pendaftar.berkas,
    };
  }

  /**
   * Unggah / Simpan Berkas Pendaftaran
   */
  async uploadBerkas(
    userId: number,
    data: {
      jenisBerkas: string;
      fileUrl?: string;
      file?: Express.Multer.File;
    }
  ) {
    const pendaftar = await prisma.pendaftar.findUnique({
      where: { userId },
    });

    if (!pendaftar) {
      throw new Error('Data pendaftar tidak ditemukan.');
    }

    if (pendaftar.isFinalisasi) {
      throw new Error('Pendaftaran sudah difinalisasi. Berkas tidak dapat diubah tanpa izin Admin.');
    }

    const jenisBerkas = data.jenisBerkas ? data.jenisBerkas.toUpperCase().trim() : 'DOKUMEN_LAINNYA';

    // File URL: jika ada file upload via multer atau direct URL
    let fileUrl = data.fileUrl;
    if (data.file) {
      fileUrl = `/uploads/camaba/${pendaftar.noPendaftaran}_${jenisBerkas}_${Date.now()}_${data.file.originalname}`;
    }

    if (!fileUrl) {
      throw new Error('File berkas atau link URL berkas wajib disertakan.');
    }

    // Jika jenis berkas ini sudah pernah diunggah, lakukan update (replace)
    const existing = await prisma.berkasPendaftar.findFirst({
      where: {
        pendaftarId: pendaftar.id,
        jenisBerkas,
      },
    });

    let result;
    if (existing) {
      result = await prisma.berkasPendaftar.update({
        where: { id: existing.id },
        data: {
          fileUrl,
          statusVerifikasi: 'MENUNGGU',
        },
      });
    } else {
      result = await prisma.berkasPendaftar.create({
        data: {
          pendaftarId: pendaftar.id,
          jenisBerkas,
          fileUrl,
          statusVerifikasi: 'MENUNGGU',
        },
      });
    }

    return {
      success: true,
      message: `Berkas ${jenisBerkas} berhasil diunggah dan disimpan. Menunggu verifikasi panitia.`,
      data: result,
    };
  }

  /**
   * Hapus Berkas Pendaftaran
   */
  async deleteBerkas(userId: number, berkasId: number) {
    const pendaftar = await prisma.pendaftar.findUnique({
      where: { userId },
    });

    if (!pendaftar) {
      throw new Error('Data pendaftar tidak ditemukan.');
    }

    if (pendaftar.isFinalisasi) {
      throw new Error('Pendaftaran sudah difinalisasi. Berkas tidak dapat dihapus.');
    }

    const berkas = await prisma.berkasPendaftar.findFirst({
      where: { id: berkasId, pendaftarId: pendaftar.id },
    });

    if (!berkas) {
      throw new Error('Berkas tidak ditemukan atau bukan milik akun Anda.');
    }

    if (berkas.statusVerifikasi === 'VALID') {
      throw new Error('Berkas yang sudah diverifikasi VALID oleh Admin tidak dapat dihapus.');
    }

    await prisma.berkasPendaftar.delete({
      where: { id: berkasId },
    });

    return {
      success: true,
      message: `Berkas ${berkas.jenisBerkas} berhasil dihapus.`,
    };
  }
}

export const camabaBerkasService = new CamabaBerkasService();

