import { Response } from 'express';
import { camabaPembayaranService } from '../../services/camaba/camabaPembayaran.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export class CamabaPembayaranController {
  /**
   * GET /api/camaba/pembayaran/tagihan
   */
  async getTagihan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
        return;
      }

      const data = await camabaPembayaranService.getTagihan(userId);
      res.status(200).json({
        success: true,
        message: 'Informasi tagihan pembayaran berhasil diambil.',
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil tagihan pembayaran.',
      });
    }
  }

  /**
   * POST /api/camaba/pembayaran/simulasi
   */
  async simulasiBayar(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
        return;
      }

      const { jenisTagihan } = req.body; // 'FORMULIR' atau 'DAFTAR_ULANG'
      if (!jenisTagihan) {
        res.status(400).json({
          success: false,
          message: "Parameter jenisTagihan wajib diisi ('FORMULIR' atau 'DAFTAR_ULANG').",
        });
        return;
      }

      const result = await camabaPembayaranService.simulasiBayar(userId, jenisTagihan);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal memproses simulasi pembayaran.',
      });
    }
  }
}

export const camabaPembayaranController = new CamabaPembayaranController();

