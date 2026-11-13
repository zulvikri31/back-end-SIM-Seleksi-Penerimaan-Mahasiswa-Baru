import { Request, Response } from 'express';
import { adminDashboardService, GlobalDashboardFilter } from '../services/adminDashboard.service';

const parseNumberArray = (val: any): number[] => {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map((v) => Number(v)).filter((n) => !isNaN(n) && n > 0);
  }
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);
  }
  if (typeof val === 'number' && val > 0) {
    return [val];
  }
  return [];
};

const parseStringArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const parseGlobalFilter = (req: Request): GlobalDashboardFilter => {
  const {
    periodeId,
    periodeIds,
    kodePeriode,
    tahun,
    programStudiIds,
    programStudiId,
    unitIds,
    unitId,
    prodiIds,
    prodiId,
    jalurPendaftaranIds,
    jalurIds,
    jalurId,
    sistemKuliahIds,
    sistemIds,
    sistemKuliahId,
    gelombangIds,
    gelombangId,
    jenisPendaftaran,
    jenjang,
    frekuensi,
    jenisPerhitungan,
    sebaran,
    mode,
    search,
    page,
    limit,
    provinsi,
    kabupatenKota,
    topKotaLimit,
    jenisPeriode,
  } = req.query;

  const sanitizeNum = (v: any) => {
    if (!v || v === 'undefined' || v === 'null') return undefined;
    const n = Number(v);
    return isNaN(n) ? undefined : n;
  };

  const prodiIdList = parseNumberArray(programStudiIds || unitIds || prodiIds || programStudiId || unitId || prodiId);
  const jalurIdList = parseNumberArray(jalurPendaftaranIds || jalurIds || jalurId);
  const sistemIdList = parseNumberArray(sistemKuliahIds || sistemIds || sistemKuliahId);
  const gelombangIdList = parseNumberArray(gelombangIds || gelombangId);
  const periodeIdList = parseNumberArray(periodeIds || (periodeId ? [periodeId] : []));
  const jenisPendaftaranList = parseStringArray(jenisPendaftaran);
  const jenjangList = parseStringArray(jenjang);

  return {
    periodeId: sanitizeNum(periodeId) || (periodeIdList.length === 1 ? periodeIdList[0] : undefined),
    periodeIds: periodeIdList,
    kodePeriode: kodePeriode && kodePeriode !== 'undefined' && kodePeriode !== 'null' ? String(kodePeriode).trim() : undefined,
    programStudiIds: prodiIdList,
    programStudiId: prodiIdList.length === 1 ? prodiIdList[0] : undefined,
    jalurPendaftaranIds: jalurIdList,
    jalurId: jalurIdList.length === 1 ? jalurIdList[0] : undefined,
    sistemKuliahIds: sistemIdList,
    sistemKuliahId: sistemIdList.length === 1 ? sistemIdList[0] : undefined,
    gelombangIds: gelombangIdList,
    gelombangId: gelombangIdList.length === 1 ? gelombangIdList[0] : undefined,
    jenisPendaftaran: jenisPendaftaranList,
    jenjang: jenjangList,
    frekuensi: frekuensi === 'harian' ? 'harian' : 'bulanan',
    jenisPerhitungan: jenisPerhitungan === 'kumulatif' ? 'kumulatif' : 'reguler',
    tahun: sanitizeNum(tahun),
    search: search ? String(search).trim() : undefined,
    page: page ? Math.max(1, Number(page)) : 1,
    limit: limit ? Math.max(1, Math.min(100, Number(limit))) : 10,
    mode: mode ? String(mode).trim() : undefined,
    sebaran: sebaran ? String(sebaran).trim() : 'pendaftar',
    provinsi: provinsi ? String(provinsi).trim() : undefined,
    kabupatenKota: kabupatenKota ? String(kabupatenKota).trim() : undefined,
    topKotaLimit: sanitizeNum(topKotaLimit),
    jenisPeriode: jenisPeriode ? String(jenisPeriode).trim() : undefined,
  };
};

export class AdminDashboardController {
  async getCharts(req: Request, res: Response): Promise<void> {
    try {
      const filter = parseGlobalFilter(req);
      const result = await adminDashboardService.getChartsData(filter);

      res.status(200).json({
        success: true,
        message: 'Data grafik & indikator dashboard admin berhasil diambil.',
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
      const filter = parseGlobalFilter(req);
      const result = await adminDashboardService.getSummaryData(filter);

      res.status(200).json({
        success: true,
        message: 'Data ringkasan kartu statistik berhasil diambil.',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat mengambil summary statistik.',
      });
    }
  }

  async getUnitTree(req: Request, res: Response): Promise<void> {
    try {
      const { search } = req.query;
      const result = await adminDashboardService.getUnitTree(search ? String(search) : undefined);

      res.status(200).json({
        success: true,
        message: 'Struktur hierarki Unit / Program Studi berhasil diambil.',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat mengambil unit tree.',
      });
    }
  }

  async getFilterOptions(_req: Request, res: Response): Promise<void> {
    try {
      const result = await adminDashboardService.getFilterOptions();

      res.status(200).json({
        success: true,
        message: 'Opsi filter lanjutan berhasil diambil.',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat mengambil opsi filter.',
      });
    }
  }

  async getFunnelPendaftaran(req: Request, res: Response): Promise<void> {
    try {
      const filter = parseGlobalFilter(req);
      const result = await adminDashboardService.getFunnelPendaftaranTree(filter);

      res.status(200).json({
        success: true,
        message: 'Data funnel pendaftaran berhasil diambil.',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat mengambil funnel pendaftaran.',
      });
    }
  }

  async getFunnelBulanan(req: Request, res: Response): Promise<void> {
    try {
      const filter = parseGlobalFilter(req);
      const result = await adminDashboardService.getFunnelBulananTree(filter);

      res.status(200).json({
        success: true,
        message: 'Data funnel bulanan berhasil diambil.',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat mengambil funnel bulanan.',
      });
    }
  }

  async getMahasiswaTahunan(req: Request, res: Response): Promise<void> {
    try {
      const filter = parseGlobalFilter(req);
      const result = await adminDashboardService.getMahasiswaKomparasiTahunan(filter);

      res.status(200).json({
        success: true,
        message: 'Data mahasiswa baru komparasi tahunan berhasil diambil.',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat mengambil komparasi tahunan.',
      });
    }
  }

  async getWilayah(req: Request, res: Response): Promise<void> {
    try {
      const filter = parseGlobalFilter(req);
      const result = await adminDashboardService.getPenerimaanWilayah(filter);

      res.status(200).json({
        success: true,
        message: 'Data penerimaan wilayah berhasil diambil.',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat mengambil data wilayah.',
      });
    }
  }

  async getPetaWilayah(req: Request, res: Response): Promise<void> {
    try {
      const filter = parseGlobalFilter(req);
      const result = await adminDashboardService.getPetaWilayahSebaran(filter);

      res.status(200).json({
        success: true,
        message: 'Data peta wilayah sebaran pendaftar berhasil diambil.',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat mengambil data peta wilayah.',
      });
    }
  }

  async getSekolah(req: Request, res: Response): Promise<void> {
    try {
      const filter = parseGlobalFilter(req);
      const result = await adminDashboardService.getPenerimaanSekolah(filter);

      res.status(200).json({
        success: true,
        message: 'Data penerimaan sekolah berhasil diambil.',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat mengambil data sekolah.',
      });
    }
  }

  async getPerguruanTinggi(req: Request, res: Response): Promise<void> {
    try {
      const filter = parseGlobalFilter(req);
      const result = await adminDashboardService.getPerguruanTinggi(filter);

      res.status(200).json({
        success: true,
        message: 'Data perkembangan asal perguruan tinggi / prodi berhasil diambil.',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil data perguruan tinggi.',
      });
    }
  }

  async getPerusahaan(req: Request, res: Response): Promise<void> {
    try {
      const filter = parseGlobalFilter(req);
      const result = await adminDashboardService.getPerusahaan(filter);

      res.status(200).json({
        success: true,
        message: 'Data penerimaan mahasiswa asal perusahaan berhasil diambil.',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil data perusahaan.',
      });
    }
  }

  async getSeleksi(req: Request, res: Response): Promise<void> {
    try {
      const filter = parseGlobalFilter(req);
      const result = await adminDashboardService.getDashboardSeleksi(filter);

      res.status(200).json({
        success: true,
        message: 'Data rekapitulasi nilai seleksi berhasil diambil.',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil data seleksi.',
      });
    }
  }

  async getKuesioner(req: Request, res: Response): Promise<void> {
    try {
      const filter = parseGlobalFilter(req);
      const result = await adminDashboardService.getDashboardKuesioner(filter);

      res.status(200).json({
        success: true,
        message: 'Data hasil kuesioner PMB berhasil diambil.',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil data kuesioner.',
      });
    }
  }

  async getOrangTua(req: Request, res: Response): Promise<void> {
    try {
      const filter = parseGlobalFilter(req);
      const result = await adminDashboardService.getDashboardOrangTua(filter);

      res.status(200).json({
        success: true,
        message: 'Data sebaran profil orang tua berhasil diambil.',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Gagal mengambil data profil orang tua.',
      });
    }
  }
}

export const adminDashboardController = new AdminDashboardController();
