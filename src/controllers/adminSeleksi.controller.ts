import { Request, Response } from 'express';
import { adminSeleksiService } from '../services/adminSeleksi.service';

export class AdminSeleksiController {
  /**
   * GET /api/admin/seleksi/syarat-seleksi
   */
  async getSyaratSeleksi(req: Request, res: Response): Promise<void> {
    try {
      const { periodeId, gelombangId, jalurPendaftaranId, jenisSyarat, statusDokumen, search, page, limit } = req.query;

      const result = await adminSeleksiService.getSyaratSeleksiList({
        periodeId: periodeId ? Number(periodeId) : undefined,
        gelombangId: gelombangId ? Number(gelombangId) : undefined,
        jalurPendaftaranId: jalurPendaftaranId ? Number(jalurPendaftaranId) : undefined,
        jenisSyarat: jenisSyarat ? String(jenisSyarat) : undefined,
        statusDokumen: statusDokumen ? String(statusDokumen) : undefined,
        search: search ? String(search) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
      });

      res.json({
        success: true,
        message: 'Data syarat seleksi berhasil diambil.',
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil data syarat seleksi.',
      });
    }
  }

  /**
   * POST /api/admin/seleksi/verifikasi-berkas
   */
  async verifikasiBerkas(req: Request, res: Response): Promise<void> {
    try {
      const { berkasId, statusVerifikasi, catatan } = req.body;
      if (!berkasId || !statusVerifikasi) {
        res.status(400).json({ success: false, message: 'berkasId dan statusVerifikasi wajib diisi.' });
        return;
      }

      const result = await adminSeleksiService.verifikasiBerkas(Number(berkasId), statusVerifikasi, catatan);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/admin/seleksi/input-nilai
   */
  async inputNilai(req: Request, res: Response): Promise<void> {
    try {
      const { pendaftarId, jenisTes, nilai, lulusTes, catatan } = req.body;
      if (!pendaftarId || nilai === undefined) {
        res.status(400).json({ success: false, message: 'pendaftarId dan nilai wajib diisi.' });
        return;
      }

      const result = await adminSeleksiService.inputNilaiSeleksi({
        pendaftarId,
        jenisTes,
        nilai: Number(nilai),
        lulusTes,
        catatan,
      });
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/admin/seleksi/generate-nilai
   */
  async generateNilai(req: Request, res: Response): Promise<void> {
    try {
      const { pendaftarIds } = req.body;
      const ids = Array.isArray(pendaftarIds) ? pendaftarIds : [pendaftarIds];

      const result = await adminSeleksiService.generateNilaiOtomatis(ids);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/admin/seleksi/batal-nilai
   */
  async batalNilai(req: Request, res: Response): Promise<void> {
    try {
      const { pendaftarIds } = req.body;
      const ids = Array.isArray(pendaftarIds) ? pendaftarIds : [pendaftarIds];

      const result = await adminSeleksiService.batalNilai(ids);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/admin/seleksi/kip-kuliah
   */
  async getKipKuliah(req: Request, res: Response): Promise<void> {
    try {
      const data = await adminSeleksiService.getKipKuliahList();
      res.json({ success: true, message: 'Data peserta KIP Kuliah berhasil diambil.', data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const adminSeleksiController = new AdminSeleksiController();
