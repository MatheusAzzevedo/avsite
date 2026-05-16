-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('PUBLICADO', 'RASCUNHO');

-- CreateEnum
CREATE TYPE "ExcursaoStatus" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "PedidoTipo" AS ENUM ('PEDAGOGICA', 'CONVENCIONAL');

-- CreateEnum
CREATE TYPE "PedidoStatus" AS ENUM ('PENDENTE', 'AGUARDANDO_PAGAMENTO', 'PAGO', 'CONFIRMADO', 'CANCELADO', 'EXPIRADO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoria" TEXT NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'RASCUNHO',
    "imagemCapa" TEXT,
    "resumo" TEXT,
    "conteudo" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria_excursao" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categoria_excursao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "excursoes" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subtitulo" TEXT,
    "preco" DECIMAL(10,2) NOT NULL,
    "duracao" TEXT,
    "categoria" TEXT NOT NULL,
    "status" "ExcursaoStatus" NOT NULL DEFAULT 'ATIVO',
    "imagemCapa" TEXT,
    "imagemPrincipal" TEXT,
    "descricao" TEXT,
    "inclusos" TEXT,
    "recomendacoes" TEXT,
    "local" TEXT,
    "horario" TEXT,
    "tags" TEXT[],
    "dataExcursao" TIMESTAMP(3),
    "vagas" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT,

    CONSTRAINT "excursoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "excursao_imagens" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "excursaoId" TEXT NOT NULL,

    CONSTRAINT "excursao_imagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_configs" (
    "id" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,
    "webhookUrl" TEXT,
    "testMode" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "excursoes_pedagogicas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subtitulo" TEXT,
    "preco" DECIMAL(10,2) NOT NULL,
    "duracao" TEXT,
    "categoria" TEXT NOT NULL,
    "status" "ExcursaoStatus" NOT NULL DEFAULT 'ATIVO',
    "imagemCapa" TEXT,
    "imagemPrincipal" TEXT,
    "descricao" TEXT,
    "inclusos" TEXT,
    "recomendacoes" TEXT,
    "local" TEXT,
    "horario" TEXT,
    "tags" TEXT[],
    "maxInstallments" INTEGER,
    "destino" TEXT,
    "dataDestino" TIMESTAMP(3),
    "dataFimInscricoes" TIMESTAMP(3),
    "documentoUrl" TEXT,
    "documentoNome" TEXT,
    "vagas" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT,

    CONSTRAINT "excursoes_pedagogicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "excursao_pedagogica_imagens" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "excursaoPedagogicaId" TEXT NOT NULL,

    CONSTRAINT "excursao_pedagogica_imagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploads" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT,
    "userId" TEXT,
    "userEmail" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "cpf" TEXT,
    "authProvider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
    "googleId" TEXT,
    "avatarUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "resetToken" TEXT,
    "resetTokenExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "excursaoId" TEXT,
    "excursaoPedagogicaId" TEXT,
    "quantidade" INTEGER NOT NULL,
    "valorUnitario" DECIMAL(10,2) NOT NULL,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "status" "PedidoStatus" NOT NULL DEFAULT 'PENDENTE',
    "tipo" "PedidoTipo" NOT NULL DEFAULT 'PEDAGOGICA',
    "codigoPagamento" TEXT,
    "metodoPagamento" TEXT,
    "observacoes" TEXT,
    "dadosResponsavelFinanceiro" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "dataConfirmacao" TIMESTAMP(3),
    "emailConfirmacaoEnviado" BOOLEAN NOT NULL DEFAULT false,
    "excursaoPedagogicaSnapshot" JSONB,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "nomeAluno" TEXT NOT NULL,
    "idadeAluno" INTEGER,
    "dataNascimento" TIMESTAMP(3),
    "escolaAluno" TEXT,
    "serieAluno" TEXT,
    "turma" TEXT,
    "unidadeColegio" TEXT,
    "cpfAluno" TEXT,
    "rgAluno" TEXT,
    "responsavel" TEXT,
    "telefoneResponsavel" TEXT,
    "emailResponsavel" TEXT,
    "observacoes" TEXT,
    "alergiasCuidados" TEXT,
    "planoSaude" TEXT,
    "medicamentosFebre" TEXT,
    "medicamentosAlergia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoriaExcursaoToExcursao" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_CategoriaExcursaoToExcursaoPedagogica" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "posts_slug_key" ON "posts"("slug");

-- CreateIndex
CREATE INDEX "posts_slug_idx" ON "posts"("slug");

-- CreateIndex
CREATE INDEX "posts_status_idx" ON "posts"("status");

-- CreateIndex
CREATE INDEX "posts_categoria_idx" ON "posts"("categoria");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_excursao_slug_key" ON "categoria_excursao"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "excursoes_slug_key" ON "excursoes"("slug");

-- CreateIndex
CREATE INDEX "excursoes_slug_idx" ON "excursoes"("slug");

-- CreateIndex
CREATE INDEX "excursoes_status_idx" ON "excursoes"("status");

-- CreateIndex
CREATE INDEX "excursoes_categoria_idx" ON "excursoes"("categoria");

-- CreateIndex
CREATE UNIQUE INDEX "payment_configs_gateway_key" ON "payment_configs"("gateway");

-- CreateIndex
CREATE UNIQUE INDEX "excursoes_pedagogicas_codigo_key" ON "excursoes_pedagogicas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "excursoes_pedagogicas_slug_key" ON "excursoes_pedagogicas"("slug");

-- CreateIndex
CREATE INDEX "excursoes_pedagogicas_codigo_idx" ON "excursoes_pedagogicas"("codigo");

-- CreateIndex
CREATE INDEX "excursoes_pedagogicas_slug_idx" ON "excursoes_pedagogicas"("slug");

-- CreateIndex
CREATE INDEX "excursoes_pedagogicas_status_idx" ON "excursoes_pedagogicas"("status");

-- CreateIndex
CREATE INDEX "excursoes_pedagogicas_categoria_idx" ON "excursoes_pedagogicas"("categoria");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_entity_idx" ON "activity_logs"("entity");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_email_key" ON "clientes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_googleId_key" ON "clientes"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_resetToken_key" ON "clientes"("resetToken");

-- CreateIndex
CREATE INDEX "clientes_email_idx" ON "clientes"("email");

-- CreateIndex
CREATE INDEX "clientes_googleId_idx" ON "clientes"("googleId");

-- CreateIndex
CREATE INDEX "pedidos_clienteId_idx" ON "pedidos"("clienteId");

-- CreateIndex
CREATE INDEX "pedidos_excursaoId_idx" ON "pedidos"("excursaoId");

-- CreateIndex
CREATE INDEX "pedidos_excursaoPedagogicaId_idx" ON "pedidos"("excursaoPedagogicaId");

-- CreateIndex
CREATE INDEX "pedidos_status_idx" ON "pedidos"("status");

-- CreateIndex
CREATE INDEX "pedidos_codigoPagamento_idx" ON "pedidos"("codigoPagamento");

-- CreateIndex
CREATE INDEX "pedidos_createdAt_idx" ON "pedidos"("createdAt");

-- CreateIndex
CREATE INDEX "itens_pedido_pedidoId_idx" ON "itens_pedido"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "_CategoriaExcursaoToExcursao_AB_unique" ON "_CategoriaExcursaoToExcursao"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoriaExcursaoToExcursao_B_index" ON "_CategoriaExcursaoToExcursao"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CategoriaExcursaoToExcursaoPedagogica_AB_unique" ON "_CategoriaExcursaoToExcursaoPedagogica"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoriaExcursaoToExcursaoPedagogica_B_index" ON "_CategoriaExcursaoToExcursaoPedagogica"("B");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "excursoes" ADD CONSTRAINT "excursoes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "excursao_imagens" ADD CONSTRAINT "excursao_imagens_excursaoId_fkey" FOREIGN KEY ("excursaoId") REFERENCES "excursoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "excursoes_pedagogicas" ADD CONSTRAINT "excursoes_pedagogicas_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "excursao_pedagogica_imagens" ADD CONSTRAINT "excursao_pedagogica_imagens_excursaoPedagogicaId_fkey" FOREIGN KEY ("excursaoPedagogicaId") REFERENCES "excursoes_pedagogicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_excursaoId_fkey" FOREIGN KEY ("excursaoId") REFERENCES "excursoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_excursaoPedagogicaId_fkey" FOREIGN KEY ("excursaoPedagogicaId") REFERENCES "excursoes_pedagogicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoriaExcursaoToExcursao" ADD CONSTRAINT "_CategoriaExcursaoToExcursao_A_fkey" FOREIGN KEY ("A") REFERENCES "categoria_excursao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoriaExcursaoToExcursao" ADD CONSTRAINT "_CategoriaExcursaoToExcursao_B_fkey" FOREIGN KEY ("B") REFERENCES "excursoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoriaExcursaoToExcursaoPedagogica" ADD CONSTRAINT "_CategoriaExcursaoToExcursaoPedagogica_A_fkey" FOREIGN KEY ("A") REFERENCES "categoria_excursao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoriaExcursaoToExcursaoPedagogica" ADD CONSTRAINT "_CategoriaExcursaoToExcursaoPedagogica_B_fkey" FOREIGN KEY ("B") REFERENCES "excursoes_pedagogicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
