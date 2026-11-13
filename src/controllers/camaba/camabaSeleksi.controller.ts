import { Response } from 'express';
import { camabaSeleksiService } from '../../services/camaba/camabaSeleksi.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export class CamabaSeleksiController {
  /**
   * GET /api/camaba/seleksi/kartu-ujian
   */
  async getKartuUjian(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
        return;
      }

      const data = await camabaSeleksiService.getKartuUjian(userId);
      res.status(200).json({
        success: true,
        message: 'Data kartu ujian peserta seleksi berhasil diambil.',
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal mengambil kartu ujian.',
      });
    }
  }

  /**
   * GET /api/camaba/seleksi/hasil
   */
  async getHasilSeleksi(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
        return;
      }

      const data = await camabaSeleksiService.getHasilSeleksi(userId);
      res.status(200).json({
        success: true,
        message: 'Hasil pengumuman seleksi berhasil diambil.',
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal mengambil hasil seleksi.',
      });
    }
  }
}

export const camabaSeleksiController = new CamabaSeleksiController();

