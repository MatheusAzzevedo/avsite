-- Migration: tabela de categorias de excursão (nomes controlados pelo admin)
-- Executar manualmente no PostgreSQL (ex.: Railway) se não usar prisma migrate

CREATE TABLE IF NOT EXISTS "categoria_excursao" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "nome" TEXT NOT NULL,
  "ordem" INTEGER NOT NULL DEFAULT 0
);

-- Dados iniciais (slug igual ao que já existe em excursoes.categoria)
INSERT INTO "categoria_excursao" ("id", "slug", "nome", "ordem") VALUES
  ('a0000001-0000-4000-8000-000000000001', 'natureza', 'Natureza', 1),
  ('a0000002-0000-4000-8000-000000000002', 'cultura', 'Cultura', 2),
  ('a0000003-0000-4000-8000-000000000003', 'aventura', 'Aventura', 3),
  ('a0000004-0000-4000-8000-000000000004', 'marítimo', 'Marítimo', 4)
ON CONFLICT ("slug") DO NOTHING;
