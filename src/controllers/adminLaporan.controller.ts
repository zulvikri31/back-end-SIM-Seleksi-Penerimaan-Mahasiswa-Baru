import { Request, Response } from 'express';
import { adminLaporanService } from '../services/adminLaporan.service';

export class AdminLaporanController {
  /**
   * Laporan UKT Pendaftar (Screenshot 4)
   * GET /api/admin/laporan/ukt
   */
  async getLaporanUkt(req: Request, res: Response): Promise<void> {
    try {
      const {
        periodeId,
        jalurId,
        gelombangId,
        sistemKuliahId,
        prodiDiterimaId,
        kelompokUkt,
        format,
        gunakanKop,
      } = req.query;

      const result = await adminLaporanService.getLaporanUkt({
        periodeId: periodeId ? Number(periodeId) : undefined,
        jalurId: jalurId ? Number(jalurId) : undefined,
        gelombangId: gelombangId ? Number(gelombangId) : undefined,
        sistemKuliahId: sistemKuliahId ? Number(sistemKuliahId) : undefined,
        prodiDiterimaId: prodiDiterimaId ? Number(prodiDiterimaId) : undefined,
        kelompokUkt: kelompokUkt ? String(kelompokUkt) : undefined,
        format: (format as any) || 'HTML',
        gunakanKop: gunakanKop !== 'false',
      });

      res.json({
        success: true,
        message: 'Laporan UKT Pendaftar berhasil dibuat.',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal membuat laporan UKT.',
      });
    }
  }

  /**
   * Laporan Biodata Pendaftar
   * GET /api/admin/laporan/biodata
   */
  async getLaporanBiodata(req: Request, res: Response): Promise<void> {
    try {
      const { periodeId, gelombangId, jalurId } = req.query;
      const data = await adminLaporanService.getLaporanBiodata({
        periodeId: periodeId ? Number(periodeId) : undefined,
        gelombangId: gelombangId ? Number(gelombangId) : undefined,
        jalurId: jalurId ? Number(jalurId) : undefined,
      });

      res.json({
        success: true,
        message: 'Laporan Biodata Pendaftar berhasil diambil.',
        total: data.length,
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil laporan biodata.',
      });
    }
  }

  /**
   * Laporan Rekapitulasi Pendaftar Per Prodi
   * GET /api/admin/laporan/rekapitulasi
   */
  async getLaporanRekapitulasi(req: Request, res: Response): Promise<void> {
    try {
      const { periodeId } = req.query;
      const data = await adminLaporanService.getLaporanRekapitulasi(
        periodeId ? Number(periodeId) : undefined
      );

      res.json({
        success: true,
        message: 'Laporan Rekapitulasi per Program Studi berhasil diambil.',
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil laporan rekapitulasi.',
      });
    }
  }
}

export const adminLaporanController = new AdminLaporanController();
