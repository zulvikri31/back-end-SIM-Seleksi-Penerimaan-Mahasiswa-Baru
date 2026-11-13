import { Request, Response } from 'express';
import { camabaAuthService } from '../../services/camaba/camabaAuth.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export class CamabaAuthController {
  /**
   * POST /api/camaba/auth/daftar atau /api/camaba/daftar
   */
  async daftarJalur(req: Request, res: Response): Promise<void> {
    try {
      const { nama, email, password, noHp, pembukaanJalurId, sumberTrafik } = req.body;

      if (!nama || !email || !password || !pembukaanJalurId) {
        res.status(400).json({
          success: false,
          message: 'Nama lengkap, email, password, dan jalur pendaftaran wajib diisi.',
        });
        return;
      }

      const result = await camabaAuthService.registerDanPilihJalur({
        nama,
        email,
        password,
        noHp,
        pembukaanJalurId: Number(pembukaanJalurId),
        sumberTrafik,
      });

      res.status(201).json({
        success: true,
        message: 'Pendaftaran akun dan pemilihan jalur berhasil!',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat pendaftaran.',
      });
    }
  }

  /**
   * GET /api/camaba/auth/me
   */
  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
        return;
      }

      const data = await camabaAuthService.getProfilCamaba(userId);
      res.status(200).json({
        success: true,
        message: 'Profil pendaftar berhasil diambil.',
        data,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'User tidak ditemukan.',
      });
    }
  }
}

export const camabaAuthController = new CamabaAuthController();

