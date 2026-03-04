-- Migration: add dataExcursao to excursões convencionais
-- Executar manualmente no PostgreSQL (ex.: Railway) ou usar: npx prisma db push
-- Data: 2026-03-04

ALTER TABLE "excursoes" ADD COLUMN IF NOT EXISTS "dataExcursao" TIMESTAMP(3);
