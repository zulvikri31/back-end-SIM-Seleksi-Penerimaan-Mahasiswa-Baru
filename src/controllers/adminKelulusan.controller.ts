import { Request, Response } from 'express';
import { adminKelulusanService } from '../services/adminKelulusan.service';

export class AdminKelulusanController {
  /**
   * 1. Rekomendasi Prodi List
   * GET /api/admin/kelulusan/rekomendasi-prodi
   */
  async getRekomendasiProdi(req: Request, res: Response): Promise<void> {
    try {
      const {
        periodeId,
        gelombangId,
        jalurPendaftaranId,
        sistemKuliahId,
        programStudiId,
        statusKelulusan,
        pilihan,
        search,
        page,
        limit,
      } = req.query;

      const result = await adminKelulusanService.getRekomendasiProdiList({
        periodeId: periodeId ? Number(periodeId) : undefined,
        gelombangId: gelombangId ? Number(gelombangId) : undefined,
        jalurPendaftaranId: jalurPendaftaranId ? Number(jalurPendaftaranId) : undefined,
        sistemKuliahId: sistemKuliahId ? Number(sistemKuliahId) : undefined,
        programStudiId: programStudiId ? Number(programStudiId) : undefined,
        statusKelulusan: statusKelulusan ? String(statusKelulusan) : undefined,
        pilihan: pilihan ? Number(pilihan) : undefined,
        search: search ? String(search) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
      });

      res.json({
        success: true,
        message: 'Data rekomendasi prodi kelulusan berhasil diambil.',
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil data rekomendasi prodi.',
      });
    }
  }

  /**
   * Penetapan Keputusan Kelulusan
   * POST /api/admin/kelulusan/tetapkan
   */
  async tetapkan(req: Request, res: Response): Promise<void> {
    try {
      const { pendaftarId, statusKelulusan, prodiDiterimaId, isCadanganDisetujui } = req.body;

      if (!pendaftarId || !statusKelulusan) {
        res.status(400).json({
          success: false,
          message: 'Parameter pendaftarId dan statusKelulusan wajib diisi.',
        });
        return;
      }

      const result = await adminKelulusanService.tetapkanKelulusan(pendaftarId, {
        statusKelulusan,
        prodiDiterimaId: prodiDiterimaId ? Number(prodiDiterimaId) : undefined,
        isCadanganDisetujui: Boolean(isCadanganDisetujui),
      });

      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal menetapkan kelulusan.',
      });
    }
  }

  /**
   * Kirim Email Kelulusan
   * POST /api/admin/kelulusan/kirim-email
   */
  async kirimEmail(req: Request, res: Response): Promise<void> {
    try {
      const { pendaftarIds } = req.body;
      const ids = Array.isArray(pendaftarIds) ? pendaftarIds : [pendaftarIds];

      const result = await adminKelulusanService.kirimEmailKelulusan(ids);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal mengirim email kelulusan.',
      });
    }
  }

  /**
   * 2. Registrasi Ulang List
   * GET /api/admin/kelulusan/registrasi-ulang
   */
  async getRegistrasiUlang(req: Request, res: Response): Promise<void> {
    try {
      const { periodeId, gelombangId, jalurPendaftaranId, programStudiId, search, page, limit } = req.query;

      const result = await adminKelulusanService.getRegistrasiUlangList({
        periodeId: periodeId ? Number(periodeId) : undefined,
        gelombangId: gelombangId ? Number(gelombangId) : undefined,
        jalurPendaftaranId: jalurPendaftaranId ? Number(jalurPendaftaranId) : undefined,
        programStudiId: programStudiId ? Number(programStudiId) : undefined,
        search: search ? String(search) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
      });

      res.json({
        success: true,
        message: 'Data registrasi ulang berhasil diambil.',
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil data registrasi ulang.',
      });
    }
  }

  /**
   * Update Status Registrasi Ulang
   * POST /api/admin/kelulusan/registrasi-ulang/update
   */
  async updateRegistrasiUlang(req: Request, res: Response): Promise<void> {
    try {
      const { pendaftarId, isDaftarUlang } = req.body;
      if (!pendaftarId) {
        res.status(400).json({ success: false, message: 'pendaftarId wajib diisi.' });
        return;
      }

      const result = await adminKelulusanService.updateRegistrasiUlang(
        pendaftarId,
        Boolean(isDaftarUlang)
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal memperbarui status registrasi ulang.',
      });
    }
  }

  /**
   * 3. Generate Mahasiswa / NIM
   * POST /api/admin/kelulusan/generate-nim
   */
  async generateNim(req: Request, res: Response): Promise<void> {
    try {
      const { pendaftarId, customNim, pendaftarIds } = req.body;

      // Mendukung single atau batch
      if (Array.isArray(pendaftarIds) && pendaftarIds.length > 0) {
        const result = await adminKelulusanService.batchGenerateNim(pendaftarIds);
        res.json(result);
        return;
      }

      if (!pendaftarId) {
        res.status(400).json({ success: false, message: 'pendaftarId atau pendaftarIds wajib diisi.' });
        return;
      }

      const result = await adminKelulusanService.generateNim(
        pendaftarId,
        customNim ? String(customNim) : undefined
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal melakukan generate NIM.',
      });
    }
  }

  /**
   * 4. Pembatalan NIM
   * POST /api/admin/kelulusan/batalkan-nim
   */
  async batalkanNim(req: Request, res: Response): Promise<void> {
    try {
      const { pendaftarId, alasan } = req.body;
      if (!pendaftarId) {
        res.status(400).json({ success: false, message: 'pendaftarId wajib diisi.' });
        return;
      }

      const result = await adminKelulusanService.batalkanNim(
        pendaftarId,
        alasan ? String(alasan) : undefined
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal membatalkan NIM.',
      });
    }
  }
}

export const adminKelulusanController = new AdminKelulusanController();
