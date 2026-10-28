import { Request, Response } from 'express';
import { adminPengaturanService } from '../services/adminPengaturan.service';

export class AdminPengaturanController {
  /**
   * GET /api/admin/pengaturan/periode-pendaftaran
   */
  async getPeriodePendaftaran(req: Request, res: Response): Promise<void> {
    try {
      const { periodeId, gelombangId, jalurPendaftaranId, sistemKuliahId, status, search, page, limit } = req.query;

      const result = await adminPengaturanService.getPeriodePendaftaranList({
        periodeId: periodeId ? Number(periodeId) : undefined,
        gelombangId: gelombangId ? Number(gelombangId) : undefined,
        jalurPendaftaranId: jalurPendaftaranId ? Number(jalurPendaftaranId) : undefined,
        sistemKuliahId: sistemKuliahId ? Number(sistemKuliahId) : undefined,
        status: status ? String(status) : undefined,
        search: search ? String(search) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
      });

      res.json({
        success: true,
        message: 'Data pengaturan periode pendaftaran berhasil diambil.',
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil data pengaturan.',
      });
    }
  }

  /**
   * POST /api/admin/pengaturan/periode-pendaftaran
   */
  async createPeriodePendaftaran(req: Request, res: Response): Promise<void> {
    try {
      const result = await adminPengaturanService.createPeriodePendaftaran(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal membuat pengaturan jalur baru.',
      });
    }
  }

  /**
   * PATCH /api/admin/pengaturan/periode-pendaftaran/:id/toggle
   */
  async toggleStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { isBuka } = req.body;
      const result = await adminPengaturanService.toggleStatusJalur(id, Boolean(isBuka));
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * DELETE /api/admin/pengaturan/periode-pendaftaran/:id
   */
  async deletePeriodePendaftaran(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const result = await adminPengaturanService.deletePeriodePendaftaran(id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/admin/pengaturan/ukt
   */
  async getUkt(req: Request, res: Response): Promise<void> {
    try {
      const data = await adminPengaturanService.getPengaturanUkt();
      res.json({ success: true, message: 'Daftar pengaturan UKT berhasil diambil.', data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/admin/pengaturan/umum
   */
  async getUmum(req: Request, res: Response): Promise<void> {
    try {
      const data = await adminPengaturanService.getPengaturanUmum();
      res.json({ success: true, message: 'Pengaturan umum PMB berhasil diambil.', data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const adminPengaturanController = new AdminPengaturanController();
