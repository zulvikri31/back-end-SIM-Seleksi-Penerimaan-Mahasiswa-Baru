import { Request, Response } from 'express';
import { adminOdsService } from '../services/adminOds.service';

export class AdminOdsController {
  /**
   * Mengambil daftar pendaftar ODS dengan filter
   * GET /api/admin/ods
   */
  async getList(req: Request, res: Response): Promise<void> {
    try {
      const { periodeId, statusOds, isOdsDihubungi, search, page, limit } = req.query;

      const result = await adminOdsService.getOdsList({
        periodeId: periodeId ? Number(periodeId) : undefined,
        statusOds: statusOds ? String(statusOds) : undefined,
        isOdsDihubungi: isOdsDihubungi !== undefined ? isOdsDihubungi === 'true' : undefined,
        search: search ? String(search) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
      });

      res.json({
        success: true,
        message: 'Data One Day Service berhasil diambil.',
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil data One Day Service.',
      });
    }
  }

  /**
   * Catat follow up / hubungi pendaftar
   * POST /api/admin/ods/hubungi
   */
  async hubungi(req: Request, res: Response): Promise<void> {
    try {
      const { pendaftarId, catatan } = req.body;

      if (!pendaftarId) {
        res.status(400).json({ success: false, message: 'pendaftarId wajib diisi.' });
        return;
      }

      const result = await adminOdsService.hubungiPendaftar(
        pendaftarId,
        catatan ? String(catatan) : 'Telah dihubungi oleh petugas admin ODS.'
      );

      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal mencatat follow up ODS.',
      });
    }
  }

  /**
   * Update status tahapan ODS
   * POST /api/admin/ods/update-status
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { pendaftarId, statusOds } = req.body;

      if (!pendaftarId || !statusOds) {
        res.status(400).json({
          success: false,
          message: 'pendaftarId dan statusOds (PEMINAT/PENDAFTAR/PESERTA_SELEKSI/DAFTAR_ULANG) wajib diisi.',
        });
        return;
      }

      const result = await adminOdsService.updateStatusOds(pendaftarId, statusOds);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal memperbarui status ODS.',
      });
    }
  }

  /**
   * Statistik ringkasan ODS
   * GET /api/admin/ods/stats
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await adminOdsService.getOdsStats();
      res.json({
        success: true,
        message: 'Statistik One Day Service berhasil diambil.',
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil statistik ODS.',
      });
    }
  }
}

export const adminOdsController = new AdminOdsController();
