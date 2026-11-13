import { Response } from 'express';
import { camabaRekamMedisService } from '../../services/camaba/camabaRekamMedis.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export class CamabaRekamMedisController {
  /**
   * GET /api/camaba/rekam-medis
   * Mengambil riwayat kesehatan / rekam medis camaba yang sedang login
   */
  async getRekamMedis(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
        return;
      }

      const data = await camabaRekamMedisService.getRekamMedisByUserId(userId);
      res.status(200).json({
        success: true,
        message: 'Data rekam medis calon mahasiswa berhasil diambil.',
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal mengambil data rekam medis.',
      });
    }
  }

  /**
   * PUT /api/camaba/rekam-medis
   * Menyimpan atau memperbarui data rekam medis camaba (kuesioner gform style)
   */
  async updateRekamMedis(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
        return;
      }

      const data = await camabaRekamMedisService.upsertRekamMedis(userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Data rekam medis berhasil disimpan.',
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal menyimpan data rekam medis.',
      });
    }
  }
}

export const camabaRekamMedisController = new CamabaRekamMedisController();

