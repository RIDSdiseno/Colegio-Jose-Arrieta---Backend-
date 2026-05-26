/*
  Warnings:

  - You are about to drop the `boletines` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "documentos" ALTER COLUMN "categoria" SET DEFAULT 'Otro';

-- DropTable
DROP TABLE "boletines";
