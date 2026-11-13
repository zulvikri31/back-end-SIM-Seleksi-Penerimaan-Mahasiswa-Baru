import { Response } from 'express';
import { camabaBerkasService } from '../../services/camaba/camabaBerkas.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export class CamabaBerkasController {
  /**
   * GET /api/camaba/berkas
   */
  async getBerkasList(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
        return;
      }

      const data = await camabaBerkasService.getBerkasList(userId);
      res.status(200).json({
        success: true,
        message: 'Daftar berkas pendaftar berhasil diambil.',
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil daftar berkas.',
      });
    }
  }

  /**
   * POST /api/camaba/berkas/upload
   */
  async uploadBerkas(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
        return;
      }

      const { jenisBerkas, fileUrl } = req.body;
      const file = req.file;

      if (!jenisBerkas) {
        res.status(400).json({
          success: false,
          message: 'Jenis berkas wajib diisi (contoh: KTP, IJAZAH, PAS_FOTO, KARTU_KELUARGA).',
        });
        return;
      }

      const result = await camabaBerkasService.uploadBerkas(userId, {
        jenisBerkas,
        fileUrl,
        file,
      });

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal mengunggah berkas.',
      });
    }
  }

  /**
   * DELETE /api/camaba/berkas/:id
   */
  async deleteBerkas(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
        return;
      }

      const berkasId = Number(req.params.id);
      if (isNaN(berkasId)) {
        res.status(400).json({ success: false, message: 'ID berkas tidak valid.' });
        return;
      }

      const result = await camabaBerkasService.deleteBerkas(userId, berkasId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal menghapus berkas.',
      });
    }
  }
}

export const camabaBerkasController = new CamabaBerkasController();

