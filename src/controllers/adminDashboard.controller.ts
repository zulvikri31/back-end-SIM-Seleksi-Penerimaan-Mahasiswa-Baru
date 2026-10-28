import { Request, Response } from 'express';
import { adminDashboardService } from '../services/adminDashboard.service';

export class AdminDashboardController {
  async getCharts(req: Request, res: Response): Promise<void> {
    try {
      const { periodeId, kodePeriode, tahun } = req.query;

      const sanitizeNum = (v: any) => {
        if (!v || v === 'undefined' || v === 'null') return undefined;
        const n = Number(v);
        return isNaN(n) ? undefined : n;
      };

      const filter = {
        periodeId: sanitizeNum(periodeId),
        kodePeriode: kodePeriode && kodePeriode !== 'undefined' && kodePeriode !== 'null' ? String(kodePeriode).trim() : undefined,
        tahun: sanitizeNum(tahun),
      };

      const result = await adminDashboardService.getChartsData(filter);

      res.status(200).json({
        success: true,
        message: 'Data grafik dashboard admin berhasil diambil.',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat mengambil data grafik dashboard.',
      });
    }
  }

  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const { periodeId, kodePeriode } = req.query;

      const sanitizeNum = (v: any) => {
        if (!v || v === 'undefined' || v === 'null') return undefined;
        const n = Number(v);
        return isNaN(n) ? undefined : n;
      };

      const filter = {
        periodeId: sanitizeNum(periodeId),
        kodePeriode: kodePeriode && kodePeriode !== 'undefined' && kodePeriode !== 'null' ? String(kodePeriode).trim() : undefined,
      };

      const result = await adminDashboardService.getSummaryData(filter);

      res.status(200).json({
        success: true,
        message: 'Data ringkasan statistik dashboard berhasil diambil.',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat mengambil ringkasan dashboard.',
      });
    }
  }
}

export const adminDashboardController = new AdminDashboardController();

