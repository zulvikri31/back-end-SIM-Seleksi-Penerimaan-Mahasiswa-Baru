import { Request, Response } from 'express';
import { camabaService } from '../services/camaba.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class CamabaController {
  /**
   * GET /api/camaba/jenjang
   */
  async getJenjang(req: Request, res: Response): Promise<void> {
    try {
      const data = await camabaService.getJenjangList();
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
   * GET /api/camaba/sistem-kuliah
   */
  async getSistemKuliah(req: Request, res: Response): Promise<void> {
    try {
      const data = await camabaService.getSistemKuliahList();
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
   * GET /api/camaba/program-studi
   */
  async getProgramStudi(req: Request, res: Response): Promise<void> {
    try {
      const { jenjang, search } = req.query;
      const data = await camabaService.getProgramStudiList({
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
   * GET /api/camaba/program-studi/:id
   */
  async getProgramStudiDetail(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID program studi tidak valid.' });
        return;
      }

      const data = await camabaService.getProgramStudiDetail(id);
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
   * GET /api/camaba/jalur-pendaftaran
   */
  async getJalurPendaftaran(req: Request, res: Response): Promise<void> {
    try {
      const { jenjang, programStudiId, sistemKuliahId, gelombangId, search, isBukaOnly } = req.query;

      const sanitizeNum = (v: any) => {
        if (!v || v === 'undefined' || v === 'null') return undefined;
        const n = Number(v);
        return isNaN(n) ? undefined : n;
      };

      const data = await camabaService.getJalurPendaftaranList({
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
   * GET /api/camaba/jalur-pendaftaran/:id
   */
  async getJalurPendaftaranDetail(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID jalur pendaftaran tidak valid.' });
        return;
      }

      const data = await camabaService.getJalurPendaftaranDetail(id);
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
   * GET /api/camaba/informasi
   */
  async getInformasi(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, kategori, search } = req.query;

      const result = await camabaService.getInformasiList({
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
   * GET /api/camaba/informasi/:id
   */
  async getInformasiDetail(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID informasi tidak valid.' });
        return;
      }

      const data = await camabaService.getInformasiDetail(id);
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
   * GET /api/camaba/brosur
   */
  async getBrosur(req: Request, res: Response): Promise<void> {
    try {
      const data = await camabaService.getBrosurDanBiaya();
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

  /**
   * POST /api/camaba/daftar
   */
  async daftarJalur(req: Request, res: Response): Promise<void> {
    try {
      const { nama, email, password, noHp, pembukaanJalurId, sumberTrafik } = req.body;

      if (!nama || !email || !password || !pembukaanJalurId) {
        res.status(400).json({
          success: false,
          message: 'Nama lengkap, email, password, dan jalur pendaftaran wajib diisi.',
        });
        return;
      }

      const result = await camabaService.registerDanPilihJalur({
        nama,
        email,
        password,
        noHp,
        pembukaanJalurId: Number(pembukaanJalurId),
        sumberTrafik,
      });

      res.status(201).json({
        success: true,
        message: 'Pendaftaran akun dan pemilihan jalur berhasil!',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat pendaftaran.',
      });
    }
  }

  /**
   * GET /api/camaba/status
   * Mengambil status pendaftaran untuk camaba yang login
   */
  async getStatusPendaftaran(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
        return;
      }

      const data = await camabaService.getStatusPendaftaranByUserId(userId);
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
   * PUT /api/camaba/biodata
   * Melengkapi data diri / formulir camaba
   */
  async updateBiodata(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
        return;
      }

      const updated = await camabaService.updateBiodata(userId, req.body);
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
   * GET /api/camaba/rekam-medis
   * Mengambil riwayat kesehatan / rekam medis camaba yang sedang login
   */
  async getRekamMedis(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
        return;
      }

      const data = await camabaService.getRekamMedisByUserId(userId);
      res.status(200).json({
        success: true,
        message: 'Data rekam medis calon mahasiswa berhasil diambil.',
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal mengambil data rekam medis.',
      });
    }
  }

  /**
   * PUT /api/camaba/rekam-medis
   * Menyimpan atau memperbarui data rekam medis camaba
   */
  async updateRekamMedis(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
        return;
      }

      const data = await camabaService.upsertRekamMedis(userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Data rekam medis berhasil disimpan.',
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal menyimpan data rekam medis.',
      });
    }
  }
}

export const camabaController = new CamabaController();
