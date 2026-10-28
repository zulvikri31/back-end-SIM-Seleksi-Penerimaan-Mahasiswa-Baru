/*
  Warnings:

  - A unique constraint covering the columns `[noPendaftaran]` on the table `Pendaftar` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nim]` on the table `Pendaftar` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[kode]` on the table `Periode` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `kode` to the `Periode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "JalurPendaftaran" ADD COLUMN     "deskripsi" TEXT;

-- AlterTable
ALTER TABLE "Pendaftar" ADD COLUMN     "alamat" TEXT,
ADD COLUMN     "asalSekolah" TEXT,
ADD COLUMN     "isBiodataLengkap" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isIkutSeleksi" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jenisKelamin" TEXT,
ADD COLUMN     "jenisPendidikan" TEXT,
ADD COLUMN     "jurusanPendidikan" TEXT,
ADD COLUMN     "kabupatenKota" TEXT,
ADD COLUMN     "nik" TEXT,
ADD COLUMN     "nim" TEXT,
ADD COLUMN     "noHp" TEXT,
ADD COLUMN     "noPendaftaran" TEXT,
ADD COLUMN     "provinsi" TEXT,
ADD COLUMN     "sumberTrafik" TEXT,
ADD COLUMN     "tahunLulus" INTEGER,
ADD COLUMN     "tanggalDaftarUlang" TIMESTAMP(3),
ADD COLUMN     "tanggalFinalisasi" TIMESTAMP(3),
ADD COLUMN     "tanggalLahir" TIMESTAMP(3),
ADD COLUMN     "tanggalLulus" TIMESTAMP(3),
ADD COLUMN     "tempatLahir" TEXT;

-- AlterTable
ALTER TABLE "Periode" ADD COLUMN     "kode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProgramStudi" ADD COLUMN     "akreditasi" TEXT,
ADD COLUMN     "biayaKuliah" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "InformasiBrosur" (
    "id" SERIAL NOT NULL,
    "judul" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "deskripsi" TEXT,
    "fileUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InformasiBrosur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PembukaanJalur" (
    "id" SERIAL NOT NULL,
    "periodeId" INTEGER NOT NULL,
    "gelombangId" INTEGER NOT NULL,
    "jalurPendaftaranId" INTEGER NOT NULL,
    "sistemKuliahId" INTEGER NOT NULL,
    "programStudiId" INTEGER NOT NULL,
    "biayaPendaftaran" INTEGER NOT NULL DEFAULT 0,
    "kuota" INTEGER NOT NULL DEFAULT 50,
    "tanggalBuka" TIMESTAMP(3),
    "tanggalTutup" TIMESTAMP(3),
    "isBuka" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PembukaanJalur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrangTua" (
    "id" SERIAL NOT NULL,
    "pendaftarId" INTEGER NOT NULL,
    "namaAyah" TEXT,
    "pekerjaanAyah" TEXT,
    "namaIbu" TEXT,
    "pekerjaanIbu" TEXT,
    "penghasilanOrtu" TEXT,
    "noHpOrtu" TEXT,

    CONSTRAINT "OrangTua_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BerkasPendaftar" (
    "id" SERIAL NOT NULL,
    "pendaftarId" INTEGER NOT NULL,
    "jenisBerkas" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "statusVerifikasi" TEXT NOT NULL DEFAULT 'MENUNGGU',

    CONSTRAINT "BerkasPendaftar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NilaiSeleksi" (
    "id" SERIAL NOT NULL,
    "pendaftarId" INTEGER NOT NULL,
    "jenisTes" TEXT NOT NULL,
    "nilai" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lulusTes" BOOLEAN NOT NULL DEFAULT false,
    "catatan" TEXT,

    CONSTRAINT "NilaiSeleksi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrangTua_pendaftarId_key" ON "OrangTua"("pendaftarId");

-- CreateIndex
CREATE UNIQUE INDEX "Pendaftar_noPendaftaran_key" ON "Pendaftar"("noPendaftaran");

-- CreateIndex
CREATE UNIQUE INDEX "Pendaftar_nim_key" ON "Pendaftar"("nim");

-- CreateIndex
CREATE UNIQUE INDEX "Periode_kode_key" ON "Periode"("kode");

-- AddForeignKey
ALTER TABLE "PembukaanJalur" ADD CONSTRAINT "PembukaanJalur_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "Periode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PembukaanJalur" ADD CONSTRAINT "PembukaanJalur_gelombangId_fkey" FOREIGN KEY ("gelombangId") REFERENCES "Gelombang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PembukaanJalur" ADD CONSTRAINT "PembukaanJalur_jalurPendaftaranId_fkey" FOREIGN KEY ("jalurPendaftaranId") REFERENCES "JalurPendaftaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PembukaanJalur" ADD CONSTRAINT "PembukaanJalur_sistemKuliahId_fkey" FOREIGN KEY ("sistemKuliahId") REFERENCES "SistemKuliah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PembukaanJalur" ADD CONSTRAINT "PembukaanJalur_programStudiId_fkey" FOREIGN KEY ("programStudiId") REFERENCES "ProgramStudi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrangTua" ADD CONSTRAINT "OrangTua_pendaftarId_fkey" FOREIGN KEY ("pendaftarId") REFERENCES "Pendaftar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BerkasPendaftar" ADD CONSTRAINT "BerkasPendaftar_pendaftarId_fkey" FOREIGN KEY ("pendaftarId") REFERENCES "Pendaftar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NilaiSeleksi" ADD CONSTRAINT "NilaiSeleksi_pendaftarId_fkey" FOREIGN KEY ("pendaftarId") REFERENCES "Pendaftar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
