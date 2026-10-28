import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

export interface RegisterDTO {
  nama: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email?: string;
  idPendaftar?: string;
  identifier?: string;
  password?: string;
  pin?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'secret_fallback_key';

export class AuthService {
  async register(data: RegisterDTO) {
    const { nama, email, password } = data;

    // 1. Validasi input
    if (!nama || !email || !password) {
      throw new Error('Nama, email, dan password wajib diisi.');
    }

    // 2. Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Email sudah terdaftar. Silakan gunakan email lain.');
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Simpan user baru ke database
    const newUser = await prisma.user.create({
      data: {
        nama,
        email,
        password: hashedPassword,
        role: 'CAMABA',
        isActive: true,
      },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return newUser;
  }

  async login(data: LoginDTO) {
    const loginId = data.identifier || data.idPendaftar || data.email;
    const loginSecret = data.password || data.pin;

    // 1. Validasi input
    if (!loginId || !loginSecret) {
      throw new Error('ID Pendaftar / Email dan Password / PIN wajib diisi.');
    }

    // 2. Cari user berdasarkan email ATAU nomor pendaftaran (ID Pendaftar)
    let user = await prisma.user.findUnique({
      where: { email: loginId.trim() },
      include: { pendaftar: true },
    });

    if (!user) {
      // Cari jika yang dimasukkan adalah ID Pendaftar (noPendaftaran)
      const pendaftar = await prisma.pendaftar.findFirst({
        where: {
          OR: [
            { noPendaftaran: loginId.trim() },
            { nim: loginId.trim() },
          ],
        },
        include: { user: true },
      });

      if (pendaftar && pendaftar.user) {
        user = {
          ...pendaftar.user,
          pendaftar,
        };
      }
    }

    if (!user) {
      throw new Error('ID Pendaftar / Email atau PIN / Password tidak sesuai.');
    }

    // 3. Cek kesesuaian password
    const isPasswordValid = await bcrypt.compare(loginSecret, user.password);
    if (!isPasswordValid) {
      throw new Error('ID Pendaftar / Email atau PIN / Password tidak sesuai.');
    }

    // 4. Generate JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return {
      token,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }
}

export const authService = new AuthService();
