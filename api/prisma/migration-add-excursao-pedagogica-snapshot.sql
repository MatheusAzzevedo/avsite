-- Migration: add excursaoPedagogicaSnapshot em pedidos (histórico quando excursão é excluída)
-- Executar manualmente no PostgreSQL (ex.: Railway) ou usar: npx prisma db push
-- Data: 2026-03-06

ALTER TABLE "pedidos" ADD COLUMN IF NOT EXISTS "excursaoPedagogicaSnapshot" JSONB;
