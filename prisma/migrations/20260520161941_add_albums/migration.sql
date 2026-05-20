/*
  Warnings:

  - You are about to drop the `galeria` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "galeria";

-- CreateTable
CREATE TABLE "albums" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "portada" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos_album" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "album_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fotos_album_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "fotos_album" ADD CONSTRAINT "fotos_album_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;
