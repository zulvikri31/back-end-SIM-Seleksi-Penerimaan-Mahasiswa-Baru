import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { nama, email, password } = req.body;
      const user = await authService.register({ nama, email, password });

      res.status(201).json({
        success: true,
        message: 'Registrasi berhasil! Akun Anda telah dibuat.',
        data: user,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat registrasi.',
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, identifier, idPendaftar, pin } = req.body;
      const result = await authService.login({ email, password, identifier, idPendaftar, pin });

      res.status(200).json({
        success: true,
        message: 'Login berhasil!',
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat login.',
      });
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        message: 'Data profil berhasil diambil.',
        data: req.user,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Terjadi kesalahan pada server.',
      });
    }
  }
}

export const authController = new AuthController();
