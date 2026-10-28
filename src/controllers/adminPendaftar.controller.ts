import { Request, Response } from 'express';
import { adminPendaftarService } from '../services/adminPendaftar.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AdminPendaftarController {
  /**
   * Mengambil daftar pendaftar dengan filter (Periode, Gelombang, Jalur, Sistem, Prodi, Status, Pilihan)
   * GET /api/admin/pendaftar
   */
  async getList(req: Request, res: Response): Promise<void> {
    try {
      const {
        periodeId,
        gelombangId,
        jalurPendaftaranId,
        sistemKuliahId,
        programStudiId,
        statusPendaftar,
        statusKelulusan,
        pilihan,
        search,
        searchBy,
        page,
        limit,
      } = req.query;

      const result = await adminPendaftarService.getPendaftarList({
        periodeId: periodeId ? Number(periodeId) : undefined,
        gelombangId: gelombangId ? Number(gelombangId) : undefined,
        jalurPendaftaranId: jalurPendaftaranId ? Number(jalurPendaftaranId) : undefined,
        sistemKuliahId: sistemKuliahId ? Number(sistemKuliahId) : undefined,
        programStudiId: programStudiId ? Number(programStudiId) : undefined,
        statusPendaftar: statusPendaftar ? String(statusPendaftar) : undefined,
        statusKelulusan: statusKelulusan ? String(statusKelulusan) : undefined,
        pilihan: pilihan ? Number(pilihan) : undefined,
        search: search ? String(search) : undefined,
        searchBy: searchBy ? String(searchBy) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
      });

      res.json({
        success: true,
        message: 'Data pendaftar berhasil diambil.',
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil data pendaftar.',
      });
    }
  }

  /**
   * Mengambil opsi-opsi seluruh dropdown filter pendaftar (Periode, Gelombang, Jalur, Sistem, Prodi, Status, Kategori Cari)
   * GET /api/admin/pendaftar/dropdown-options
   */
  async getDropdownOptions(req: Request, res: Response): Promise<void> {
    try {
      const data = await adminPendaftarService.getDropdownOptions();
      res.json({
        success: true,
        message: 'Opsi dropdown filter pendaftar berhasil diambil.',
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil opsi dropdown.',
      });
    }
  }

  /**
   * Mengambil detail pendaftar berdasarkan ID atau Nomor Pendaftaran
   * GET /api/admin/pendaftar/:id
   */
  async getDetail(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id || '').trim();
      if (!id) {
        res.status(400).json({ success: false, message: 'ID atau Nomor pendaftar wajib diisi.' });
        return;
      }

      const pendaftar = await adminPendaftarService.getPendaftarDetail(id);
      res.json({
        success: true,
        message: 'Detail pendaftar berhasil diambil.',
        data: pendaftar,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Pendaftar tidak ditemukan.',
      });
    }
  }

  /**
   * Cari Pendaftar khusus untuk fitur "Login As"
   * GET /api/admin/pendaftar/login-as/search?q=...
   */
  async searchLoginAs(req: Request, res: Response): Promise<void> {
    try {
      const q = String(req.query.q || req.query.search || '');
      const results = await adminPendaftarService.searchForLoginAs(q);

      res.json({
        success: true,
        message: 'Hasil pencarian Login As pendaftar.',
        total: results.length,
        data: results,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mencari data pendaftar untuk Login As.',
      });
    }
  }

  /**
   * Eksekusi "Login As" Camaba (Admin login ke akun Camaba tanpa password)
   * POST /api/admin/pendaftar/login-as
   * Body: { identifier: "4102541051" } atau { pendaftarId: 1 }
   */
  async executeLoginAs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminUserId = req.user?.id || 1; // Default jika dalam preview mode
      const identifier = req.body.identifier || req.body.idPendaftar || req.body.pendaftarId || req.body.userId;

      if (!identifier) {
        res.status(400).json({
          success: false,
          message: 'Parameter identifier (Nomor Pendaftaran / User ID / Pendaftar ID) wajib diisi.',
        });
        return;
      }

      const result = await adminPendaftarService.loginAsCamaba(adminUserId, identifier);

      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal melakukan Login As ke akun Camaba.',
      });
    }
  }

  /**
   * Hapus Pendaftar
   * DELETE /api/admin/pendaftar/:id
   */
  async deletePendaftar(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id || '').trim();
      if (!id) {
        res.status(400).json({ success: false, message: 'ID atau Nomor pendaftar wajib diisi.' });
        return;
      }

      const result = await adminPendaftarService.deletePendaftar(id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal menghapus pendaftar.',
      });
    }
  }
}

export const adminPendaftarController = new AdminPendaftarController();
