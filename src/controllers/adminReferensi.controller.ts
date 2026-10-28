import { Request, Response } from 'express';
import { adminReferensiService } from '../services/adminReferensi.service';

export class AdminReferensiController {
  async getGelombang(req: Request, res: Response): Promise<void> {
    try {
      const data = await adminReferensiService.getGelombang();
      res.json({ success: true, message: 'Data master Gelombang berhasil diambil.', data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getJalurPendaftaran(req: Request, res: Response): Promise<void> {
    try {
      const data = await adminReferensiService.getJalurPendaftaran();
      res.json({ success: true, message: 'Data master Jalur Pendaftaran berhasil diambil.', data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getSistemKuliah(req: Request, res: Response): Promise<void> {
    try {
      const data = await adminReferensiService.getSistemKuliah();
      res.json({ success: true, message: 'Data master Sistem Kuliah berhasil diambil.', data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getProgramStudi(req: Request, res: Response): Promise<void> {
    try {
      const data = await adminReferensiService.getProgramStudi();
      res.json({ success: true, message: 'Data master Program Studi berhasil diambil.', data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPeriode(req: Request, res: Response): Promise<void> {
    try {
      const data = await adminReferensiService.getPeriode();
      res.json({ success: true, message: 'Data master Periode berhasil diambil.', data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getJenisProgram(req: Request, res: Response): Promise<void> {
    try {
      const data = await adminReferensiService.getJenisProgram();
      res.json({ success: true, message: 'Data Jenis Program berhasil diambil.', data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getJenisPendaftaran(req: Request, res: Response): Promise<void> {
    try {
      const data = await adminReferensiService.getJenisPendaftaran();
      res.json({ success: true, message: 'Data Jenis Pendaftaran berhasil diambil.', data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getWilayah(req: Request, res: Response): Promise<void> {
    try {
      const data = await adminReferensiService.getWilayah();
      res.json({ success: true, message: 'Data Wilayah berhasil diambil.', data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getJenisDokumenRpl(req: Request, res: Response): Promise<void> {
    try {
      const data = await adminReferensiService.getJenisDokumenRpl();
      res.json({ success: true, message: 'Data Jenis Dokumen RPL berhasil diambil.', data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getMataKuliahRpl(req: Request, res: Response): Promise<void> {
    try {
      const prodiId = req.query.prodiId ? Number(req.query.prodiId) : undefined;
      const data = await adminReferensiService.getMataKuliahRpl(prodiId);
      res.json({ success: true, message: 'Data Mata Kuliah RPL berhasil diambil.', data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const adminReferensiController = new AdminReferensiController();
