-- CreateIndex
CREATE INDEX "albums_activo_orden_idx" ON "albums"("activo", "orden");

-- CreateIndex
CREATE INDEX "documentos_anio_idx" ON "documentos"("anio");

-- CreateIndex
CREATE INDEX "noticias_fecha_idx" ON "noticias"("fecha" DESC);

-- CreateIndex
CREATE INDEX "noticias_categoria_idx" ON "noticias"("categoria");
