import prisma from '../config/database';
import { whatsappService, BerkasNotifikasiItem } from './whatsapp.service';

export interface FilterOds {
  periodeId?: number;
  periodeIds?: number[];
  programStudiId?: number;
  programStudiIds?: number[];
  jalurPendaftaranId?: number;
  jalurPendaftaranIds?: number[];
  sistemKuliahId?: number;
  gelombangId?: number;
  statusOds?: string;
  isOdsDihubungi?: boolean;
  statusVerifikasiTab?: 'perlu-diverifikasi' | 'belum-finalisasi' | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

export class AdminOdsService {
  /**
   * Daftar standar master berkas pendaftaran S1 ODS UIKA (sesuai UI Sevima Screenshot Belum Finalisasi)
   */
  readonly MASTER_BERKAS_S1 = [
    { jenis: 'IJAZAH_RAPOR_SKL', nama: 'Ijazah/Surat Keterangan Lulus/Rapor Semester 1 (satu) s.d 5 (lima) yang dilegalisir', wajib: true },
    { jenis: 'KTP', nama: 'KTP', wajib: true },
    { jenis: 'KARTU_KELUARGA', nama: 'Kartu Keluarga', wajib: false },
    { jenis: 'PASFOTO', nama: 'Pasfoto Formal Warna Terbaru (Tidak Selfie)', wajib: false },
    { jenis: 'RAPORT_SEMESTER', nama: 'Raport Semester 1 (satu) s.d. 5 (lima)', wajib: false },
    { jenis: 'SKL', nama: 'Surat Keterangan Lulus (SKL)', wajib: false },
    { jenis: 'TRANSKRIP_NILAI', nama: 'Transkrip Nilai/SKHUN Asli atau Fotocopy yang sudah dilegalisir', wajib: false },
  ];

  /**
   * Daftar standar master berkas pendaftaran S2 / Pascasarjana ODS UIKA (sesuai UI Sevima Screenshot Perlu Diverifikasi)
   */
  readonly MASTER_BERKAS_S2 = [
    { jenis: 'KTP', nama: 'KTP', wajib: true },
    { jenis: 'IJAZAH_S1', nama: 'Scan Ijazah S1', wajib: true },
    { jenis: 'KARTU_KELUARGA', nama: 'Kartu Keluarga', wajib: false },
    { jenis: 'PASFOTO', nama: 'Pasfoto Formal Warna Terbaru (Tidak Selfie)', wajib: false },
    { jenis: 'TRANSKRIP_NILAI', nama: 'Scan Transkrip Nilai S1 yang telah dilegalisir', wajib: false },
  ];

  /**
   * 1. Mengambil Daftar Calon Mahasiswa One Day Service (ODS)
   */
  async getOdsList(filter: FilterOds) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filter.periodeIds && filter.periodeIds.length > 0) {
      where.periodeId = { in: filter.periodeIds };
    } else if (filter.periodeId) {
      where.periodeId = Number(filter.periodeId);
    }

    if (filter.programStudiIds && filter.programStudiIds.length > 0) {
      where.OR = [
        { programStudiId: { in: filter.programStudiIds } },
        { pilihanProdi2Id: { in: filter.programStudiIds } },
        { pilihanProdi3Id: { in: filter.programStudiIds } },
      ];
    } else if (filter.programStudiId) {
      const pid = Number(filter.programStudiId);
      where.OR = [
        { programStudiId: pid },
        { pilihanProdi2Id: pid },
        { pilihanProdi3Id: pid },
      ];
    }

    if (filter.jalurPendaftaranIds && filter.jalurPendaftaranIds.length > 0) {
      where.jalurPendaftaranId = { in: filter.jalurPendaftaranIds };
    } else if (filter.jalurPendaftaranId) {
      where.jalurPendaftaranId = Number(filter.jalurPendaftaranId);
    }

    if (filter.gelombangId) {
      where.gelombangId = Number(filter.gelombangId);
    }
    if (filter.sistemKuliahId) {
      where.sistemKuliahId = Number(filter.sistemKuliahId);
    }

    if (filter.statusOds && filter.statusOds !== 'all') {
      where.statusOds = filter.statusOds;
    }
    if (filter.isOdsDihubungi !== undefined) {
      where.isOdsDihubungi = filter.isOdsDihubungi;
    }

    // Filter subtab: Perlu Diverifikasi vs Belum Finalisasi
    if (filter.statusVerifikasiTab === 'perlu-diverifikasi') {
      where.isFinalisasi = true;
    } else if (filter.statusVerifikasiTab === 'belum-finalisasi') {
      where.isFinalisasi = false;
    }

    if (filter.search && filter.search.trim() !== '') {
      const q = filter.search.trim();
      where.OR = [
        { noPendaftaran: { contains: q, mode: 'insensitive' } },
        { user: { nama: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { noHp: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Hitung count masing-masing subtab secara independen dari filter tab yang aktif
    const baseCountWhere = { ...where };
    delete baseCountWhere.isFinalisasi;
    delete baseCountWhere.statusVerifikasiBerkas;

    const [total, items, countPerluDiverifikasi, countBelumFinalisasi] = await Promise.all([
      prisma.pendaftar.count({ where }),
      prisma.pendaftar.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isFinalisasi: 'asc' }, { id: 'desc' }],
        include: {
          user: true,
          programStudi: true,
          pilihanProdi2: true,
          pilihanProdi3: true,
          jalurPendaftaran: true,
          gelombang: true,
          sistemKuliah: true,
          periode: true,
          berkas: true,
          nilaiSeleksi: true,
        },
      }),
      prisma.pendaftar.count({
        where: {
          ...baseCountWhere,
          isFinalisasi: true,
        },
      }),
      prisma.pendaftar.count({
        where: {
          ...baseCountWhere,
          isFinalisasi: false,
        },
      }),
    ]);

    const dataFormatted = items.map((p, idx) => {
      const genderCode = p.jenisKelamin ? (p.jenisKelamin.toUpperCase().startsWith('L') ? ' (L)' : ' (P)') : '';
      const isFinal = Boolean(p.isFinalisasi);

      return {
        no: skip + idx + 1,
        id: p.id,
        pendaftar: {
          noPendaftaran: p.noPendaftaran || `ODS-${String(p.id).padStart(4, '0')}`,
          nama: `${p.user.nama}${genderCode}`,
          namaLengkap: p.user.nama,
          jenisKelamin: p.jenisKelamin || '-',
          nik: p.nik || '-',
        },
        periode: {
          nama: `${p.periode?.nama || '-'} - ${p.sistemKuliah?.nama || 'Reguler'}`,
          detail: `${p.jalurPendaftaran?.nama || '-'} - ${p.gelombang?.nama || 'Gelombang 1'}`,
          teksLengkap: `${p.periode?.nama || '-'} - ${p.sistemKuliah?.nama || 'Reguler'} ${p.jalurPendaftaran?.nama || '-'} - ${p.gelombang?.nama || 'Gelombang 1'}`,
        },
        prodiPilihan: {
          pilihan1: p.programStudi ? `${p.programStudi.jenjang} ${p.programStudi.namaProdi}` : '-',
          pilihan2: p.pilihanProdi2 ? `${p.pilihanProdi2.jenjang} ${p.pilihanProdi2.namaProdi}` : '-',
          pilihan3: p.pilihanProdi3 ? `${p.pilihanProdi3.jenjang} ${p.pilihanProdi3.namaProdi}` : '-',
          list: [
            p.programStudi ? `${p.programStudi.jenjang} ${p.programStudi.namaProdi}` : null,
            p.pilihanProdi2 ? `${p.pilihanProdi2.jenjang} ${p.pilihanProdi2.namaProdi}` : null,
            p.pilihanProdi3 ? `${p.pilihanProdi3.jenjang} ${p.pilihanProdi3.namaProdi}` : null,
          ].filter(Boolean),
        },
        kontakPendaftar: {
          email: p.user.email,
          noHp: p.noHp || '-',
          waLink: p.noHp ? whatsappService.generateWaLink(p.noHp, `Halo Sdr/i ${p.user.nama}, kami dari Panitia ODS SPMB UIKA Bogor...`) : null,
        },
        status: {
          statusOds: p.statusOds, // PEMINAT, PENDAFTAR, PESERTA_SELEKSI, DAFTAR_ULANG
          statusVerifikasiBerkas: isFinal ? (p.statusVerifikasiBerkas || 'PERLU_DIVERIFIKASI') : 'BELUM_FINALISASI',
          isFinalisasi: isFinal,
          isOdsDihubungi: p.isOdsDihubungi,
          catatanOds: p.catatanOds || '-',
          totalBerkasDiunggah: p.berkas.length,
          totalSeleksi: p.nilaiSeleksi.length,
        },
        seleksi: (p.nilaiSeleksi || []).map((ns) => {
          const isBelumTes = !ns.nilai || ns.nilai === 0;
          return {
            id: ns.id,
            jenisTes: ns.jenisTes,
            komposisi: ns.komposisi || '-',
            nilai: ns.nilai,
            nilaiAkhir: ns.nilaiAkhir,
            dokumenUrl: ns.dokumenUrl || null,
            statusText: isBelumTes ? 'Belum Tes' : `${ns.nilai}`,
            statusKelulusanTes: ns.statusKelulusanTes || (isBelumTes ? 'BELUM_TES' : 'LULUS'),
            isBelumTes,
          };
        }),
        aksi: (() => {
          if (p.statusOds === 'PESERTA_SELEKSI') {
            const hasUnscoredTest = (p.nilaiSeleksi || []).length === 0 || (p.nilaiSeleksi || []).some(
              (ns) => !ns.nilai || ns.nilai === 0 || ns.statusKelulusanTes === 'DIPROSES'
            );
            return {
              label: hasUnscoredTest ? 'Masukkan Nilai' : 'Set Kelulusan',
              icon: hasUnscoredTest ? 'edit' : 'user-check',
              tipeModal: hasUnscoredTest ? 'MASUKKAN_NILAI' : 'SET_KELULUSAN',
            };
          } else if (p.statusOds === 'PENDAFTAR') {
            return {
              label: isFinal ? 'Verifikasi Berkas' : 'Lihat Detail',
              icon: isFinal ? 'check-square' : 'eye',
              tipeModal: isFinal ? 'PERLU_DIVERIFIKASI' : 'BELUM_FINALISASI',
            };
          } else if (p.statusOds === 'DAFTAR_ULANG') {
            return {
              label: 'Daftar Ulang',
              icon: 'clipboard',
              tipeModal: 'DAFTAR_ULANG',
            };
          }
          return {
            label: 'Lihat Detail',
            icon: 'eye',
            tipeModal: 'BELUM_FINALISASI',
          };
        })(),
        tanggalDaftar: p.createdAt,
      };
    });

    return {
      data: dataFormatted,
      summaryTabs: {
        perluDiverifikasi: countPerluDiverifikasi,
        belumFinalisasi: countBelumFinalisasi,
      },
      pagination: {
        totalItems: total,
        currentPage: page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Helper untuk mencari pendaftar secara aman (mendukung ID integer, noPendaftaran, nomorUjian, email)
   */
  async findPendaftar(identifier: number | string) {
    const str = String(identifier).trim();
    const num = Number(str);
    const isValidIntId = !isNaN(num) && Number.isInteger(num) && num > 0 && num <= 2147483647;

    const includeRelations = {
      user: true,
      programStudi: true,
      pilihanProdi2: true,
      pilihanProdi3: true,
      prodiDiterima: true,
      jalurPendaftaran: true,
      gelombang: true,
      sistemKuliah: true,
      periode: true,
      berkas: true,
      nilaiSeleksi: true,
      orangTua: true,
      rekamMedis: true,
    };

    if (isValidIntId) {
      const p = await prisma.pendaftar.findUnique({
        where: { id: num },
        include: includeRelations,
      });
      if (p) return p;
    }

    return prisma.pendaftar.findFirst({
      where: {
        OR: [
          { noPendaftaran: str },
          { nomorUjian: str },
          { user: { email: str } },
        ],
      },
      include: includeRelations,
    });
  }

  /**
   * 2. Mengambil Detail Berkas & Data Pendaftar untuk Modal:
   * - Modal "Informasi Pendaftar [Berkas Perlu Diverifikasi]" (Jika sudah finalisasi)
   * - Modal "Informasi Pendaftar [Belum Finalisasi]" (Jika belum finalisasi)
   */
  async getDetailVerifikasiBerkas(identifier: number | string, portalUrl?: string) {
    const pendaftar = await this.findPendaftar(identifier);
    if (!pendaftar) {
      throw new Error(`Data pendaftar "${identifier}" tidak ditemukan.`);
    }

    const isFinal = Boolean(pendaftar.isFinalisasi);
    const isDaftarUlang = pendaftar.statusOds === 'DAFTAR_ULANG';

    // Tentukan master berkas berdasarkan jenjang pendaftaran (S1 vs S2/S3)
    const isPascasarjana =
      pendaftar.programStudi?.jenjang === 'S2' ||
      pendaftar.programStudi?.jenjang === 'S3' ||
      pendaftar.jalurPendaftaran?.nama?.toUpperCase().includes('PASCA');

    const masterBerkas = isPascasarjana ? this.MASTER_BERKAS_S2 : this.MASTER_BERKAS_S1;

    // Mapping berkas yang sudah diunggah oleh pendaftar
    const uploadedMap = new Map<string, any>();
    for (const b of pendaftar.berkas) {
      const key = b.jenisBerkas.toUpperCase().trim();
      uploadedMap.set(key, b);
    }

    let berkasModalList: any[] = [];
    const tidakAdaSyaratBerkas = isDaftarUlang && pendaftar.berkas.length === 0;

    if (!tidakAdaSyaratBerkas) {
      berkasModalList = masterBerkas.map((master) => {
        const uploaded =
          uploadedMap.get(master.jenis.toUpperCase()) ||
          uploadedMap.get(master.nama.toUpperCase()) ||
          Array.from(uploadedMap.values()).find((item) =>
            item.jenisBerkas.toUpperCase().includes(master.jenis) ||
            (item.namaBerkas && item.namaBerkas.toUpperCase().includes(master.jenis))
          );

        let statusRaw = uploaded ? uploaded.statusVerifikasi : 'DIPROSES';
        let statusFormatted = 'Diproses';
        if (statusRaw.toUpperCase().includes('TERIMA')) statusFormatted = 'Diterima';
        else if (statusRaw.toUpperCase().includes('TOLAK')) statusFormatted = 'Ditolak';
        else if (statusRaw.toUpperCase().includes('PERBAIK') || statusRaw.toUpperCase().includes('TANGGUH')) statusFormatted = 'Perlu Perbaikan';
        else statusFormatted = 'Diproses';

        const fileName = uploaded?.fileUrl
          ? uploaded.fileUrl.split('/').pop() || `${pendaftar.noPendaftaran || pendaftar.id} - ${master.nama}`
          : (isFinal ? 'Belum ada berkas' : 'Belum ada data');

        return {
          id: uploaded?.id || null,
          jenisBerkas: master.jenis,
          namaBerkas: master.nama,
          isWajib: master.wajib,
          hasFile: Boolean(uploaded?.fileUrl),
          fileName,
          fileUrl: uploaded?.fileUrl || null,
          statusData: uploaded?.fileUrl ? 'Sudah Diunggah' : 'Belum ada data',
          statusVerifikasi: statusFormatted, // 'Diproses' | 'Diterima' | 'Ditolak' | 'Perlu Perbaikan'
          statusVerifikasiCode: statusFormatted.toUpperCase().replace(/\s+/g, '_'),
          catatan: uploaded?.catatan || '',
        };
      });
    }

    const genderCode = pendaftar.jenisKelamin ? (pendaftar.jenisKelamin.toUpperCase().startsWith('L') ? ' (L)' : ' (P)') : '';

    // Siapkan template reminder follow up jika pendaftar belum finalisasi
    let waReminder = null;
    if (!isFinal && !isDaftarUlang && pendaftar.noHp) {
      const berkasBelum = berkasModalList.filter((b) => !b.hasFile).map((b) => b.namaBerkas);
      waReminder = whatsappService.generateReminderBelumFinalisasiMessage(
        {
          id: pendaftar.id,
          noPendaftaran: pendaftar.noPendaftaran,
          nama: pendaftar.user.nama,
          noHp: pendaftar.noHp,
          email: pendaftar.user.email,
          periode: pendaftar.periode?.nama,
          jalur: pendaftar.jalurPendaftaran?.nama,
          prodi: pendaftar.programStudi ? `${pendaftar.programStudi.jenjang} - ${pendaftar.programStudi.namaProdi}` : undefined,
        },
        berkasBelum,
        portalUrl
      );
    }

    return {
      pendaftar: {
        id: pendaftar.id,
        noPendaftaran: pendaftar.noPendaftaran || `ODS-${String(pendaftar.id).padStart(4, '0')}`,
        nama: `${pendaftar.user.nama}${genderCode}`,
        namaAsli: pendaftar.user.nama,
        nik: pendaftar.nik || '-',
        asalInstitusi: pendaftar.asalSekolah || pendaftar.asalPerguruanTinggi || 'SMAS PGRI 3 JAKARTA',
        jurusan: pendaftar.jurusanPendidikan || 'IPS',
        jalurPendaftaran: pendaftar.jalurPendaftaran?.nama || 'SELEKSI MANDIRI',
        gelombang: pendaftar.gelombang?.nama || 'Gelombang 1',
        periode: pendaftar.periode?.nama || '2026 Ganjil',
        sistemKuliah: pendaftar.sistemKuliah?.nama || 'Reguler',
        pilihanProdi1: pendaftar.programStudi ? `${pendaftar.programStudi.jenjang} - ${pendaftar.programStudi.namaProdi}` : '-',
        pilihanProdi2: pendaftar.pilihanProdi2 ? `${pendaftar.pilihanProdi2.jenjang} - ${pendaftar.pilihanProdi2.namaProdi}` : '-',
        pilihanProdi3: pendaftar.pilihanProdi3 ? `${pendaftar.pilihanProdi3.jenjang} - ${pendaftar.pilihanProdi3.namaProdi}` : '-',
        statusVerifikasiBerkas: isFinal ? (pendaftar.statusVerifikasiBerkas || 'PERLU_DIVERIFIKASI') : 'BELUM_FINALISASI',
        badgeStatus: isFinal || isDaftarUlang ? 'Berkas Perlu Diverifikasi' : 'Belum Finalisasi',
        isFinalisasi: isFinal,
      },
      kontak: {
        email: pendaftar.user.email,
        noHp: pendaftar.noHp || '-',
      },
      tombolAksi: {
        lihatDetailPendaftar: true,
        hubungiPendaftar: !isFinal && !isDaftarUlang,
        simpan: isFinal || isDaftarUlang,
        simpanVerifikasi: isFinal || isDaftarUlang,
        simpanKirimNotifikasi: isFinal || isDaftarUlang,
      },
      detailPendaftarUrl: `/api/admin/ods/detail-pendaftar/${pendaftar.noPendaftaran || pendaftar.id}`,
      waReminder,
      opsiStatusDropdown: [
        { label: 'Diproses', value: 'DIPROSES' },
        { label: 'Diterima', value: 'DITERIMA' },
        { label: 'Ditolak', value: 'DITOLAK' },
        { label: 'Perlu Perbaikan', value: 'PERLU_PERBAIKAN' },
      ],
      tidakAdaSyaratBerkas,
      pesanSyaratBerkas: tidakAdaSyaratBerkas ? 'Tidak ada syarat berkas' : null,
      berkas: berkasModalList,
    };
  }

  /**
   * 3. Verifikasi Berkas Pendaftar ODS (Tombol "Simpan" & "Simpan & Kirim Notifikasi")
   */
  async verifikasiBerkas(
    pendaftarId: number | string,
    payload: {
      berkas: Array<{
        id?: number | null;
        jenisBerkas?: string;
        namaBerkas?: string;
        statusVerifikasi: string;
        catatan?: string;
        isWajib?: boolean;
      }>;
      kirimNotifikasi?: boolean;
      portalUrl?: string;
    }
  ) {
    const pendaftar = await this.findPendaftar(pendaftarId);
    if (!pendaftar) {
      throw new Error(`Data pendaftar "${pendaftarId}" tidak ditemukan.`);
    }

    const normalizeStatusCode = (raw: string) => {
      const s = (raw || '').toUpperCase().trim();
      if (s.includes('TOLAK')) return 'DITOLAK';
      if (s.includes('PERBAIK') || s.includes('TANGGUH')) return 'PERLU_PERBAIKAN';
      if (s.includes('TERIMA') || s.includes('SESUAI')) return 'DITERIMA';
      return 'DIPROSES';
    };

    const notifikasiItems: BerkasNotifikasiItem[] = [];

    for (const b of payload.berkas) {
      const statusCode = normalizeStatusCode(b.statusVerifikasi);
      const catatanClean = b.catatan ? b.catatan.trim() : null;

      let existingBerkas = null;
      if (b.id && Number(b.id) > 0) {
        existingBerkas = await prisma.berkasPendaftar.findUnique({
          where: { id: Number(b.id) },
        });
      }

      if (!existingBerkas && b.jenisBerkas) {
        existingBerkas = await prisma.berkasPendaftar.findFirst({
          where: {
            pendaftarId: pendaftar.id,
            jenisBerkas: b.jenisBerkas,
          },
        });
      }

      if (existingBerkas) {
        const updated = await prisma.berkasPendaftar.update({
          where: { id: existingBerkas.id },
          data: {
            statusVerifikasi: statusCode,
            catatan: catatanClean,
            namaBerkas: b.namaBerkas || existingBerkas.namaBerkas,
          },
        });
        notifikasiItems.push({
          id: updated.id,
          jenisBerkas: updated.jenisBerkas,
          namaBerkas: updated.namaBerkas || b.namaBerkas || updated.jenisBerkas,
          isWajib: updated.isWajib || b.isWajib || false,
          statusVerifikasi: updated.statusVerifikasi,
          catatan: updated.catatan,
        });
      } else if (b.jenisBerkas) {
        const created = await prisma.berkasPendaftar.create({
          data: {
            pendaftarId: pendaftar.id,
            jenisBerkas: b.jenisBerkas,
            namaBerkas: b.namaBerkas || b.jenisBerkas,
            fileUrl: '',
            statusVerifikasi: statusCode,
            catatan: catatanClean,
            isWajib: b.isWajib || false,
          },
        });
        notifikasiItems.push({
          id: created.id,
          jenisBerkas: created.jenisBerkas,
          namaBerkas: created.namaBerkas || created.jenisBerkas,
          isWajib: created.isWajib,
          statusVerifikasi: created.statusVerifikasi,
          catatan: created.catatan,
        });
      }
    }

    const isDaftarUlang = pendaftar.statusOds === 'DAFTAR_ULANG';
    const hasDitolak = notifikasiItems.some((n) => n.statusVerifikasi === 'DITOLAK');
    const hasPerluPerbaikan = notifikasiItems.some((n) => n.statusVerifikasi === 'PERLU_PERBAIKAN');
    const allDiterima = notifikasiItems.length > 0 && notifikasiItems.every((n) => n.statusVerifikasi === 'DITERIMA');

    let overallStatus = 'DIPROSES';
    if (hasDitolak) overallStatus = 'DITOLAK';
    else if (hasPerluPerbaikan) overallStatus = 'PERLU_PERBAIKAN';
    else if (allDiterima) overallStatus = 'TERVERIFIKASI';
    else if (isDaftarUlang && (!payload.berkas || payload.berkas.length === 0)) overallStatus = 'TERVERIFIKASI';

    await prisma.pendaftar.update({
      where: { id: pendaftar.id },
      data: {
        statusVerifikasiBerkas: overallStatus,
        tanggalVerifikasiBerkas: new Date(),
        ...(allDiterima && pendaftar.statusOds === 'PENDAFTAR' ? { statusOds: 'PESERTA_SELEKSI' } : {}),
        ...(isDaftarUlang && overallStatus === 'TERVERIFIKASI' ? { isDaftarUlang: true } : {}),
      },
    });

    let notifikasiResult = null;
    if (payload.kirimNotifikasi) {
      const pendaftarInfo = {
        id: pendaftar.id,
        noPendaftaran: pendaftar.noPendaftaran,
        nama: pendaftar.user.nama,
        noHp: pendaftar.noHp,
        email: pendaftar.user.email,
        periode: pendaftar.periode?.nama,
        jalur: pendaftar.jalurPendaftaran?.nama,
        prodi: pendaftar.prodiDiterima
          ? `${pendaftar.prodiDiterima.jenjang} - ${pendaftar.prodiDiterima.namaProdi}`
          : (pendaftar.programStudi ? `${pendaftar.programStudi.jenjang} - ${pendaftar.programStudi.namaProdi}` : undefined),
      };

      let waContent;
      if (isDaftarUlang) {
        waContent = whatsappService.generateDaftarUlangMessage(pendaftarInfo, payload.portalUrl);
      } else {
        waContent = whatsappService.generateVerifikasiMessage(pendaftarInfo, notifikasiItems, payload.portalUrl);
      }

      const waLink = pendaftar.noHp ? whatsappService.generateWaLink(pendaftar.noHp, waContent.pesan) : null;

      let gatewayResponse = null;
      if (pendaftar.noHp) {
        gatewayResponse = await whatsappService.kirimPesanGateway(pendaftar.noHp, waContent.pesan);
      }

      const logPesan = `[NOTIFIKASI WA ODS - ${waContent.tipeNotifikasi}] ${new Date().toLocaleString('id-ID')}: Status berkas disimpan (${overallStatus}). Catatan: ${
        notifikasiItems.filter((i) => i.catatan).map((i) => `${i.namaBerkas}: ${i.catatan}`).join('; ') || 'Sesuai'
      }`;

      await prisma.pendaftar.update({
        where: { id: pendaftar.id },
        data: {
          isOdsDihubungi: true,
          catatanOds: pendaftar.catatanOds ? `${pendaftar.catatanOds}\n${logPesan}` : logPesan,
        },
      });

      notifikasiResult = {
        tipeNotifikasi: waContent.tipeNotifikasi,
        totalBerkas: notifikasiItems.length,
        tujuanNoHp: pendaftar.noHp,
        tujuanFormatted: pendaftar.noHp ? whatsappService.formatIndonesianPhone(pendaftar.noHp) : null,
        waLink,
        pesanTeks: waContent.pesan,
        gatewayStatus: gatewayResponse,
      };
    }

    return {
      success: true,
      message: payload.kirimNotifikasi
        ? 'Verifikasi berkas berhasil disimpan dan notifikasi WhatsApp berhasil dibuat.'
        : 'Verifikasi berkas berhasil disimpan.',
      data: {
        pendaftarId: pendaftar.id,
        noPendaftaran: pendaftar.noPendaftaran,
        nama: pendaftar.user.nama,
        statusVerifikasiBerkas: overallStatus,
        notifikasiWa: notifikasiResult,
      },
    };
  }

  /**
   * 4. Action Tombol "Hubungi Pendaftar" pada Modal Belum Finalisasi
   * Mengirimkan WhatsApp pengingat untuk segera melengkapi data dan melakukan finalisasi
   */
  async hubungiPendaftarBelumFinalisasi(pendaftarId: number | string, customMessage?: string, portalUrl?: string) {
    const pendaftar = await this.findPendaftar(pendaftarId);
    if (!pendaftar) {
      throw new Error(`Data pendaftar "${pendaftarId}" tidak ditemukan.`);
    }

    const isPascasarjana =
      pendaftar.programStudi?.jenjang === 'S2' ||
      pendaftar.programStudi?.jenjang === 'S3' ||
      pendaftar.jalurPendaftaran?.nama?.toUpperCase().includes('PASCA');
    const masterBerkas = isPascasarjana ? this.MASTER_BERKAS_S2 : this.MASTER_BERKAS_S1;

    const uploadedSet = new Set(pendaftar.berkas.map((b) => b.jenisBerkas.toUpperCase()));
    const berkasKurang = masterBerkas.filter((m) => !uploadedSet.has(m.jenis)).map((m) => m.nama);

    const reminder = whatsappService.generateReminderBelumFinalisasiMessage(
      {
        id: pendaftar.id,
        noPendaftaran: pendaftar.noPendaftaran,
        nama: pendaftar.user.nama,
        noHp: pendaftar.noHp,
        email: pendaftar.user.email,
        periode: pendaftar.periode?.nama,
        jalur: pendaftar.jalurPendaftaran?.nama,
        prodi: pendaftar.programStudi ? `${pendaftar.programStudi.jenjang} - ${pendaftar.programStudi.namaProdi}` : undefined,
      },
      berkasKurang,
      portalUrl
    );

    const finalPesan = customMessage && customMessage.trim() !== '' ? customMessage.trim() : reminder.pesan;
    const finalWaLink = pendaftar.noHp ? whatsappService.generateWaLink(pendaftar.noHp, finalPesan) : null;

    let gatewayStatus = null;
    if (pendaftar.noHp) {
      gatewayStatus = await whatsappService.kirimPesanGateway(pendaftar.noHp, finalPesan);
    }

    const logPesan = `[FOLLOW-UP BELUM FINALISASI] ${new Date().toLocaleString('id-ID')}: Pengingat finalisasi dikirimkan ke ${pendaftar.noHp || 'Email'}.`;

    await prisma.pendaftar.update({
      where: { id: pendaftar.id },
      data: {
        isOdsDihubungi: true,
        catatanOds: pendaftar.catatanOds ? `${pendaftar.catatanOds}\n${logPesan}` : logPesan,
      },
    });

    return {
      success: true,
      message: `Follow-up pengingat finalisasi untuk ${pendaftar.user.nama} berhasil disiapkan.`,
      data: {
        pendaftarId: pendaftar.id,
        nama: pendaftar.user.nama,
        noHp: pendaftar.noHp,
        waLink: finalWaLink,
        pesan: finalPesan,
        gatewayStatus,
      },
    };
  }

  /**
   * 5. Mengambil Data Modal "Informasi Pendaftar [Pengumuman Kelulusan]" untuk Peserta Seleksi ODS
   * Menampilkan daftar prodi pilihan dengan kuota tersisa dan switch toggle "Set Diterima"
   */
  async getDetailKelulusanModal(identifier: number | string) {
    const pendaftar = await this.findPendaftar(identifier);
    if (!pendaftar) {
      throw new Error(`Data pendaftar "${identifier}" tidak ditemukan.`);
    }

    const genderCode = pendaftar.jenisKelamin ? (pendaftar.jenisKelamin.toUpperCase().startsWith('L') ? ' (L)' : ' (P)') : '';

    // Ambil daftar program studi pilihan
    const rawProdiList = [
      pendaftar.programStudi ? { id: pendaftar.programStudi.id, nama: pendaftar.programStudi.namaProdi, jenjang: pendaftar.programStudi.jenjang } : null,
      pendaftar.pilihanProdi2 ? { id: pendaftar.pilihanProdi2.id, nama: pendaftar.pilihanProdi2.namaProdi, jenjang: pendaftar.pilihanProdi2.jenjang } : null,
      pendaftar.pilihanProdi3 ? { id: pendaftar.pilihanProdi3.id, nama: pendaftar.pilihanProdi3.namaProdi, jenjang: pendaftar.pilihanProdi3.jenjang } : null,
    ].filter(Boolean) as any[];

    // Hitung kuota tersisa untuk setiap prodi pilihan
    const prodiChoices = await Promise.all(
      rawProdiList.map(async (pr, idx) => {
        const diterimaCount = await prisma.pendaftar.count({
          where: { prodiDiterimaId: pr.id, statusKelulusan: 'LULUS' },
        });
        const kuotaBase = pr.jenjang === 'S3' ? (idx === 0 ? 76 : 81) : (pr.jenjang === 'S2' ? 90 : 120);
        const kuotaTersisa = Math.max(0, kuotaBase - diterimaCount);

        return {
          prodiId: pr.id,
          namaProdi: `${pr.jenjang} - ${pr.nama}`,
          jenjang: pr.jenjang,
          kuotaTotal: kuotaBase,
          kuotaTersisa,
          kuotaTersisaFormatted: `${kuotaTersisa} Mahasiswa`,
          isDiterima: pendaftar.prodiDiterimaId === pr.id && pendaftar.statusKelulusan === 'LULUS',
          urutanPilihan: idx + 1,
        };
      })
    );

    return {
      pendaftar: {
        id: pendaftar.id,
        noPendaftaran: pendaftar.noPendaftaran || `ODS-${String(pendaftar.id).padStart(4, '0')}`,
        nama: `${pendaftar.user.nama}${genderCode}`,
        namaAsli: pendaftar.user.nama,
        nik: pendaftar.nik || '-',
        asalInstitusi: pendaftar.asalPerguruanTinggi || pendaftar.asalSekolah || 'Sekolah Tinggi Ilmu Ekonomi YAI',
        jurusan: pendaftar.jurusanPendidikan || '-',
        jalurPendaftaran: pendaftar.jalurPendaftaran?.nama || 'PASCASARJANA (S3)',
        gelombang: pendaftar.gelombang?.nama || 'Gelombang 1',
        periode: pendaftar.periode?.nama || '2026 Ganjil',
        sistemKuliah: pendaftar.sistemKuliah?.nama || 'Karyawan',
        pilihanProdi1: pendaftar.programStudi ? `${pendaftar.programStudi.jenjang} - ${pendaftar.programStudi.namaProdi}` : '-',
        pilihanProdi2: pendaftar.pilihanProdi2 ? `${pendaftar.pilihanProdi2.jenjang} - ${pendaftar.pilihanProdi2.namaProdi}` : '-',
        pilihanProdi3: pendaftar.pilihanProdi3 ? `${pendaftar.pilihanProdi3.jenjang} - ${pendaftar.pilihanProdi3.namaProdi}` : '-',
        statusKelulusan: pendaftar.statusKelulusan || 'MENUNGGU',
        prodiDiterimaId: pendaftar.prodiDiterimaId || null,
        badgeStatus: 'Pengumuman Kelulusan',
      },
      kontak: {
        email: pendaftar.user.email,
        noHp: pendaftar.noHp || '-',
      },
      pilihanProdi: prodiChoices,
      tombolAksi: {
        lihatDetailPendaftar: true,
        tolakPendaftar: true,
        simpanLuluskan: true,
      },
      detailPendaftarUrl: `/api/admin/ods/detail-pendaftar/${pendaftar.noPendaftaran || pendaftar.id}`,
    };
  }

  /**
   * 6. Set Kelulusan Peserta Seleksi ODS (Tombol "Simpan & Luluskan" atau "Tolak Pendaftar")
   */
  async setKelulusanOds(payload: {
    pendaftarId: number | string;
    statusKelulusan: 'LULUS' | 'TIDAK_LULUS';
    prodiDiterimaId?: number | null;
    portalUrl?: string;
    kirimNotifikasi?: boolean;
  }) {
    const pendaftar = await this.findPendaftar(payload.pendaftarId);
    if (!pendaftar) {
      throw new Error(`Data pendaftar "${payload.pendaftarId}" tidak ditemukan.`);
    }

    const isLulus = payload.statusKelulusan === 'LULUS';
    let prodiDiterima = null;

    if (isLulus) {
      if (!payload.prodiDiterimaId) {
        throw new Error('prodiDiterimaId wajib dipilih jika pendaftar diluluskan.');
      }
      prodiDiterima = await prisma.programStudi.findUnique({
        where: { id: Number(payload.prodiDiterimaId) },
      });
      if (!prodiDiterima) {
        throw new Error('Program studi yang dipilih tidak ditemukan.');
      }
    }

    const updated = await prisma.pendaftar.update({
      where: { id: pendaftar.id },
      data: {
        statusKelulusan: isLulus ? 'LULUS' : 'TIDAK_LULUS',
        prodiDiterimaId: isLulus ? Number(payload.prodiDiterimaId) : null,
        isDiterima: isLulus,
        tanggalLulus: isLulus ? new Date() : null,
        statusOds: isLulus ? 'DAFTAR_ULANG' : pendaftar.statusOds,
        emailKelulusanTerkirim: isLulus,
      },
      include: {
        user: true,
        programStudi: true,
        prodiDiterima: true,
        periode: true,
        jalurPendaftaran: true,
      },
    });

    let waResult = null;
    if (payload.kirimNotifikasi !== false && updated.noHp) {
      const waInfo = {
        id: updated.id,
        noPendaftaran: updated.noPendaftaran,
        nama: updated.user.nama,
        noHp: updated.noHp,
        email: updated.user.email,
        periode: updated.periode?.nama,
        jalur: updated.jalurPendaftaran?.nama,
        prodi: prodiDiterima ? `${prodiDiterima.jenjang} - ${prodiDiterima.namaProdi}` : undefined,
      };

      const prodiNamaFormatted = prodiDiterima ? `${prodiDiterima.jenjang} - ${prodiDiterima.namaProdi}` : undefined;
      const waMsg = whatsappService.generatePengumumanKelulusanMessage(
        waInfo,
        isLulus ? 'LULUS' : 'TIDAK_LULUS',
        prodiNamaFormatted,
        payload.portalUrl
      );

      let gatewayStatus = null;
      if (updated.noHp) {
        gatewayStatus = await whatsappService.kirimPesanGateway(updated.noHp, waMsg.pesan);
      }

      const logPesan = `[SET KELULUSAN ODS - ${isLulus ? 'LULUS' : 'TIDAK LULUS'}] ${new Date().toLocaleString('id-ID')}: Status kelulusan disimpan. Prodi: ${prodiNamaFormatted || '-'}.`;

      await prisma.pendaftar.update({
        where: { id: updated.id },
        data: {
          isOdsDihubungi: true,
          catatanOds: updated.catatanOds ? `${updated.catatanOds}\n${logPesan}` : logPesan,
        },
      });

      waResult = {
        pesan: waMsg.pesan,
        waLink: waMsg.waLink,
        tujuanNoHp: updated.noHp,
        gatewayStatus,
      };
    }

    return {
      success: true,
      message: isLulus
        ? `Pendaftar ${updated.user.nama} berhasil diluluskan pada ${prodiDiterima ? `${prodiDiterima.jenjang} - ${prodiDiterima.namaProdi}` : 'prodi pilihan'}!`
        : `Status pendaftar ${updated.user.nama} berhasil diubah menjadi Tidak Lulus.`,
      data: {
        pendaftarId: updated.id,
        noPendaftaran: updated.noPendaftaran,
        nama: updated.user.nama,
        statusKelulusan: updated.statusKelulusan,
        statusOds: updated.statusOds,
        prodiDiterima: prodiDiterima ? `${prodiDiterima.jenjang} - ${prodiDiterima.namaProdi}` : null,
        notifikasiWa: waResult,
      },
    };
  }

  /**
   * 5. Preview Template Pesan WhatsApp Berkas ODS sebelum dikirim
   */
  async previewWaNotifikasi(identifier: number | string, portalUrl?: string) {
    const detail = await this.getDetailVerifikasiBerkas(identifier, portalUrl);
    const pendaftarInfo = {
      id: detail.pendaftar.id,
      noPendaftaran: detail.pendaftar.noPendaftaran,
      nama: detail.pendaftar.namaAsli,
      noHp: detail.kontak.noHp,
      email: detail.kontak.email,
      periode: detail.pendaftar.periode,
      jalur: detail.pendaftar.jalurPendaftaran,
      prodi: detail.pendaftar.pilihanProdi1,
    };

    const notifItems: BerkasNotifikasiItem[] = detail.berkas.map((b) => ({
      id: b.id || undefined,
      jenisBerkas: b.jenisBerkas,
      namaBerkas: b.namaBerkas,
      isWajib: b.isWajib,
      statusVerifikasi: b.statusVerifikasi,
      catatan: b.catatan,
    }));

    const waContent = whatsappService.generateVerifikasiMessage(pendaftarInfo, notifItems, portalUrl);
    const waLink = detail.kontak.noHp ? whatsappService.generateWaLink(detail.kontak.noHp, waContent.pesan) : null;

    return {
      pendaftar: detail.pendaftar,
      kontak: detail.kontak,
      ...waContent,
      waLink,
    };
  }

  /**
   * 6. Catat Follow-up / Hubungi Pendaftar ODS (Telepon / WhatsApp)
   */
  async hubungiPendaftar(pendaftarId: number | string, catatan: string) {
    const pendaftar = await this.findPendaftar(pendaftarId);

    if (!pendaftar) {
      throw new Error(`Pendaftar "${pendaftarId}" tidak ditemukan.`);
    }

    const updated = await prisma.pendaftar.update({
      where: { id: pendaftar.id },
      data: {
        isOdsDihubungi: true,
        catatanOds: catatan,
      },
      include: { user: true },
    });

    return {
      success: true,
      message: `Follow-up ODS untuk ${updated.user.nama} berhasil disimpan.`,
      data: updated,
    };
  }

  /**
   * 7. Update Status Tahapan One Day Service
   */
  async updateStatusOds(pendaftarId: number | string, statusOds: 'PEMINAT' | 'PENDAFTAR' | 'PESERTA_SELEKSI' | 'DAFTAR_ULANG') {
    const pendaftar = await this.findPendaftar(pendaftarId);

    if (!pendaftar) {
      throw new Error(`Pendaftar "${pendaftarId}" tidak ditemukan.`);
    }

    const updated = await prisma.pendaftar.update({
      where: { id: pendaftar.id },
      data: { statusOds },
      include: { user: true },
    });

    return {
      success: true,
      message: `Status ODS pendaftar ${updated.user.nama} berhasil diperbarui menjadi ${statusOds}.`,
      data: updated,
    };
  }

  /**
   * 8. Ringkasan Statistik ODS (Hari Ini & Total)
   */
  async getOdsStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalOds, hariIni, sudahDihubungi, belumDihubungi, countPeminat, countPendaftar, countPesertaSeleksi, countDaftarUlang] =
      await Promise.all([
        prisma.pendaftar.count(),
        prisma.pendaftar.count({ where: { createdAt: { gte: today } } }),
        prisma.pendaftar.count({ where: { isOdsDihubungi: true } }),
        prisma.pendaftar.count({ where: { isOdsDihubungi: false } }),
        prisma.pendaftar.count({ where: { statusOds: 'PEMINAT' } }),
        prisma.pendaftar.count({ where: { statusOds: 'PENDAFTAR' } }),
        prisma.pendaftar.count({ where: { statusOds: 'PESERTA_SELEKSI' } }),
        prisma.pendaftar.count({ where: { statusOds: 'DAFTAR_ULANG' } }),
      ]);

    return {
      totalPendaftarOds: totalOds,
      pendaftarHariIni: hariIni,
      sudahDihubungi,
      belumDihubungi,
      peminat: countPeminat,
      pendaftar: countPendaftar,
      pesertaSeleksi: countPesertaSeleksi,
      daftarUlang: countDaftarUlang,
    };
  }

  /**
   * Helper formatting waktu Indonesia
   */
  private formatIndoDateTime(d?: Date | string | null): string {
    if (!d) return '-';
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return '-';
    const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const tgl = dateObj.getDate();
    const bln = bulan[dateObj.getMonth()];
    const thn = dateObj.getFullYear();
    const jam = String(dateObj.getHours()).padStart(2, '0');
    const mnt = String(dateObj.getMinutes()).padStart(2, '0');
    const dtk = String(dateObj.getSeconds()).padStart(2, '0');
    return `${tgl} ${bln} ${thn}, ${jam}:${mnt}:${dtk}`;
  }

  private formatIndoDate(d?: Date | string | null): string {
    if (!d) return '-';
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return '-';
    const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const tgl = dateObj.getDate();
    const bln = bulan[dateObj.getMonth()];
    const thn = dateObj.getFullYear();
    return `${tgl} ${bln} ${thn}`;
  }

  /**
   * 9. Mengambil Data Modal "Informasi Pendaftar [Proses Seleksi]" (Aksi "Masukkan Nilai")
   * Menampilkan komponen seleksi (Hafalan, Pemahaman, Wawancara, Kelancaran) beserta input nilai dan dokumen
   */
  async getDetailProsesSeleksiModal(identifier: number | string) {
    const pendaftar = await this.findPendaftar(identifier);
    if (!pendaftar) {
      throw new Error(`Data pendaftar "${identifier}" tidak ditemukan.`);
    }

    const genderCode = pendaftar.jenisKelamin ? (pendaftar.jenisKelamin.toUpperCase().startsWith('L') ? ' (L)' : ' (P)') : '';

    const komponenNilai = (pendaftar.nilaiSeleksi || []).map((ns) => {
      let statusFormatted = 'Diproses';
      const rawStatus = (ns.statusKelulusanTes || '').toUpperCase();
      if (rawStatus.includes('TIDAK')) statusFormatted = 'Tidak Lulus';
      else if (rawStatus.includes('LULUS')) statusFormatted = 'Lulus';
      else statusFormatted = 'Diproses';

      return {
        id: ns.id,
        jenisSeleksi: ns.jenisTes,
        komposisi: ns.komposisi || '-',
        nilai: ns.nilai,
        nilaiAkhir: ns.nilaiAkhir ?? (ns.nilai > 0 ? ns.nilai : null),
        dokumenUrl: ns.dokumenUrl || null,
        dokumenNama: ns.dokumenUrl ? ns.dokumenUrl.split('/').pop() : null,
        statusKelulusan: statusFormatted,
        statusKelulusanCode: statusFormatted.toUpperCase().replace(/\s+/g, '_'),
        lulusTes: ns.lulusTes,
        catatan: ns.catatan || '',
      };
    });

    return {
      pendaftar: {
        id: pendaftar.id,
        noPendaftaran: pendaftar.noPendaftaran || `ODS-${String(pendaftar.id).padStart(4, '0')}`,
        nama: `${pendaftar.user.nama}${genderCode}`,
        namaAsli: pendaftar.user.nama,
        nik: pendaftar.nik || '-',
        asalInstitusi: pendaftar.asalSekolah || pendaftar.asalPerguruanTinggi || '-',
        jurusan: pendaftar.jurusanPendidikan || '-',
        jalurPendaftaran: pendaftar.jalurPendaftaran?.nama || 'BEASISWA HAFIDZ',
        gelombang: pendaftar.gelombang?.nama || 'Gelombang 2',
        periode: pendaftar.periode?.nama || '2026 Ganjil',
        sistemKuliah: pendaftar.sistemKuliah?.nama || 'Reguler',
        pilihanProdi1: pendaftar.programStudi ? `${pendaftar.programStudi.jenjang} - ${pendaftar.programStudi.namaProdi}` : '-',
        pilihanProdi2: pendaftar.pilihanProdi2 ? `${pendaftar.pilihanProdi2.jenjang} - ${pendaftar.pilihanProdi2.namaProdi}` : '-',
        pilihanProdi3: pendaftar.pilihanProdi3 ? `${pendaftar.pilihanProdi3.jenjang} - ${pendaftar.pilihanProdi3.namaProdi}` : '-',
        statusOds: pendaftar.statusOds,
        badgeStatus: 'Proses Seleksi',
      },
      kontak: {
        email: pendaftar.user.email,
        noHp: pendaftar.noHp || '-',
      },
      komponenNilai,
      opsiStatusKelulusan: [
        { label: 'Diproses', value: 'DIPROSES' },
        { label: 'Lulus', value: 'LULUS' },
        { label: 'Tidak Lulus', value: 'TIDAK_LULUS' },
      ],
      tombolAksi: {
        lihatDetailPendaftar: true,
        simpanNilai: true,
      },
      detailPendaftarUrl: `/api/admin/ods/detail-pendaftar/${pendaftar.noPendaftaran || pendaftar.id}`,
    };
  }

  /**
   * 10. Menyimpan Nilai Seleksi Pendaftar (Tombol "Simpan Nilai" pada Modal Proses Seleksi)
   */
  async simpanNilaiSeleksi(
    pendaftarId: number | string,
    payload: {
      komponen: Array<{
        id?: number | null;
        jenisSeleksi?: string;
        komposisi?: string;
        nilai: number;
        nilaiAkhir?: number | null;
        dokumenUrl?: string | null;
        statusKelulusan?: string;
        catatan?: string;
      }>;
    }
  ) {
    const pendaftar = await this.findPendaftar(pendaftarId);
    if (!pendaftar) {
      throw new Error(`Data pendaftar "${pendaftarId}" tidak ditemukan.`);
    }

    if (!payload.komponen || !Array.isArray(payload.komponen)) {
      throw new Error('Daftar komponen nilai harus berupa array.');
    }

    const updatedList = [];
    for (const item of payload.komponen) {
      let record = null;
      if (item.id && Number(item.id) > 0) {
        record = await prisma.nilaiSeleksi.findUnique({ where: { id: Number(item.id) } });
      }

      if (!record && item.jenisSeleksi) {
        record = await prisma.nilaiSeleksi.findFirst({
          where: {
            pendaftarId: pendaftar.id,
            jenisTes: item.jenisSeleksi,
            ...(item.komposisi ? { komposisi: item.komposisi } : {}),
          },
        });
      }

      const rawStatus = (item.statusKelulusan || '').toUpperCase().trim();
      let statusFormatted = 'DIPROSES';
      let isLulus = false;
      if (rawStatus.includes('TIDAK')) {
        statusFormatted = 'TIDAK_LULUS';
        isLulus = false;
      } else if (rawStatus.includes('LULUS')) {
        statusFormatted = 'LULUS';
        isLulus = true;
      }

      const val = Number(item.nilai) || 0;
      const finalVal = item.nilaiAkhir !== undefined && item.nilaiAkhir !== null ? Number(item.nilaiAkhir) : val;

      if (record) {
        const u = await prisma.nilaiSeleksi.update({
          where: { id: record.id },
          data: {
            nilai: val,
            nilaiAkhir: finalVal,
            dokumenUrl: item.dokumenUrl !== undefined ? item.dokumenUrl : record.dokumenUrl,
            statusKelulusanTes: statusFormatted,
            lulusTes: isLulus,
            catatan: item.catatan !== undefined ? item.catatan : record.catatan,
          },
        });
        updatedList.push(u);
      } else if (item.jenisSeleksi) {
        const c = await prisma.nilaiSeleksi.create({
          data: {
            pendaftarId: pendaftar.id,
            jenisTes: item.jenisSeleksi,
            komposisi: item.komposisi || '-',
            nilai: val,
            nilaiAkhir: finalVal,
            dokumenUrl: item.dokumenUrl || null,
            statusKelulusanTes: statusFormatted,
            lulusTes: isLulus,
            catatan: item.catatan || null,
          },
        });
        updatedList.push(c);
      }
    }

    // Cek apakah seluruh nilai tes telah terisi (> 0)
    const allNilai = await prisma.nilaiSeleksi.findMany({
      where: { pendaftarId: pendaftar.id },
    });
    const allFilled = allNilai.length > 0 && allNilai.every((ns) => ns.nilai > 0);

    // Update status isIkutSeleksi pendaftar
    await prisma.pendaftar.update({
      where: { id: pendaftar.id },
      data: {
        isIkutSeleksi: true,
      },
    });

    return {
      success: true,
      message: `Nilai seleksi untuk ${pendaftar.user.nama} berhasil disimpan. ${
        allFilled ? 'Semua nilai telah terisi, status pendaftar siap untuk di-Set Kelulusan.' : 'Beberapa nilai masih perlu dilengkapi.'
      }`,
      data: {
        pendaftarId: pendaftar.id,
        nama: pendaftar.user.nama,
        semuaNilaiTerisi: allFilled,
        komponenNilai: updatedList,
      },
    };
  }

  /**
   * 11. Mengambil Detail Lengkap Pendaftar ODS untuk Halaman Detail Pendaftar (Screenshot 4)
   * Menyajikan:
   * - Stepper status pendaftaran (1. Biodata, 2. Berkas, 3. Seleksi, 4. Pembayaran, 5. Daftar Ulang)
   * - Profil & Header Card (Pasfoto, Nama, Kode Pendaftar, NIM, Tanggal Daftar, Status Finalisasi)
   * - Card "Informasi Pendaftaran" (Jalur, Gelombang, Periode, Sistem Kuliah, Pilihan Prodi 1-3, Diterima di Prodi)
   * - Card "Biodata Pendaftar" (Informasi Umum, Administrasi, Pekerjaan, Jas Almamater, Alamat KTP)
   */
  async getDetailPendaftarOds(identifier: number | string) {
    const pendaftar = await this.findPendaftar(identifier);
    if (!pendaftar) {
      throw new Error(`Data pendaftar "${identifier}" tidak ditemukan.`);
    }

    const genderFormatted = pendaftar.jenisKelamin
      ? pendaftar.jenisKelamin.toLowerCase().includes('l')
        ? 'Laki-Laki'
        : 'Perempuan'
      : 'Laki-Laki';

    // Stepper Status Pendaftaran (5 Tahapan)
    type StepStatus = 'completed' | 'active' | 'pending';
    let step1Status: StepStatus = 'completed';
    let step2Status: StepStatus = 'pending';
    let step3Status: StepStatus = 'pending';
    let step4Status: StepStatus = 'pending';
    let step5Status: StepStatus = 'pending';

    if (pendaftar.nim) {
      step1Status = 'completed';
      step2Status = pendaftar.statusVerifikasiBerkas === 'TERVERIFIKASI' ? 'completed' : 'active';
      step3Status = 'completed';
      step4Status = 'completed';
      step5Status = 'completed';
    } else if (pendaftar.statusOds === 'DAFTAR_ULANG' || pendaftar.statusKelulusan === 'LULUS' || pendaftar.prodiDiterimaId) {
      step1Status = 'completed';
      step2Status = 'completed';
      step3Status = 'completed';
      step4Status = pendaftar.isDaftarUlang ? 'completed' : 'active';
      step5Status = pendaftar.isDaftarUlang ? 'completed' : 'pending';
    } else if (pendaftar.statusOds === 'PESERTA_SELEKSI') {
      step2Status = 'completed';
      step3Status = 'active';
      step4Status = 'completed';
      step5Status = 'pending';
    } else if (pendaftar.statusOds === 'PENDAFTAR') {
      step2Status = pendaftar.isFinalisasi ? 'active' : 'pending';
      step3Status = 'pending';
      step4Status = 'completed';
      step5Status = 'pending';
    } else {
      step1Status = 'active';
      step4Status = 'pending';
    }

    const stepper = [
      { step: 1, title: 'Biodata Pendaftar', status: step1Status, isCompleted: step1Status === 'completed', isActive: step1Status === 'active' },
      { step: 2, title: 'Berkas Administrasi', status: step2Status, isCompleted: step2Status === 'completed', isActive: step2Status === 'active' },
      { step: 3, title: 'Proses Seleksi', status: step3Status, isCompleted: step3Status === 'completed', isActive: step3Status === 'active' },
      { step: 4, title: 'Pembayaran', status: step4Status, isCompleted: (step4Status as StepStatus) === 'completed', isActive: (step4Status as StepStatus) === 'active' },
      { step: 5, title: 'Daftar Ulang', status: step5Status, isCompleted: (step5Status as StepStatus) === 'completed', isActive: (step5Status as StepStatus) === 'active' },
    ];

    // Temukan file pasfoto jika ada di berkas
    const pasFotoBerkas = pendaftar.berkas.find(
      (b) => b.jenisBerkas.toUpperCase().includes('PASFOTO') || b.jenisBerkas.toUpperCase().includes('FOTO')
    );
    const fotoUrl = pasFotoBerkas?.fileUrl || '/uploads/camaba/default-avatar.png';

    const headerCard = {
      fotoUrl,
      namaLengkap: pendaftar.user.nama,
      kodePendaftar: pendaftar.noPendaftaran || `ODS-${String(pendaftar.id).padStart(4, '0')}`,
      jenisKelamin: genderFormatted,
      tanggalDaftar: this.formatIndoDateTime(pendaftar.createdAt),
      nim: pendaftar.nim || '-',
      tanggalAktivasiAkun: '-',
      sudahFinalisasi: Boolean(pendaftar.isFinalisasi),
    };

    const informasiPendaftaran = {
      namaJalurPendaftaran: pendaftar.jalurPendaftaran?.nama || 'BEASISWA HAFIDZ',
      gelombang: pendaftar.gelombang?.nama || 'Gelombang 2',
      periode: pendaftar.periode?.nama || '2026 Ganjil',
      sistemKuliah: pendaftar.sistemKuliah?.nama || 'Reguler',
      pilihanProdi1: pendaftar.programStudi ? `${pendaftar.programStudi.jenjang} - ${pendaftar.programStudi.namaProdi}` : '-',
      pilihanProdi2: pendaftar.pilihanProdi2 ? `${pendaftar.pilihanProdi2.jenjang} - ${pendaftar.pilihanProdi2.namaProdi}` : '-',
      pilihanProdi3: pendaftar.pilihanProdi3 ? `${pendaftar.pilihanProdi3.jenjang} - ${pendaftar.pilihanProdi3.namaProdi}` : '-',
      diterimaDiProdi: pendaftar.prodiDiterima ? `${pendaftar.prodiDiterima.jenjang} - ${pendaftar.prodiDiterima.namaProdi}` : '-',
      sumberPendaftar: pendaftar.sumberTrafik || '-',
    };

    const biodataPendaftar = {
      informasiUmum: {
        tempatLahir: pendaftar.tempatLahir || 'KOTABUMI',
        tanggalLahir: this.formatIndoDate(pendaftar.tanggalLahir) || '27 Juni 2007',
        email: pendaftar.user.email,
        noHp: pendaftar.noHp || '-',
        agama: pendaftar.agama || 'Islam',
      },
      administrasi: {
        kewarganegaraan: 'IDN - Indonesia',
        nik: pendaftar.nik || '-',
        noPaspor: pendaftar.noPaspor || '-',
        noKartuKeluarga: pendaftar.noKk || '-',
      },
      pekerjaan: {
        pekerjaan: pendaftar.pekerjaan || (pendaftar.namaPerusahaan ? 'Bekerja' : 'Tidak Bekerja'),
        instansiPekerjaan: pendaftar.namaPerusahaan || '-',
      },
      lainnya: {
        ukuranJasAlmamater: pendaftar.ukuranJasAlmamater || 'XL',
      },
      alamatKtp: {
        alamat: pendaftar.alamat || '-',
        kelurahanDesa: '-',
        kecamatan: '-',
        kabupatenKota: pendaftar.kabupatenKota || '-',
        provinsi: pendaftar.provinsi || '-',
        kodePos: '-',
      },
      orangTua: pendaftar.orangTua || null,
      rekamMedis: pendaftar.rekamMedis || null,
    };

    return {
      pendaftarId: pendaftar.id,
      stepper,
      headerCard,
      informasiPendaftaran,
      biodataPendaftar,
      actions: {
        kembaliKeDaftar: true,
        editData: true,
      },
    };
  }
}

export const adminOdsService = new AdminOdsService();
