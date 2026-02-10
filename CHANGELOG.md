# Changelog

## 2026-02-10 - Categorias de Viagens controladas pelo admin

### Arquivos Modificados
- `api/prisma/schema.prisma` [Novo model CategoriaExcursao (slug, nome, ordem)]
- `api/prisma/migration-add-categoria-excursao.sql` [Migration SQL para criar tabela e dados iniciais]
- `api/prisma/seed.ts` [Upsert das categorias padrão: natureza, cultura, aventura, marítimo]
- `api/src/routes/categorias-excursao.routes.ts` [Novo: GET/POST/PUT/DELETE /api/admin/categorias-excursao]
- `api/src/routes/public.routes.ts` [GET /categorias passa a retornar categorias da tabela CategoriaExcursao]
- `api/src/server.ts` [Registro da rota /api/admin/categorias-excursao]
- `api/public/admin/categorias.html`, `api/public/admin/js/categorias.js` [Nova página e CRUD de categorias]
- `api/public/admin/excursao-editor.html`, `api/public/admin/js/excursao-editor.js` [Select de categoria preenchido pela API]
- `api/public/admin/excursoes.html`, `api/public/admin/js/excursoes.js` [Filtro de categoria preenchido pela API; link Categorias no menu]
- `api/public/portfolio.html`, `api/public/js/portfolio-excursoes.js` [Filtros da página Viagens montados dinamicamente a partir da API]
- `api/public/admin/dashboard.html`, `api/public/admin/listas.html`, `api/public/admin/excursoes-pedagogicas.html`, `api/public/admin/excursao-pedagogica-editor.html` [Link Categorias no menu lateral]

### Alterações
- No painel admin é possível controlar os nomes das categorias de excursão (Viagens). Nova página "Categorias" no menu: listar, criar, editar e excluir categorias (slug, nome exibido, ordem). O slug é usado internamente nas excursões; o nome é o que aparece na página Viagens do site. A exclusão é bloqueada se houver excursões usando a categoria. O editor de excursão e o filtro da listagem de excursões passam a carregar as categorias da API. Na página pública Viagens (/excursoes), os botões de filtro (Todas, Natureza, Cultura, etc.) são montados dinamicamente a partir de GET /api/public/categorias, refletindo os nomes definidos no admin. É necessário rodar a migration SQL (categoria_excursao) e, se desejar, o seed para garantir as categorias iniciais.

---

## 2026-02-10 - Nossos Roteiros: nova página com embed e formulário

### Arquivos Modificados
- `api/public/nossos-roteiros.html` [Nova página: seção 1 com iframe Heyzine (flip-book/6c8ed3a45c.html); seção 2 com texto "Quer saber mais sobre nossos roteiros, preencha o formulário" e formulário Nome, E-mail, Telefone, Mensagem; envio abre WhatsApp]
- `api/src/server.ts` [Rota /nossos-roteiros adicionada ao siteRoutes e app.get]
- `api/public/index-10.html`, `api/public/index-11.html`, `api/public/about.html`, `api/public/contact.html`, `api/public/portfolio.html`, `api/public/portfolio-single.html`, `api/public/blog.html`, `api/public/blog-single.html`, `api/public/includes/footer.html` [Links "Nossos Roteiros" alterados de Heyzine (target _blank) para /nossos-roteiros]

### Alterações
- O menu "Nossos Roteiros" passa a abrir uma página interna do site em vez do flipbook em nova aba. A nova página contém: (1) primeira seção com o embed do flipbook Heyzine (URL 6c8ed3a45c); (2) segunda seção com o texto "Quer saber mais sobre nossos roteiros? Preencha o formulário" e um formulário (nome, e-mail, telefone, mensagem). Ao enviar, o formulário abre o WhatsApp com mensagem pré-preenchida. Header e footer seguem o padrão do site; link ativo no menu na própria página.

---

## 2026-02-10 - Cliente: nova página Início com Turismo Pedagógico e Pacotes de Viagens

### Arquivos Modificados
- `cliente/inicio.html` [Nova página: primeira tela após login; dois frames clicáveis]
- `cliente/js/inicio.js` [Novo script: requireAuth, nome do cliente, logout, evitar clique no "!" abrir link]
- `cliente/js/login.js` [Redirecionamento pós-login alterado de dashboard.html para inicio.html]
- `cliente/dashboard.html` [Link "Início" e marca apontam para inicio.html]
- `cliente/pedidos.html`, `cliente/configuracoes.html` [Link "Início" apontando para inicio.html]
- `api/public/cliente/inicio.html`, `api/public/cliente/js/inicio.js` [Réplicas da nova página e script]
- `api/public/cliente/js/login.js` [Redirecionamento pós-login para inicio.html]
- `api/public/cliente/dashboard.html`, `api/public/cliente/pedidos.html`, `api/public/cliente/configuracoes.html` [Link "Início" para inicio.html]

### Alterações
- Após o login, o cliente passa a cair na nova página "Início" em vez do dashboard. A página Início exibe dois cards: "Turismo Pedagógico" (leva ao dashboard onde se insere o código da excursão pedagógica) e "Pacotes de Viagens" (redireciona para /portfolio.html – listagem de turismo convencional). Cada card tem um ícone "!" com tooltip explicando o uso: turismo pedagógico para pais acessarem a viagem pelo código da escola; pacotes para listagem de turismo convencional. O item de menu "Início" em todas as páginas do cliente agora aponta para inicio.html.

---

## 2026-02-10 - Página inicial: novos backgrounds das seções 1, 3, 4 e 5

### Arquivos Modificados
- `api/public/index-10.html` [background-image das seções 1, 3, 4 e 5 alterados para imagens da pasta FOTOS AVOAR PREFERIDAS]

### Alterações
- Seção 1: ©Alexandre Nery_Avoar_Bernoulli_SP_14.08.2025-180.jpg (museu/visita educativa). Seção 3: IMG_1011.jpg. Seção 4: DSC00349.JPG (portal Grande Sertão). Seção 5: Utilizar essa daqui.jpg (caverna). Seção 2 permanece inalterada.

---

## 2026-02-10 - Histórico do cliente: exibir pedidos convencionais

### Arquivos Modificados
- `api/src/routes/pedido.routes.ts` [GET /api/cliente/pedidos passa a incluir relação excursao (viagem convencional) além de excursaoPedagogica]
- `api/public/cliente/pedidos.html`, `cliente/pedidos.html` [Título do pedido usa excursaoPedagogica ou excursao conforme tipo; exibido rótulo "Excursão pedagógica" / "Viagem convencional"; estilo .pedido-tipo]

### Alterações
- Na tela "Meus Pedidos" do painel do cliente, passam a aparecer também as compras convencionais (viagens compradas pelo fluxo "Comprar Agora"). A API já retornava todos os pedidos do cliente; agora inclui os dados da excursão convencional (excursao) para pedidos tipo CONVENCIONAL. O frontend exibe o título da viagem e um rótulo indicando se é "Excursão pedagógica" ou "Viagem convencional".

---

## 2026-02-10 - Login com Google no painel do cliente visível e configurável

### Arquivos Modificados
- `api/public/cliente/login.html`, `cliente/login.html` [Seção .google-login-section exibida (display: block); comentário "oculto" removido]
- `api/.env.example` [GOOGLE_CLIENT_ID de exemplo com ID informado; GOOGLE_REDIRECT_URI com comentário para produção Railway]

### Alterações
- Botão "Continuar com Google" na tela de login do cliente deixou de estar oculto. Basta configurar GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REDIRECT_URI no .env (e no Railway em produção). No Google Cloud Console, adicionar a URI de redirecionamento autorizada (ex.: https://avoarturismo.up.railway.app/api/cliente/auth/google/callback para produção).

---

## 2026-02-10 - Checkout convencional: novo fluxo de compra para viagens

### Arquivos Modificados
- `api/prisma/schema.prisma` [Adicionado campo `tipo` (PedidoTipo: PEDAGOGICA | CONVENCIONAL) ao modelo Pedido com default PEDAGOGICA]
- `api/prisma/migration-add-tipo-pedido.sql` [Migration SQL manual para criar enum PedidoTipo e adicionar coluna tipo à tabela Pedido no Railway]
- `api/src/schemas/pedido.schema.ts` [Novos schemas: dadosPassageiroSchema (dados pessoais sem informações escolares/médicas) e createPedidoConvencionalSchema; exportado tipo CreatePedidoConvencionalInput]
- `api/src/routes/pedido.routes.ts` [Nova rota POST /api/cliente/pedidos/convencional: valida dados de passageiros via createPedidoConvencionalSchema, busca excursão por slug, cria pedido tipo CONVENCIONAL com itens mapeando passageiros]
- `api/public/portfolio-single.html` [Texto do botão WhatsApp alterado de "Reservar pelo WhatsApp" para "Saiba mais pelo WhatsApp"; adicionado botão "Comprar Agora" com id btnComprarAgora]
- `api/public/js/portfolio-single.js` [Função buyNow() atualizada para redirecionar para /cliente/checkout-convencional.html?viagem={slug}&quantidade={qty}]
- `api/public/cliente/checkout-convencional.html` [Nova página de checkout para viagens convencionais: layout simplificado com formulário dinâmico gerando campos de dados pessoais por passageiro, resumo do pedido lateral, validação frontend]
- `api/public/cliente/js/checkout-convencional.js` [Lógica do checkout convencional: lê parâmetros URL (viagem, quantidade), carrega dados da excursão via API, renderiza formulário com campos por passageiro (Nome, Sobrenome, CPF, País, CEP, Endereço, Número, Complemento, Cidade, Estado, Bairro, Telefone, Email), aplica máscaras, valida dados, envia POST /api/cliente/pedidos/convencional com authFetch]

### Alterações
- Implementado fluxo completo de compra para viagens convencionais (sem código, sem dados de aluno/escola). O usuário clica em "Comprar Agora" na página do pacote (portfolio-single.html), é redirecionado para checkout-convencional.html com slug da viagem e quantidade, preenche dados pessoais de cada passageiro (sem informações médicas ou educacionais), e o pedido é criado via nova rota /api/cliente/pedidos/convencional com tipo CONVENCIONAL. O campo `tipo` diferencia pedidos pedagógicos (PEDAGOGICA) de convencionais (CONVENCIONAL) na mesma tabela Pedido. Migration SQL manual documentada para aplicar no banco Railway. O botão WhatsApp na página do pacote agora exibe "Saiba mais pelo WhatsApp" para diferenciar do novo botão "Comprar Agora".

---

## 2026-02-10 - Menu: item "Nossos Roteiros" com link para flipbook

### Arquivos Modificados
- `api/public/index-10.html`, `api/public/index-11.html`, `api/public/blog.html`, `api/public/blog-single.html`, `api/public/contact.html`, `api/public/about.html`, `api/public/portfolio.html`, `api/public/portfolio-single.html`, `api/public/includes/footer.html` [Inserido item "Nossos Roteiros" após "Viagens" no menu principal, menu mobile, ícones da seção 1 (index-10) e links rápidos do rodapé; link externo para https://heyzine.com/flip-book/00c4b77d8b.html#page/1 com target="_blank" e rel="noopener noreferrer"]

### Alterações
- Novo item de navegação "Nossos Roteiros" em todas as páginas públicas (api/public), abrindo em nova aba o flipbook Heyzine. Incluído nos headers, menus mobile e rodapés; na home (index-10) também na barra de ícones da primeira seção, com ícone fa-book-open.

---

## 2026-02-10 - Navegação: Excursões para Viagens

### Arquivos Modificados
- `api/public/index-10.html`, `api/public/index-11.html`, `api/public/blog.html`, `api/public/blog-single.html`, `api/public/contact.html`, `api/public/about.html`, `api/public/portfolio.html`, `api/public/portfolio-single.html`, `api/public/includes/footer.html` [Rótulo de menu e links rápidos alterados de "Excursões" para "Viagens", mantendo as URLs `/excursoes`]

### Alterações
- Unificação da nomenclatura de navegação pública: em todas as páginas servidas via `/api/public`, o item de menu e os links de rodapé que apontam para `/excursoes` agora exibem o texto "Viagens" em vez de "Excursões", garantindo consistência visual com a marca e evitando termos diferentes para o mesmo destino.

---

## 2026-02-10 - Fix: validação de telefone removendo formatação

### Arquivos Modificados
- `api/public/cliente/js/checkout.js` [Removido `onlyDigits()` do telefone do responsável financeiro na coleta de dados; o telefone agora é enviado com formatação original (ex: "(12) 99674-7472") para passar na validação do backend]

### Alterações
- Ao criar pedido, o telefone do responsável estava sendo enviado sem formatação (apenas dígitos) porque a função `onlyDigits()` era aplicada antes do envio. Isso causava erro "Telefone inválido" mesmo com formato correto no input. A solução foi remover `onlyDigits()` do telefone, permitindo que a formatação original seja enviada e validada corretamente pelo backend.

---

## 2026-02-10 - Campos médicos do aluno opcionais no checkout

### Arquivos Modificados
- `api/public/cliente/js/checkout.js`, `cliente/js/checkout.js` [Removidos atributo `required` e `<span class="required">*</span>` dos campos "Plano de saúde do aluno", "Medicamentos em caso de febre/dor" e "Medicamentos em caso de alergia"; os três passam a ser opcionais no formulário de dados do aluno]

### Alterações
- No preenchimento dos dados do aluno no checkout, os campos "Plano de saúde do aluno", "Medicamentos em caso de febre/dor" e "Medicamentos em caso de alergia" deixaram de ser obrigatórios. O envio já aceitava valores vazios; apenas a validação HTML e a indicação visual (asterisco) foram removidas.

---

## 2026-02-08 - Sistema de Listas de Alunos por Excursão Pedagógica

### Arquivos Modificados
- `api/src/routes/lista-alunos.routes.ts` [Novas rotas para admin gerenciar listas: GET /api/admin/listas/excursoes retorna todas excursões pedagógicas com contagem de alunos e estatísticas por status; GET /api/admin/listas/excursao/:id/alunos lista alunos de uma excursão específica com dados completos e filtro por status de pedido; GET /api/admin/listas/excursao/:id/exportar gera arquivo Excel (.xlsx) com colunas Nome, Turma, Série, CPF, Telefone, Celular seguindo especificação da Lista de Chamada]
- `api/public/admin/listas.html` [Nova página com interface dupla: view de excursões (cards com stats de alunos, pedidos e status) e view de alunos (tabela detalhada com filtros); design responsivo com empty states; ações de navegação e exportação]
- `api/public/admin/js/listas.js` [Gerenciamento completo: carrega excursões com estatísticas agregadas; exibe lista de alunos com dados do pedido e cliente; filtros por status (PAGO, CONFIRMADO, PENDENTE); exportação Excel com download automático; tratamento de erros e estados vazios]
- `api/src/server.ts` [Registrada rota /api/admin/listas conectando o módulo lista-alunos.routes.ts]
- `api/public/admin/dashboard.html`, `api/public/admin/blog.html`, `api/public/admin/blog-editor.html`, `api/public/admin/excursoes.html`, `api/public/admin/excursao-editor.html`, `api/public/admin/excursoes-pedagogicas.html`, `api/public/admin/excursao-pedagogica-editor.html` [Adicionado item "Listas de Alunos" no menu lateral do admin com ícone fa-list-alt]
- `api/package.json` [Instalada biblioteca exceljs (^4.x) para geração de arquivos Excel com formatação]

### Alterações
- Implementado sistema completo de listas de alunos matriculados por excursão pedagógica. Cada excursão tem sua lista específica que é preenchida automaticamente conforme pedidos são criados. Admin pode visualizar estatísticas (total de alunos, total de pedidos, alunos por status: PAGO, CONFIRMADO, PENDENTE), filtrar alunos por status do pedido e exportar lista completa em Excel seguindo formato especificado. Arquivo Excel gerado contém: Nome (obrigatório, mínimo 2 caracteres), Turma, Série, CPF, Telefone (vazio), Celular (mapeado de telefoneResponsavel). Sistema valida dados, ignora linhas sem nome válido e gera logs detalhados. Exportação registra atividade no log do sistema.

---

## 2026-02-06 - Correção dos botões de ação no admin do blog

### Arquivos Modificados
- `api/public/admin/js/blog.js` [Removidos atributos onclick inline dos botões de editar/visualizar/deletar; adicionada função `attachButtonListeners()` que registra event listeners via `addEventListener`; botões agora usam classes CSS (`.btn-edit-post`, `.btn-view-post`, `.btn-delete-post`) e data attributes (`data-id`, `data-slug`, `data-titulo`) para identificação]

### Alterações
- Os botões de editar, visualizar e deletar posts na tabela do painel administrativo não funcionavam porque usavam `onclick` inline, bloqueado pelo CSP (Content Security Policy). A solução foi remover os `onclick` e adicionar event listeners via JavaScript externo usando `addEventListener`. Agora os botões funcionam corretamente: editar abre o editor com o post carregado, visualizar abre o post publicado em nova aba, e deletar solicita confirmação antes de excluir o post da API.

---

## 2026-02-06 - Correção do blog público: posts do admin agora aparecem no site

### Arquivos Modificados
- `blog.html` [Removido script inline antigo que chamava BlogManager.getAll(true) de forma síncrona; substituído por referência a `js/blog-public.js` externo]
- `blog-single.html` [Removido script inline antigo que chamava BlogManager.getBySlug(slug) de forma síncrona; substituído por referência a `js/blog-single-public.js` externo]
- `js/blog-public.js` [Copiado de api/public/js/blog-public.js - carrega posts publicados via API com await BlogManager.getAll(true)]
- `js/blog-single-public.js` [Copiado de api/public/js/blog-single-public.js - carrega post individual via API com await BlogManager.getBySlug(slug)]

### Alterações
- Os posts criados no painel administrativo (admin/blog.html) não apareciam no blog público do site porque os arquivos blog.html e blog-single.html da raiz usavam código inline antigo que chamava o BlogManager de forma síncrona (sem await). Isso fazia com que as chamadas à API retornassem Promises não resolvidas. Os scripts foram externalizados e agora usam async/await corretamente, fazendo com que os posts publicados pelo administrador apareçam na listagem do blog e nas páginas individuais de posts.

---

## 2026-02-06 - Blog admin: CSP, listagem e publicação via API

### Arquivos Modificados
- `api/public/admin/blog.html` [Script inline removido; carregamento de `js/blog.js` para compatibilidade com CSP (script-src 'self')]
- `api/public/admin/js/blog.js` [Novo: lógica de listagem, filtros, exclusão e formatação de posts em arquivo externo; chamadas assíncronas a BlogManager.getAll/delete]
- `api/public/admin/blog-editor.html` [loadPostForEdit, savePost e saveDraft convertidos para async/await; payload de status normalizado para PUBLICADO/RASCUNHO; data do post formatada para input date]
- `api/public/blog.html` [loadBlogPosts assíncrona com await BlogManager.getAll(true) para exibir posts publicados no site]
- `api/public/blog-single.html` [loadPost e loadRecentPosts assíncronas com await getBySlug/getAll; verificação de status PUBLICADO]

### Alterações
- Ao carregar a página "Gerenciar Blog" no admin, o CSP bloqueava o script inline e a lista de posts não era carregada. O script foi externalizado para `blog.js`, eliminando o erro de CSP. Os posts passaram a ser carregados e salvos via API (BlogManager assíncrono): a lista usa await getAll(), o editor usa await getById/create/update e envia status em maiúsculas (PUBLICADO/RASCUNHO). As páginas públicas do blog (listagem e post único) também passaram a usar await ao chamar a API, exibindo os posts publicados corretamente.

---

## 2026-02-04 - Reconciliação de pagamento PIX/cartão quando Asaas retorna erro

### Arquivos Modificados
- `api/src/config/asaas.ts` [Nova função listarPagamentosPorReferencia(externalReference) para consultar pagamentos na Asaas por id do pedido; erros de criação PIX/cartão repassados para as rotas em vez de lançar exceção]
- `api/src/routes/pagamento.routes.ts` [POST /pix e POST /cartao: em caso de erro da Asaas ao criar cobrança, consulta listarPagamentosPorReferencia(pedidoId); se existir pagamento confirmado/recebido, atualiza pedido para PAGO e retorna 200; senão retorna 400 com mensagem Asaas, evitando 500 quando a cobrança de fato ocorreu]
- `api/public/admin/config-pagamento.html` [Ajustes de exibição do status e teste de conexão Asaas]

### Alterações
- Cobrança aprovada no cartão ou PIX mas resposta da Asaas com erro (ex.: "Transação não autorizada") deixava de atualizar o pedido e retornava 500. Agora, após erro na criação, a API consulta pagamentos pela referência do pedido na Asaas; se houver pagamento confirmado, o pedido é marcado como PAGO e o cliente recebe 200, alinhando estado do sistema ao que realmente foi pago.

---

**Mantidas apenas as últimas 5 versões conforme regra do projeto**
