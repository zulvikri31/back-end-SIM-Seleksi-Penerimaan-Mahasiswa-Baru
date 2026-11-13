import prisma from '../../config/database';

export interface RekamMedisDTO {
  golonganDarah?: string;
  rhesus?: string;
  tinggiBadan?: number;
  beratBadan?: number;
  riwayatPenyakit?: string;
  riwayatAlergi?: string;
  statusButaWarna?: string;
  isBerkacamata?: boolean;
  isMerokok?: boolean;
  riwayatOperasi?: string;
  riwayatRawatInap?: string;
  kebutuhanKhusus?: string;
  kontakDaruratNama?: string;
  kontakDaruratHubungan?: string;
  kontakDaruratNoHp?: string;
  fileSuratKesehatan?: string;
  fileBebasNarkoba?: string;
  catatanKesehatan?: string;
}

export class CamabaRekamMedisService {
  /**
   * Mengambil Data Rekam Medis Calon Mahasiswa yang sedang Login
   */
  async getRekamMedisByUserId(userId: number) {
    const pendaftar = await prisma.pendaftar.findUnique({
      where: { userId },
      include: {
        rekamMedis: true,
        user: { select: { id: true, nama: true, email: true } },
      },
    });

    if (!pendaftar) {
      throw new Error('Data pendaftaran calon mahasiswa tidak ditemukan.');
    }

    return {
      pendaftarId: pendaftar.id,
      noPendaftaran: pendaftar.noPendaftaran,
      nama: pendaftar.user.nama,
      email: pendaftar.user.email,
      rekamMedis: pendaftar.rekamMedis || null,
    };
  }

  /**
   * Simpan / Perbarui Rekam Medis Calon Mahasiswa (Format Kuesioner Kesehatan)
   */
  async upsertRekamMedis(userId: number, data: RekamMedisDTO) {
    const pendaftar = await prisma.pendaftar.findUnique({
      where: { userId },
    });

    if (!pendaftar) {
      throw new Error('Data pendaftaran calon mahasiswa tidak ditemukan.');
    }

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
        isBerkacamata: data.isBerkacamata !== undefined ? Boolean(data.isBerkacamata) : false,
        isMerokok: data.isMerokok !== undefined ? Boolean(data.isMerokok) : false,
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
    });

    // Update juga beratBadan & tinggiBadan di data profil pendaftar agar sinkron
    if (data.beratBadan || data.tinggiBadan) {
      await prisma.pendaftar.update({
        where: { id: pendaftar.id },
        data: {
          beratBadan: data.beratBadan !== undefined ? Number(data.beratBadan) : pendaftar.beratBadan,
          tinggiBadan: data.tinggiBadan !== undefined ? Number(data.tinggiBadan) : pendaftar.tinggiBadan,
        },
      });
    }

    return rekamMedis;
  }
}

export const camabaRekamMedisService = new CamabaRekamMedisService();

