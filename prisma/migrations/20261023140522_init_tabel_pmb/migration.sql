-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CAMABA');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CAMABA',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Periode" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Periode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gelombang" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "Gelombang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JalurPendaftaran" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "JalurPendaftaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SistemKuliah" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "SistemKuliah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramStudi" (
    "id" SERIAL NOT NULL,
    "namaProdi" TEXT NOT NULL,
    "jenjang" TEXT NOT NULL,

    CONSTRAINT "ProgramStudi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pendaftar" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "periodeId" INTEGER NOT NULL,
    "gelombangId" INTEGER NOT NULL,
    "jalurPendaftaranId" INTEGER NOT NULL,
    "sistemKuliahId" INTEGER NOT NULL,
    "programStudiId" INTEGER NOT NULL,
    "isFinalisasi" BOOLEAN NOT NULL DEFAULT false,
    "isDiterima" BOOLEAN NOT NULL DEFAULT false,
    "isDaftarUlang" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pendaftar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pendaftar_userId_key" ON "Pendaftar"("userId");

-- AddForeignKey
ALTER TABLE "Pendaftar" ADD CONSTRAINT "Pendaftar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pendaftar" ADD CONSTRAINT "Pendaftar_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "Periode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pendaftar" ADD CONSTRAINT "Pendaftar_gelombangId_fkey" FOREIGN KEY ("gelombangId") REFERENCES "Gelombang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pendaftar" ADD CONSTRAINT "Pendaftar_jalurPendaftaranId_fkey" FOREIGN KEY ("jalurPendaftaranId") REFERENCES "JalurPendaftaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pendaftar" ADD CONSTRAINT "Pendaftar_sistemKuliahId_fkey" FOREIGN KEY ("sistemKuliahId") REFERENCES "SistemKuliah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pendaftar" ADD CONSTRAINT "Pendaftar_programStudiId_fkey" FOREIGN KEY ("programStudiId") REFERENCES "ProgramStudi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
