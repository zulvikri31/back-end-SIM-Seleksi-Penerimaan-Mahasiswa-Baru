// Sub-services modular per domain
import { camabaKatalogService, CamabaFilterJalur, CamabaFilterProdi, CamabaFilterInformasi } from './camaba/camabaKatalog.service';
import { camabaAuthService, PendaftaranBaruDTO } from './camaba/camabaAuth.service';
import { camabaBiodataService, UpdateBiodataCamabaDTO } from './camaba/camabaBiodata.service';
import { camabaRekamMedisService, RekamMedisDTO } from './camaba/camabaRekamMedis.service';
import { camabaBerkasService } from './camaba/camabaBerkas.service';
import { camabaPembayaranService } from './camaba/camabaPembayaran.service';
import { camabaSeleksiService } from './camaba/camabaSeleksi.service';

// Re-export type & interfaces
export type {
  CamabaFilterJalur,
  CamabaFilterProdi,
  CamabaFilterInformasi,
  PendaftaranBaruDTO,
  UpdateBiodataCamabaDTO,
  RekamMedisDTO,
};

// Re-export individual services
export {
  camabaKatalogService,
  camabaAuthService,
  camabaBiodataService,
  camabaRekamMedisService,
  camabaBerkasService,
  camabaPembayaranService,
  camabaSeleksiService,
};

/**
 * Aggregator Service untuk backward compatibility penuh
 */
export class CamabaService {
  // Katalog
  getJenjangList = camabaKatalogService.getJenjangList.bind(camabaKatalogService);
  getSistemKuliahList = camabaKatalogService.getSistemKuliahList.bind(camabaKatalogService);
  getProgramStudiList = camabaKatalogService.getProgramStudiList.bind(camabaKatalogService);
  getProgramStudiDetail = camabaKatalogService.getProgramStudiDetail.bind(camabaKatalogService);
  getJalurPendaftaranList = camabaKatalogService.getJalurPendaftaranList.bind(camabaKatalogService);
  getJalurPendaftaranDetail = camabaKatalogService.getJalurPendaftaranDetail.bind(camabaKatalogService);
  getInformasiList = camabaKatalogService.getInformasiList.bind(camabaKatalogService);
  getInformasiDetail = camabaKatalogService.getInformasiDetail.bind(camabaKatalogService);
  getBrosurDanBiaya = camabaKatalogService.getBrosurDanBiaya.bind(camabaKatalogService);

  // Auth / Pendaftaran
  registerDanPilihJalur = camabaAuthService.registerDanPilihJalur.bind(camabaAuthService);
  getProfilCamaba = camabaAuthService.getProfilCamaba.bind(camabaAuthService);

  // Biodata & Status
  getStatusPendaftaranByUserId = camabaBiodataService.getStatusPendaftaranByUserId.bind(camabaBiodataService);
  updateBiodata = camabaBiodataService.updateBiodata.bind(camabaBiodataService);
  finalisasiPendaftaran = camabaBiodataService.finalisasiPendaftaran.bind(camabaBiodataService);

  // Rekam Medis
  getRekamMedisByUserId = camabaRekamMedisService.getRekamMedisByUserId.bind(camabaRekamMedisService);
  upsertRekamMedis = camabaRekamMedisService.upsertRekamMedis.bind(camabaRekamMedisService);

  // Berkas
  getBerkasList = camabaBerkasService.getBerkasList.bind(camabaBerkasService);
  uploadBerkas = camabaBerkasService.uploadBerkas.bind(camabaBerkasService);
  deleteBerkas = camabaBerkasService.deleteBerkas.bind(camabaBerkasService);

  // Pembayaran
  getTagihan = camabaPembayaranService.getTagihan.bind(camabaPembayaranService);
  simulasiBayar = camabaPembayaranService.simulasiBayar.bind(camabaPembayaranService);

  // Seleksi
  getKartuUjian = camabaSeleksiService.getKartuUjian.bind(camabaSeleksiService);
  getHasilSeleksi = camabaSeleksiService.getHasilSeleksi.bind(camabaSeleksiService);
}

export const camabaService = new CamabaService();
