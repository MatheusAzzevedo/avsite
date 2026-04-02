-- Migration manual: adicionar campos de recuperação de senha à tabela Cliente
-- Execute no banco via console SQL ou psql

-- 1. Adicionar colunas 'resetToken' e 'resetTokenExpires'
ALTER TABLE "clientes" ADD COLUMN "resetToken" TEXT;
ALTER TABLE "clientes" ADD COLUMN "resetTokenExpires" TIMESTAMP(3) WITHOUT TIME ZONE;

-- 2. Criar índice único para 'resetToken'
CREATE UNIQUE INDEX "clientes_resetToken_key" ON "clientes"("resetToken");

-- 3. Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clientes' AND column_name IN ('resetToken', 'resetTokenExpires');
