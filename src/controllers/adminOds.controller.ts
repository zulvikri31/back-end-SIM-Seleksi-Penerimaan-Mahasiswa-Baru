import { Request, Response } from 'express';
import { adminOdsService } from '../services/adminOds.service';

export class AdminOdsController {
  /**
   * Mengambil daftar pendaftar ODS dengan filter (sesuai tabel Screenshot 1)
   * GET /api/admin/ods
   */
  async getList(req: Request, res: Response): Promise<void> {
    try {
      const {
        periodeId,
        periodeIds,
        programStudiId,
        programStudiIds,
        unitIds,
        prodiIds,
        jalurPendaftaranId,
        jalurPendaftaranIds,
        jalurIds,
        sistemKuliahId,
        gelombangId,
        statusOds,
        isOdsDihubungi,
        statusVerifikasiTab,
        tab,
        search,
        page,
        limit,
      } = req.query;

      const parseNumList = (val: any): number[] => {
        if (!val) return [];
        if (Array.isArray(val)) return val.map((v) => Number(v)).filter((n) => !isNaN(n) && n > 0);
        if (typeof val === 'string') return val.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n) && n > 0);
        if (typeof val === 'number' && val > 0) return [val];
        return [];
      };

      const prodiList = parseNumList(programStudiIds || unitIds || prodiIds);
      const jalurList = parseNumList(jalurPendaftaranIds || jalurIds);
      const periodeList = parseNumList(periodeIds);

      const tabValue = (statusVerifikasiTab || tab) as any;

      const result = await adminOdsService.getOdsList({
        periodeId: periodeId ? Number(periodeId) : undefined,
        periodeIds: periodeList.length > 0 ? periodeList : undefined,
        programStudiId: programStudiId ? Number(programStudiId) : undefined,
        programStudiIds: prodiList.length > 0 ? prodiList : undefined,
        jalurPendaftaranId: jalurPendaftaranId ? Number(jalurPendaftaranId) : undefined,
        jalurPendaftaranIds: jalurList.length > 0 ? jalurList : undefined,
        sistemKuliahId: sistemKuliahId ? Number(sistemKuliahId) : undefined,
        gelombangId: gelombangId ? Number(gelombangId) : undefined,
        statusOds: statusOds ? String(statusOds) : undefined,
        isOdsDihubungi: isOdsDihubungi !== undefined ? isOdsDihubungi === 'true' : undefined,
        statusVerifikasiTab: tabValue,
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
   * Mengambil detail pendaftar dan daftar berkas untuk Modal "Informasi Pendaftar [Berkas Perlu Diverifikasi]"
   * GET /api/admin/ods/pendaftar/:id/verifikasi-berkas
   * GET /api/admin/ods/verifikasi-berkas/:id
   */
  async getDetailVerifikasiBerkas(req: Request, res: Response): Promise<void> {
    try {
      const identifier = req.params.id || req.params.pendaftarId || req.query.pendaftarId;
      if (!identifier) {
        res.status(400).json({ success: false, message: 'ID atau nomor pendaftar wajib disertakan.' });
        return;
      }

      const detail = await adminOdsService.getDetailVerifikasiBerkas(identifier as string);
      res.json({
        success: true,
        message: 'Detail berkas pendaftar ODS berhasil diambil.',
        data: detail,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Gagal mengambil detail berkas pendaftar ODS.',
      });
    }
  }

  /**
   * Verifikasi berkas pendaftar (Tombol "Simpan" & "Simpan & Kirim Notifikasi")
   * Otomatis memicu pesan notifikasi WhatsApp jika kirimNotifikasi === true
   * POST /api/admin/ods/verifikasi-berkas
   */
  async verifikasiBerkas(req: Request, res: Response): Promise<void> {
    try {
      const { pendaftarId, berkas, kirimNotifikasi, portalUrl } = req.body;

      if (!pendaftarId) {
        res.status(400).json({
          success: false,
          message: 'pendaftarId wajib diisi.',
        });
        return;
      }

      if (!berkas || !Array.isArray(berkas)) {
        res.status(400).json({
          success: false,
          message: 'Daftar berkas harus berupa array.',
        });
        return;
      }

      const result = await adminOdsService.verifikasiBerkas(pendaftarId, {
        berkas,
        kirimNotifikasi: Boolean(kirimNotifikasi),
        portalUrl,
      });

      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal menyimpan verifikasi berkas ODS.',
      });
    }
  }

  /**
   * Follow-up Calon Mahasiswa yang belum finalisasi (Tombol "Hubungi Pendaftar")
   * POST /api/admin/ods/hubungi-belum-finalisasi
   */
  async hubungiBelumFinalisasi(req: Request, res: Response): Promise<void> {
    try {
      const { pendaftarId, catatan, pesan, portalUrl } = req.body;

      if (!pendaftarId) {
        res.status(400).json({ success: false, message: 'pendaftarId wajib diisi.' });
        return;
      }

      const result = await adminOdsService.hubungiPendaftarBelumFinalisasi(
        pendaftarId,
        catatan || pesan,
        portalUrl
      );

      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal memproses follow-up pendaftar belum finalisasi.',
      });
    }
  }

  /**
   * Mengambil data modal Set Kelulusan (Informasi Pendaftar [Pengumuman Kelulusan])
   * GET /api/admin/ods/set-kelulusan/:id
   */
  async getDetailKelulusanModal(req: Request, res: Response): Promise<void> {
    try {
      const identifier = req.params.id || req.query.pendaftarId;
      if (!identifier) {
        res.status(400).json({ success: false, message: 'ID atau nomor pendaftar wajib disertakan.' });
        return;
      }

      const detail = await adminOdsService.getDetailKelulusanModal(identifier as string);
      res.json({
        success: true,
        message: 'Data modal pengumuman kelulusan ODS berhasil diambil.',
        data: detail,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Gagal mengambil data modal kelulusan ODS.',
      });
    }
  }

  /**
   * Simpan Kelulusan atau Tolak Pendaftar (Tombol "Simpan & Luluskan" / "Tolak Pendaftar")
   * POST /api/admin/ods/set-kelulusan
   */
  async setKelulusan(req: Request, res: Response): Promise<void> {
    try {
      const { pendaftarId, statusKelulusan, prodiDiterimaId, portalUrl, kirimNotifikasi } = req.body;

      if (!pendaftarId || !statusKelulusan) {
        res.status(400).json({
          success: false,
          message: 'pendaftarId dan statusKelulusan (LULUS / TIDAK_LULUS) wajib diisi.',
        });
        return;
      }

      const result = await adminOdsService.setKelulusanOds({
        pendaftarId,
        statusKelulusan,
        prodiDiterimaId,
        portalUrl,
        kirimNotifikasi: kirimNotifikasi !== false,
      });

      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal memproses status kelulusan ODS.',
      });
    }
  }

  /**
   * Preview Template Notifikasi WhatsApp Berkas ODS sebelum dikirim
   * GET /api/admin/ods/preview-wa/:id
   */
  async previewWaNotifikasi(req: Request, res: Response): Promise<void> {
    try {
      const identifier = req.params.id || req.query.pendaftarId;
      if (!identifier) {
        res.status(400).json({ success: false, message: 'ID atau nomor pendaftar wajib disertakan.' });
        return;
      }

      const portalUrl = req.query.portalUrl as string | undefined;
      const preview = await adminOdsService.previewWaNotifikasi(identifier as string, portalUrl);

      res.json({
        success: true,
        message: 'Preview notifikasi WhatsApp berhasil dibuat.',
        data: preview,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal membuat preview pesan WhatsApp.',
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

  /**
   * Mengambil data modal Masukkan Nilai (Informasi Pendaftar [Proses Seleksi])
   * GET /api/admin/ods/proses-seleksi/:id
   */
  async getDetailProsesSeleksiModal(req: Request, res: Response): Promise<void> {
    try {
      const identifier = req.params.id || req.query.pendaftarId;
      if (!identifier) {
        res.status(400).json({ success: false, message: 'ID atau nomor pendaftar wajib disertakan.' });
        return;
      }

      const detail = await adminOdsService.getDetailProsesSeleksiModal(identifier as string);
      res.json({
        success: true,
        message: 'Data modal proses seleksi ODS berhasil diambil.',
        data: detail,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Gagal mengambil data modal proses seleksi ODS.',
      });
    }
  }

  /**
   * Menyimpan nilai komponen seleksi (Tombol "Simpan Nilai")
   * POST /api/admin/ods/simpan-nilai
   */
  async simpanNilaiSeleksi(req: Request, res: Response): Promise<void> {
    try {
      const { pendaftarId, komponen } = req.body;

      if (!pendaftarId) {
        res.status(400).json({
          success: false,
          message: 'pendaftarId wajib diisi.',
        });
        return;
      }

      if (!komponen || !Array.isArray(komponen)) {
        res.status(400).json({
          success: false,
          message: 'komponen nilai harus berupa array.',
        });
        return;
      }

      const result = await adminOdsService.simpanNilaiSeleksi(pendaftarId, { komponen });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal menyimpan nilai seleksi ODS.',
      });
    }
  }

  /**
   * Mengambil detail komprehensif pendaftar ODS (Halaman Detail Pendaftar /ods_biodata/detail/:id)
   * GET /api/admin/ods/detail-pendaftar/:id
   * GET /api/admin/ods/detail/:id
   */
  async getDetailPendaftarOds(req: Request, res: Response): Promise<void> {
    try {
      const identifier = req.params.id || req.query.pendaftarId;
      if (!identifier) {
        res.status(400).json({ success: false, message: 'ID atau nomor pendaftar wajib disertakan.' });
        return;
      }

      const detail = await adminOdsService.getDetailPendaftarOds(identifier as string);
      res.json({
        success: true,
        message: 'Detail pendaftar ODS berhasil diambil.',
        data: detail,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Gagal mengambil detail pendaftar ODS.',
      });
    }
  }
}

export const adminOdsController = new AdminOdsController();
