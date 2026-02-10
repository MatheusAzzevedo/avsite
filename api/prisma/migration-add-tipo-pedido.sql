-- Migration manual: adicionar campo 'tipo' à tabela Pedido
-- Execute no banco Railway via console SQL ou Prisma Studio

-- 1. Criar enum PedidoTipo
CREATE TYPE "PedidoTipo" AS ENUM ('PEDAGOGICA', 'CONVENCIONAL');

-- 2. Adicionar coluna 'tipo' com valor padrão 'PEDAGOGICA'
ALTER TABLE "Pedido" ADD COLUMN "tipo" "PedidoTipo" NOT NULL DEFAULT 'PEDAGOGICA';

-- 3. Verificar se a coluna foi criada
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'Pedido' AND column_name = 'tipo';
