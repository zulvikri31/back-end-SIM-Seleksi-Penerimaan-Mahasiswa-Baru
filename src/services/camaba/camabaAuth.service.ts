import prisma from '../../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_fallback_key';

export interface PendaftaranBaruDTO {
  nama: string;
  email: string;
  password: string;
  noHp?: string;
  pembukaanJalurId: number;
  sumberTrafik?: string;
}

export class CamabaAuthService {
  /**
   * Pendaftaran Akun Camaba Baru & Pemilihan Jalur Pendaftaran
   */
  async registerDanPilihJalur(dto: PendaftaranBaruDTO) {
    const { nama, email, password, noHp, pembukaanJalurId, sumberTrafik } = dto;

    if (!nama || !email || !password || !pembukaanJalurId) {
      throw new Error('Nama, email, password, dan jalur pendaftaran wajib dipilih.');
    }

    // 1. Cek apakah email sudah terdaftar
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new Error('Email sudah terdaftar. Silakan gunakan email lain atau langsung Masuk.');
    }

    // 2. Cek apakah pembukaan jalur valid dan masih buka
    const pembukaan = await prisma.pembukaanJalur.findUnique({
      where: { id: Number(pembukaanJalurId) },
      include: {
        periode: true,
        gelombang: true,
        jalurPendaftaran: true,
        sistemKuliah: true,
        programStudi: true,
      },
    });

    if (!pembukaan) {
      throw new Error('Jalur pendaftaran yang dipilih tidak ditemukan.');
    }

    if (!pembukaan.isBuka) {
      throw new Error('Jalur pendaftaran ini sudah ditutup.');
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Generate no pendaftaran unik misal PMB2026xxxx
    const tahunSekarang = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const noPendaftaran = `PMB${tahunSekarang}${randomSuffix}`;

    // 5. Transaksi simpan User dan Pendaftar
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          nama,
          email,
          password: hashedPassword,
          role: 'CAMABA',
          isActive: true,
        },
      });

      const newPendaftar = await tx.pendaftar.create({
        data: {
          userId: newUser.id,
          noPendaftaran,
          periodeId: pembukaan.periodeId,
          gelombangId: pembukaan.gelombangId,
          jalurPendaftaranId: pembukaan.jalurPendaftaranId,
          sistemKuliahId: pembukaan.sistemKuliahId,
          programStudiId: pembukaan.programStudiId,
          noHp: noHp || null,
          sumberTrafik: sumberTrafik || 'Website UIKA',
          isBiodataLengkap: false,
          isFinalisasi: false,
          isIkutSeleksi: false,
          isDiterima: false,
          isDaftarUlang: false,
        },
        include: {
          periode: true,
          gelombang: true,
          jalurPendaftaran: true,
          sistemKuliah: true,
          programStudi: true,
        },
      });

      return { user: newUser, pendaftar: newPendaftar };
    });

    // 6. Generate Token JWT
    const token = jwt.sign(
      {
        id: result.user.id,
        nama: result.user.nama,
        email: result.user.email,
        role: result.user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: result.user.id,
        nama: result.user.nama,
        email: result.user.email,
        role: result.user.role,
      },
      pendaftaran: {
        noPendaftaran: result.pendaftar.noPendaftaran,
        jalur: result.pendaftar.jalurPendaftaran.nama,
        prodi: result.pendaftar.programStudi.namaProdi,
        jenjang: result.pendaftar.programStudi.jenjang,
        sistemKuliah: result.pendaftar.sistemKuliah.nama,
        gelombang: result.pendaftar.gelombang.nama,
        periode: result.pendaftar.periode.nama,
        status: 'Terdaftar - Menunggu Kelengkapan Biodata',
      },
    };
  }

  /**
   * Profil Singkat Akun Camaba Login
   */
  async getProfilCamaba(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        isActive: true,
        pendaftar: {
          select: {
            id: true,
            noPendaftaran: true,
            statusPendaftar: true,
            statusKelulusan: true,
            isBiodataLengkap: true,
            isFinalisasi: true,
            isDaftarUlang: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User calon mahasiswa tidak ditemukan.');
    }

    return user;
  }
}

export const camabaAuthService = new CamabaAuthService();

