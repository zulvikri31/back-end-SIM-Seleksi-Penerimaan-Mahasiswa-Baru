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
        periodeIds,
        gelombangId,
        gelombangIds,
        jalurPendaftaranId,
        jalurPendaftaranIds,
        jalurIds,
        sistemKuliahId,
        sistemKuliahIds,
        sistemIds,
        programStudiId,
        programStudiIds,
        unitIds,
        prodiIds,
        statusPendaftar,
        statusKelulusan,
        pilihan,
        search,
        searchBy,
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
      const gelombangList = parseNumList(gelombangIds);
      const sistemList = parseNumList(sistemKuliahIds || sistemIds);
      const periodeList = parseNumList(periodeIds);

      const result = await adminPendaftarService.getPendaftarList({
        periodeId: periodeId ? Number(periodeId) : undefined,
        periodeIds: periodeList.length > 0 ? periodeList : undefined,
        gelombangId: gelombangId ? Number(gelombangId) : undefined,
        gelombangIds: gelombangList.length > 0 ? gelombangList : undefined,
        jalurPendaftaranId: jalurPendaftaranId ? Number(jalurPendaftaranId) : undefined,
        jalurPendaftaranIds: jalurList.length > 0 ? jalurList : undefined,
        sistemKuliahId: sistemKuliahId ? Number(sistemKuliahId) : undefined,
        sistemKuliahIds: sistemList.length > 0 ? sistemList : undefined,
        programStudiId: programStudiId ? Number(programStudiId) : undefined,
        programStudiIds: prodiList.length > 0 ? prodiList : undefined,
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
   * Mengambil data Rekam Medis pendaftar
   * GET /api/admin/pendaftar/:id/rekam-medis
   */
  async getRekamMedis(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id || '').trim();
      const result = await adminPendaftarService.getRekamMedis(id);
      res.json({
        success: true,
        message: 'Data rekam medis pendaftar berhasil diambil.',
        data: result,
      });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message || 'Rekam medis tidak ditemukan.' });
    }
  }

  /**
   * Mengupdate / Mengisi data Rekam Medis pendaftar oleh Admin
   * PUT /api/admin/pendaftar/:id/rekam-medis
   */
  async updateRekamMedis(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id || '').trim();
      const result = await adminPendaftarService.updateRekamMedis(id, req.body);
      res.json({
        success: true,
        message: 'Data rekam medis pendaftar berhasil diperbarui.',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Gagal memperbarui rekam medis.' });
    }
  }

  /**
   * Update data spesifik per Vertical Tab
   * PUT /api/admin/pendaftar/:id/tab/:tabName
   */
  async updateVerticalTab(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id || '').trim();
      const tabName = String(req.params.tabName || '').trim();
      const result = await adminPendaftarService.updateVerticalTab(id, tabName, req.body);
      res.json({
        success: true,
        message: `Data tab ${tabName} berhasil diperbarui.`,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || `Gagal memperbarui tab ${req.params.tabName}.` });
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
   * Tambah Pendaftar Baru (Screenshot 2: Tombol + Tambah)
   * POST /api/admin/pendaftar
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body;
      const result = await adminPendaftarService.createPendaftar(data);
      res.status(201).json({
        success: true,
        message: 'Pendaftar baru berhasil ditambahkan.',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal menambahkan pendaftar baru.',
      });
    }
  }

  /**
   * Update Pendaftar & Biodata Diri (Screenshot 2: Tombol Simpan)
   * PUT /api/admin/pendaftar/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id || '').trim();
      const data = req.body;
      const result = await adminPendaftarService.updatePendaftar(id, data);
      res.json({
        success: true,
        message: 'Data pendaftar berhasil diperbarui.',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal memperbarui data pendaftar.',
      });
    }
  }

  /**
   * Hapus Masal (Bulk Delete) Pendaftar (Screenshot 1 & 3: Tombol Hapus Atas Tabel)
   * POST /api/admin/pendaftar/bulk-delete atau DELETE /api/admin/pendaftar
   * Body: { ids: [1, 2, "4102520254"] }
   */
  async bulkDelete(req: Request, res: Response): Promise<void> {
    try {
      const ids = req.body.ids || req.body.pendaftarIds || req.body.idPendaftarList;
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Parameter ids (array ID atau nomor pendaftar) wajib diisi.',
        });
        return;
      }

      const result = await adminPendaftarService.bulkDeletePendaftar(ids);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal menghapus masal pendaftar.',
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

  /**
   * 1. Review Data Pendaftar (Dropdown Aksi -> Review Data Pendaftar)
   * GET /api/admin/pendaftar/review-data
   */
  async getReviewData(req: Request, res: Response): Promise<void> {
    try {
      const data = await adminPendaftarService.getReviewData(req.query);
      res.json({
        success: true,
        message: 'Data review status pendaftaran berhasil diambil.',
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil data review pendaftar.',
      });
    }
  }

  /**
   * 2. Set KIP Kuliah (Dropdown Aksi -> Set KIP Kuliah)
   * POST /api/admin/pendaftar/set-kip
   */
  async setKip(req: Request, res: Response): Promise<void> {
    try {
      const result = await adminPendaftarService.setKipKuliah(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal mengatur status KIP Kuliah.',
      });
    }
  }

  /**
   * 3. Set Finalisasi (Dropdown Aksi -> Set Finalisasi)
   * POST /api/admin/pendaftar/set-finalisasi
   */
  async setFinalisasi(req: Request, res: Response): Promise<void> {
    try {
      const result = await adminPendaftarService.setFinalisasi(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal mengatur status finalisasi.',
      });
    }
  }

  /**
   * 4a. Download Template Excel Update Pendaftar (Dropdown Aksi -> Update Data Pendaftar -> Download)
   * GET /api/admin/pendaftar/template/update
   */
  async downloadUpdateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const buffer = await adminPendaftarService.generateUpdateTemplate(req.query);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Template_Update_Pendaftar_UIKA.xlsx"');
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mendownload template update pendaftar.',
      });
    }
  }

  /**
   * 4b. Update Batch Pendaftar dari Excel (Dropdown Aksi -> Update Data Pendaftar -> Update)
   * POST /api/admin/pendaftar/update-batch-excel
   */
  async updateBatchExcel(req: Request, res: Response): Promise<void> {
    try {
      const file = (req as any).file;
      const rows = req.body.rows || req.body;
      const bufferOrRows = file ? file.buffer : rows;

      if (!bufferOrRows) {
        res.status(400).json({
          success: false,
          message: 'Harap upload file Excel (.xlsx/.xls) atau sertakan JSON array rows.',
        });
        return;
      }

      const result = await adminPendaftarService.updateBatchExcel(bufferOrRows);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal memperbarui data pendaftar dari Excel.',
      });
    }
  }

  /**
   * 5. Reset Password Pendaftar (Dropdown Aksi -> Reset Password Pendaftar)
   * POST /api/admin/pendaftar/reset-password
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const result = await adminPendaftarService.resetPasswordPendaftar(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal mereset password pendaftar.',
      });
    }
  }

  /**
   * 6a. Download Template Excel Import Pendaftar Baru (Dropdown Aksi -> Import -> Download)
   * GET /api/admin/pendaftar/template/import
   */
  async downloadImportTemplate(req: Request, res: Response): Promise<void> {
    try {
      const buffer = await adminPendaftarService.generateImportTemplate();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Template_Import_Pendaftar_UIKA.xlsx"');
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mendownload template import pendaftar.',
      });
    }
  }

  /**
   * 6b. Import Data Pendaftar Baru dari Excel (Dropdown Aksi -> Import)
   * POST /api/admin/pendaftar/import
   */
  async importExcel(req: Request, res: Response): Promise<void> {
    try {
      const file = (req as any).file;
      const rows = req.body.rows || req.body;
      const bufferOrRows = file ? file.buffer : rows;

      if (!bufferOrRows) {
        res.status(400).json({
          success: false,
          message: 'Harap upload file Excel (.xlsx/.xls) atau sertakan JSON array rows.',
        });
        return;
      }

      const options = {
        periodeId: req.body.periodeId ? Number(req.body.periodeId) : undefined,
        jalurPendaftaranId: req.body.jalurPendaftaranId ? Number(req.body.jalurPendaftaranId) : undefined,
        gelombangId: req.body.gelombangId ? Number(req.body.gelombangId) : undefined,
        sistemKuliahId: req.body.sistemKuliahId ? Number(req.body.sistemKuliahId) : undefined,
        periodeDaftar: req.body.periodeDaftar ? String(req.body.periodeDaftar) : undefined,
      };

      const result = await adminPendaftarService.importPendaftarExcel(bufferOrRows, options);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal mengimpor data pendaftar baru dari Excel.',
      });
    }
  }

  // ========================================================
  // CONTROLLER: LEADS MAUKULIAH (Bagian dari Modul Pendaftar)
  // ========================================================

  /**
   * Opsi filter dropdown Leads Maukuliah (Tahun Masuk, Sumber Leads, Status Leads)
   * GET /api/admin/pendaftar/leads/dropdown-options
   */
  async getLeadsDropdownOptions(req: Request, res: Response): Promise<void> {
    try {
      const data = await adminPendaftarService.getLeadsDropdownOptions();
      res.json({
        success: true,
        message: 'Opsi dropdown filter Leads Maukuliah berhasil diambil.',
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil opsi dropdown Leads.',
      });
    }
  }

  /**
   * Daftar data Leads Maukuliah dengan filter dan pagination (Screenshot Leads Maukuliah)
   * GET /api/admin/pendaftar/leads
   */
  async getLeadsList(req: Request, res: Response): Promise<void> {
    try {
      const { tahunMasuk, sumberData, status, isDihubungi, search, searchBy, page, limit } = req.query;

      const result = await adminPendaftarService.getLeadsList({
        tahunMasuk: tahunMasuk ? Number(tahunMasuk) : undefined,
        sumberData: sumberData ? String(sumberData) : undefined,
        status: status ? String(status) : undefined,
        isDihubungi: isDihubungi !== undefined ? isDihubungi === 'true' : undefined,
        search: search ? String(search) : undefined,
        searchBy: searchBy ? String(searchBy) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
      });

      res.json({
        success: true,
        message: 'Data Leads Maukuliah berhasil diambil.',
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil data Leads Maukuliah.',
      });
    }
  }

  /**
   * Detail 1 Leads Maukuliah (Aksi tombol Cyan Mata)
   * GET /api/admin/pendaftar/leads/:id
   */
  async getLeadsDetail(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID Leads harus berupa angka.' });
        return;
      }

      const data = await adminPendaftarService.getLeadsDetail(id);
      res.json({
        success: true,
        message: 'Detail Leads Maukuliah berhasil diambil.',
        data,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Data Leads tidak ditemukan.',
      });
    }
  }

  /**
   * Tandai / Follow up Leads Sudah Dihubungi (Aksi tombol Hijau Centang)
   * POST /api/admin/pendaftar/leads/:id/hubungi
   */
  async hubungiLeads(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID Leads harus berupa angka.' });
        return;
      }

      const result = await adminPendaftarService.hubungiLeads(id, req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal mencatat status follow up Leads.',
      });
    }
  }

  /**
   * Tambah Leads Baru
   * POST /api/admin/pendaftar/leads
   */
  async createLeads(req: Request, res: Response): Promise<void> {
    try {
      const result = await adminPendaftarService.createLeads(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Gagal menambahkan Leads baru.',
      });
    }
  }
}

export const adminPendaftarController = new AdminPendaftarController();
