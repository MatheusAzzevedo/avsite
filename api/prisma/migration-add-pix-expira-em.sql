-- Migration: add pixExpiraEm ao pedido (expiração da cobrança PIX)
-- Executar manualmente no PostgreSQL (ex.: Railway) ou usar: npx prisma db push
-- Data: 2026-08-06

ALTER TABLE "pedidos" ADD COLUMN IF NOT EXISTS "pixExpiraEm" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "pedidos_pixExpiraEm_idx" ON "pedidos"("pixExpiraEm");
