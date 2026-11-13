import { camabaKatalogController } from './camaba/camabaKatalog.controller';
import { camabaAuthController } from './camaba/camabaAuth.controller';
import { camabaBiodataController } from './camaba/camabaBiodata.controller';
import { camabaRekamMedisController } from './camaba/camabaRekamMedis.controller';
import { camabaBerkasController } from './camaba/camabaBerkas.controller';
import { camabaPembayaranController } from './camaba/camabaPembayaran.controller';
import { camabaSeleksiController } from './camaba/camabaSeleksi.controller';

// Export sub-controller per domain
export {
  camabaKatalogController,
  camabaAuthController,
  camabaBiodataController,
  camabaRekamMedisController,
  camabaBerkasController,
  camabaPembayaranController,
  camabaSeleksiController,
};

// Aggregator class untuk backward compatibility
export class CamabaController {
  // Katalog
  getJenjang = camabaKatalogController.getJenjang.bind(camabaKatalogController);
  getSistemKuliah = camabaKatalogController.getSistemKuliah.bind(camabaKatalogController);
  getProgramStudi = camabaKatalogController.getProgramStudi.bind(camabaKatalogController);
  getProgramStudiDetail = camabaKatalogController.getProgramStudiDetail.bind(camabaKatalogController);
  getJalurPendaftaran = camabaKatalogController.getJalurPendaftaran.bind(camabaKatalogController);
  getJalurPendaftaranDetail = camabaKatalogController.getJalurPendaftaranDetail.bind(camabaKatalogController);
  getInformasi = camabaKatalogController.getInformasi.bind(camabaKatalogController);
  getInformasiDetail = camabaKatalogController.getInformasiDetail.bind(camabaKatalogController);
  getBrosur = camabaKatalogController.getBrosur.bind(camabaKatalogController);

  // Auth / Pendaftaran
  daftarJalur = camabaAuthController.daftarJalur.bind(camabaAuthController);

  // Biodata & Status
  getStatusPendaftaran = camabaBiodataController.getStatusPendaftaran.bind(camabaBiodataController);
  updateBiodata = camabaBiodataController.updateBiodata.bind(camabaBiodataController);

  // Rekam Medis
  getRekamMedis = camabaRekamMedisController.getRekamMedis.bind(camabaRekamMedisController);
  updateRekamMedis = camabaRekamMedisController.updateRekamMedis.bind(camabaRekamMedisController);

  // Berkas
  getBerkasList = camabaBerkasController.getBerkasList.bind(camabaBerkasController);
  uploadBerkas = camabaBerkasController.uploadBerkas.bind(camabaBerkasController);
  deleteBerkas = camabaBerkasController.deleteBerkas.bind(camabaBerkasController);

  // Pembayaran
  getTagihan = camabaPembayaranController.getTagihan.bind(camabaPembayaranController);
  simulasiBayar = camabaPembayaranController.simulasiBayar.bind(camabaPembayaranController);

  // Seleksi
  getKartuUjian = camabaSeleksiController.getKartuUjian.bind(camabaSeleksiController);
  getHasilSeleksi = camabaSeleksiController.getHasilSeleksi.bind(camabaSeleksiController);
}

export const camabaController = new CamabaController();
