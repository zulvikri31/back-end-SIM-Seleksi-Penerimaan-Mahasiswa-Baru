import { Response } from 'express';
import { camabaBiodataService } from '../../services/camaba/camabaBiodata.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export class CamabaBiodataController {
  /**
   * GET /api/camaba/biodata/status atau /api/camaba/status
   */
  async getStatusPendaftaran(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
        return;
      }

      const data = await camabaBiodataService.getStatusPendaftaranByUserId(userId);
      if (!data) {
        res.status(404).json({
          success: false,
          message: 'Belum ada data pendaftaran untuk akun ini.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Status pendaftaran berhasil diambil.',
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil status pendaftaran.',
      });
    }
  }

  /**
   * GET /api/camaba/biodata
   */
  async getBiodataDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
        return;
      }

      const data = await camabaBiodataService.getStatusPendaftaranByUserId(userId);
      if (!data) {
        res.status(404).json({
          success: false,
          message: 'Belum ada data pendaftaran untuk akun ini.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Data biodata calon mahasiswa berhasil diambil.',
        data: {
          noPendaftaran: data.noPendaftaran,
          nama: data.nama,
          email: data.email,
          noHp: data.noHp,
          biodata: data.biodata,
          orangTua: data.orangTua,
          prodiPilihan: data.prodiPilihan,
          isFinalisasi: data.tahapan.isFinalisasi,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil biodata.',
      });
    }
  }

  /**
   * PUT /api/camaba/biodata
   */
  async updateBiodata(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
        return;
      }

      const updated = await camabaBiodataService.updateBiodata(userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Biodata pendaftar berhasil diperbarui.',
        data: updated,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal memperbarui biodata.',
      });
    }
  }

  /**
   * POST /api/camaba/biodata/finalisasi
   */
  async finalisasi(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
        return;
      }

      const result = await camabaBiodataService.finalisasiPendaftaran(userId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal melakukan finalisasi pendaftaran.',
      });
    }
  }
}

export const camabaBiodataController = new CamabaBiodataController();

