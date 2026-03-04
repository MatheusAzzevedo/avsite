-- Migration: add documentoUrl e documentoNome para excursões pedagógicas
-- Executar manualmente no PostgreSQL (ex.: Railway) ou usar: npx prisma db push
-- Data: 2026-03-04

ALTER TABLE "excursoes_pedagogicas" ADD COLUMN IF NOT EXISTS "documentoUrl" TEXT;
ALTER TABLE "excursoes_pedagogicas" ADD COLUMN IF NOT EXISTS "documentoNome" TEXT;
