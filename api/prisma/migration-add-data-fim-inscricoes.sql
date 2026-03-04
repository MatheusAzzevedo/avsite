-- Migration: add dataFimInscricoes to excursões pedagógicas
-- Executar manualmente no PostgreSQL (ex.: Railway) ou usar: npx prisma db push
-- Data: 2026-03-04

ALTER TABLE "excursoes_pedagogicas" ADD COLUMN IF NOT EXISTS "dataFimInscricoes" TIMESTAMP(3);
