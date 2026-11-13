import { Request, Response } from 'express';
import { camabaKatalogService } from '../../services/camaba/camabaKatalog.service';

export class CamabaKatalogController {
  /**
   * GET /api/camaba/katalog/jenjang atau /api/camaba/jenjang
   */
  async getJenjang(req: Request, res: Response): Promise<void> {
    try {
      const data = await camabaKatalogService.getJenjangList();
      res.status(200).json({
        success: true,
        message: 'Daftar jenjang pendidikan berhasil diambil.',
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil data jenjang.',
      });
    }
  }

  /**
   * GET /api/camaba/katalog/sistem-kuliah atau /api/camaba/sistem-kuliah
   */
  async getSistemKuliah(req: Request, res: Response): Promise<void> {
    try {
      const data = await camabaKatalogService.getSistemKuliahList();
      res.status(200).json({
        success: true,
        message: 'Daftar sistem kuliah berhasil diambil.',
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil data sistem kuliah.',
      });
    }
  }

  /**
   * GET /api/camaba/katalog/program-studi atau /api/camaba/program-studi
   */
  async getProgramStudi(req: Request, res: Response): Promise<void> {
    try {
      const { jenjang, search } = req.query;
      const data = await camabaKatalogService.getProgramStudiList({
        jenjang: jenjang ? String(jenjang) : undefined,
        search: search ? String(search) : undefined,
      });

      res.status(200).json({
        success: true,
        message: 'Daftar program studi berhasil diambil.',
        total: data.length,
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil data program studi.',
      });
    }
  }

  /**
   * GET /api/camaba/katalog/program-studi/:id atau /api/camaba/program-studi/:id
   */
  async getProgramStudiDetail(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID program studi tidak valid.' });
        return;
      }

      const data = await camabaKatalogService.getProgramStudiDetail(id);
      res.status(200).json({
        success: true,
        message: 'Detail program studi berhasil diambil.',
        data,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Program studi tidak ditemukan.',
      });
    }
  }

  /**
   * GET /api/camaba/katalog/jalur-pendaftaran atau /api/camaba/jalur-pendaftaran
   */
  async getJalurPendaftaran(req: Request, res: Response): Promise<void> {
    try {
      const { jenjang, programStudiId, sistemKuliahId, gelombangId, search, isBukaOnly } = req.query;

      const sanitizeNum = (v: any) => {
        if (!v || v === 'undefined' || v === 'null') return undefined;
        const n = Number(v);
        return isNaN(n) ? undefined : n;
      };

      const data = await camabaKatalogService.getJalurPendaftaranList({
        jenjang: jenjang && jenjang !== 'all' ? String(jenjang) : undefined,
        programStudiId: sanitizeNum(programStudiId),
        sistemKuliahId: sanitizeNum(sistemKuliahId),
        gelombangId: sanitizeNum(gelombangId),
        search: search ? String(search) : undefined,
        isBukaOnly: isBukaOnly === 'false' ? false : true,
      });

      res.status(200).json({
        success: true,
        message: 'Daftar jalur pendaftaran berhasil diambil.',
        total: data.length,
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil data jalur pendaftaran.',
      });
    }
  }

  /**
   * GET /api/camaba/katalog/jalur-pendaftaran/:id atau /api/camaba/jalur-pendaftaran/:id
   */
  async getJalurPendaftaranDetail(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID jalur pendaftaran tidak valid.' });
        return;
      }

      const data = await camabaKatalogService.getJalurPendaftaranDetail(id);
      res.status(200).json({
        success: true,
        message: 'Detail jalur pendaftaran berhasil diambil.',
        data,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Jalur pendaftaran tidak ditemukan.',
      });
    }
  }

  /**
   * GET /api/camaba/katalog/informasi atau /api/camaba/informasi
   */
  async getInformasi(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, kategori, search } = req.query;

      const result = await camabaKatalogService.getInformasiList({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        kategori: kategori ? String(kategori) : undefined,
        search: search ? String(search) : undefined,
      });

      res.status(200).json({
        success: true,
        message: 'Daftar informasi dan pengumuman berhasil diambil.',
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil data informasi.',
      });
    }
  }

  /**
   * GET /api/camaba/katalog/informasi/:id atau /api/camaba/informasi/:id
   */
  async getInformasiDetail(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID informasi tidak valid.' });
        return;
      }

      const data = await camabaKatalogService.getInformasiDetail(id);
      res.status(200).json({
        success: true,
        message: 'Detail informasi berhasil diambil.',
        data,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Informasi tidak ditemukan.',
      });
    }
  }

  /**
   * GET /api/camaba/katalog/brosur atau /api/camaba/brosur
   */
  async getBrosur(req: Request, res: Response): Promise<void> {
    try {
      const data = await camabaKatalogService.getBrosurDanBiaya();
      res.status(200).json({
        success: true,
        message: 'Data brosur dan rincian biaya berhasil diambil.',
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil data brosur dan biaya.',
      });
    }
  }
}

export const camabaKatalogController = new CamabaKatalogController();

