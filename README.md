# Avorar Turismo - Sistema Completo

Sistema de site e administração para Avorar Turismo com backend em Node.js/Express, banco de dados PostgreSQL e frontend em HTML/CSS/JavaScript.

## Arquivos Modificados [Resumo das Atualizações]

### Última atualização (2026-02-06) - Correção do blog público: posts do admin agora aparecem no site
- **blog.html** [Removido script inline antigo que chamava BlogManager.getAll(true) de forma síncrona; substituído por referência a js/blog-public.js externo]
- **blog-single.html** [Removido script inline antigo que chamava BlogManager.getBySlug(slug) de forma síncrona; substituído por referência a js/blog-single-public.js externo]
- **js/blog-public.js** [Copiado de api/public/js/blog-public.js - carrega posts publicados via API com await BlogManager.getAll(true)]
- **js/blog-single-public.js** [Copiado de api/public/js/blog-single-public.js - carrega post individual via API com await BlogManager.getBySlug(slug)]

Resumo: Os posts criados no painel administrativo (admin/blog.html) não apareciam no blog público do site porque os arquivos blog.html e blog-single.html da raiz usavam código inline antigo que chamava o BlogManager de forma síncrona (sem await). Isso fazia com que as chamadas à API retornassem Promises não resolvidas. Os scripts foram externalizados e agora usam async/await corretamente, fazendo com que os posts publicados pelo administrador apareçam na listagem do blog e nas páginas individuais de posts.

### Versão anterior (2026-02-06) - Blog admin: CSP, listagem e publicação via API
- **api/public/admin/blog.html** [Script inline removido; carregamento de blog.js para respeitar CSP]
- **api/public/admin/js/blog.js** [Novo: listagem, filtros e exclusão de posts com chamadas assíncronas à API]
- **api/public/admin/blog-editor.html** [savePost, saveDraft e loadPostForEdit em async/await; status enviado como PUBLICADO/RASCUNHO]
- **api/public/blog.html**, **api/public/blog-single.html** [loadBlogPosts, loadPost e loadRecentPosts assíncronas com await à API]

Resumo: A página "Gerenciar Blog" do admin quebrava ao carregar por violação de CSP (script inline bloqueado). O script foi externalizado em blog.js, corrigindo o erro. Os posts passaram a ser listados e salvos via API: a lista e o editor usam await em getAll/getById/create/update; o status é enviado em maiúsculas (PUBLICADO/RASCUNHO). As páginas públicas do blog também passaram a aguardar a API, exibindo os posts publicados no site.

### Versão anterior (2026-02-06) - Grid de excursões pedagógicas no admin
- **api/public/admin/css/admin-style.css** [Container `#excursoesGrid.excursoes-pedagogicas-grid` passou a usar grid responsivo com `repeat(auto-fill, minmax(260px, 1fr))`, organizando os cards de excursões pedagógicas em múltiplas colunas no desktop e empilhando em uma coluna apenas em telas menores]

Resumo: A listagem de excursões pedagógicas no painel administrativo deixou de empilhar todos os cards em uma única coluna larga. O CSS do grid foi ajustado para um layout de colunas responsivo, fazendo com que cada excursão seja exibida em um card alinhado dentro de um grid fluido (2–3 colunas conforme a largura disponível), melhorando a leitura e o aproveitamento de espaço sem alterar a lógica de carregamento das excursões.

### Versão anterior (2026-02-06) - Logout consistente no painel admin
- **api/public/admin/js/admin-main.js** [Link lateral com id `navLogout` agora é conectado automaticamente à função `logout()`, garantindo que o clique em "Sair" limpe a autenticação e redirecione o administrador para `login.html` em qualquer página do painel]

Resumo: Padronizado o comportamento do botão "Sair" no painel administrativo. Sempre que o item de menu com id `navLogout` estiver presente, o JavaScript central (`admin-main.js`) registra um listener que chama `logout()`, removendo o token/estado de login e levando o usuário de volta à tela de login do admin, evitando páginas do painel acessíveis após logout.

### Versão anterior (2026-02-06) - Tipografia unificada e ajustes na página inicial
- **css/style.css**, **api/public/css/style.css** [Site inteiro usando apenas Cairo (base) e Montserrat (destaques), removendo fontes Gotham/Monument/Telegraf/Khula e centralizando o carregamento via Google Fonts]
- **css/about-page.css**, **css/footer.css**, **css/avoar-custom.css**, **css/consultant-form.css** e equivalentes em **api/public/css/** [Títulos, parágrafos, botões e labels alinhados ao novo padrão tipográfico Cairo/Montserrat]
- **css/avoar-sections-page.css**, **api/public/css/avoar-sections-page.css** [Hero da página inicial com melhor alinhamento vertical do título, botão de Pagamento/Login e texto, além de ícones de navegação com espaçamento mais confortável]
- **api/public/admin/css/admin-style.css** [Painel administrativo atualizado para usar Cairo como fonte principal, mantendo consistência visual com o site público]

Resumo: Foi feita uma limpeza geral de tipografia, padronizando o projeto para usar apenas Cairo como fonte principal e Montserrat em destaques, removendo fontes customizadas antigas. A hero da página inicial foi refinada (título, botão e texto reposicionados) e os ícones de navegação ganharam espaçamento ajustado, melhorando leitura e usabilidade sem alterar o fluxo de navegação.

### Versão anterior (2026-02-04) - Reconciliação PIX/cartão quando Asaas retorna erro
- **api/src/config/asaas.ts** [listarPagamentosPorReferencia para consultar pagamentos por pedido na Asaas; erros de criação repassados às rotas]
- **api/src/routes/pagamento.routes.ts** [POST /pix e POST /cartao: em erro da Asaas, consulta pagamentos por referência; se houver pagamento confirmado, atualiza pedido para PAGO e retorna 200; senão 400 com mensagem]
- **api/public/admin/config-pagamento.html** [Ajustes de status e teste de conexão]

Resumo: Quando a cobrança é aprovada (cartão ou PIX) mas a Asaas devolve erro, a API passa a consultar os pagamentos do pedido na Asaas. Se existir pagamento confirmado, o pedido é marcado como PAGO e o cliente recebe sucesso (200), evitando 500 e inconsistência entre cobrança real e estado do sistema.

### Versão anterior (2026-02-04) - Checkout: etapa de pagamento PIX e Cartão (Asaas)
- **cliente/checkout.html**, **api/public/cliente/checkout.html** [Seção de pagamento com opções PIX (QR Code + copiar) e Cartão de crédito (formulário completo)]
- **cliente/js/checkout.js**, **api/public/cliente/js/checkout.js** [Etapa pagamento após criar pedido; listeners únicos; PIX selecionado por padrão; gerarPix, polling de status, pagarComCartao integrados à API]

Resumo: Após finalizar o pedido, o cliente vê a etapa de pagamento com valor total, pode pagar por PIX (QR Code e código copiável, com verificação automática de status) ou por cartão de crédito (formulário enviado para POST /api/cliente/pagamento/cartao). Integração completa com Asaas.

### Versão anterior (2026-02-04) - Checkout: todos os campos do admin (responsável + aluno + médico)
- **api/prisma/schema.prisma**, **api/src/schemas/pedido.schema.ts**, **api/src/routes/pedido.routes.ts** [Dados do responsável financeiro e campos por aluno]
- **cliente/checkout.html**, **cliente/js/checkout.js**, **api/public/...** [Formulários completos e envio no submit]

Resumo: Checkout com todos os campos do admin (responsável financeiro e por aluno: estudante + médicos). Migration necessária quando o banco estiver acessível.

### Versão anterior (2026-02-04) - Checkout cliente: UX, erros por campo e design
- **cliente/checkout.html**, **api/public/cliente/checkout.html** [Navbar igual ao dashboard; design com variáveis do sistema; formulário em seções (Aluno N, Dados do responsável); labels com hint e obrigatório; bloco de erro com título + lista; estilos para campo inválido e mensagem inline]
- **cliente/js/checkout.js**, **api/public/cliente/js/checkout.js** [Uso de resData.details para mostrar quais campos falharam e por quê; clearFieldErrors; showValidationErrors (lista no topo + marcação nos inputs); formulários gerados com seções e labels organizadas]

Resumo: A página de checkout passou a exibir erros de validação de forma clara (lista “Aluno N – Campo: motivo” e marcação nos campos) usando o array details já retornado pela API em 400. Design alinhado à área do cliente (navbar, cores, cards) e labels organizadas em seções com hints e indicação de obrigatório.

### Versão anterior (2026-02-04) - Excursão e dashboard: CSP + pattern removido
- **api/public/cliente/excursao.html**, **cliente/excursao.html** [Script inline removido; carregamento de js/excursao.js; botão Checkout sem onclick]
- **api/public/cliente/js/excursao.js**, **cliente/js/excursao.js** [Novo: carregar excursão por código, exibir, calcular total e ir para checkout em arquivo externo para CSP]
- **api/public/cliente/dashboard.html**, **cliente/dashboard.html** [Removido atributo pattern do input de código para evitar SyntaxError com flag /v]
- **api/public/cliente/js/dashboard.js**, **cliente/js/dashboard.js** [Validação do código no submit em JS com regex ^[A-Za-z0-9_\-]+$]

Resumo: A página de excursão ficava carregando eternamente porque o CSP bloqueava o script inline; o dashboard ainda quebrava por causa do pattern no input. Script da excursão externalizado em excursao.js; pattern removido do dashboard e validação feita só em JavaScript.

### Versão anterior (2026-02-04) - Dashboard cliente: CSP e regex do código
- **api/public/cliente/dashboard.html**, **cliente/dashboard.html** [Script inline removido e carregamento de js/dashboard.js; pattern do código alterado para [-A-Za-z0-9_]+; botão Sair sem onclick]
- **api/public/cliente/js/dashboard.js**, **cliente/js/dashboard.js** [Novo: lógica do dashboard (auth, logout, busca por código) em arquivo externo para respeitar CSP]

Resumo: A área do cliente não conseguia acessar a excursão por código porque o CSP bloqueava o script inline e o pattern do input gerava regex inválida. Script externalizado em dashboard.js e pattern corrigido; busca e logout passam a funcionar.

### Versão anterior (2026-02-04) - Código gerado por destino e data na API pedagógicas
- **api/prisma/schema.prisma** [Campos opcionais destino (String?) e dataDestino (DateTime?) em ExcursaoPedagogica; usados pela API para gerar codigo]
- **api/src/schemas/excursao-pedagogica.schema.ts** [Criação: codigo opcional; adicionados destino e dataDestino (YYYY-MM-DD); refine exige codigo OU (destino + dataDestino)]
- **api/src/routes/excursao-pedagogica.routes.ts** [POST: se destino e dataDestino enviados, gera codigo via generateCodigoFromDestino; PUT: converte dataDestino string para Date]
- **api/src/utils/slug.ts** [Função generateCodigoFromDestino(destino, dataDestino, existingCodigos) — codigo = slug(destino)-YYYY-MM-DD, sufixo -2/-3 se colisão]
- **api/docs/ENVIO-EXCURSOES-RESUMO.md** [Doc: código manual (admin) ou gerado pela API (destino + dataDestino); exemplos mínimo e completo com destino/dataDestino]

Resumo: Código da excursão pedagógica pode ser criado/editado manualmente no avsite ou gerado pela API quando outro sistema envia destino (nome) e dataDestino (YYYY-MM-DD). O código gerado é slug(destino)-data, por exemplo museu-de-ciencias-2025-03-15; em colisão a API acrescenta -2, -3, etc.

### Versão anterior (2026-02-04) - API de integração apenas Excursões Pedagógicas
- **api/docs/ENVIO-EXCURSOES-RESUMO.md** [Documentação alterada: API de envio passa a referir exclusivamente Excursões Pedagógicas; URLs atualizadas para /api/excursoes-pedagogicas; campo obrigatório codigo adicionado; exemplos e códigos de resposta ajustados; nota explícita de que excursões normais são criadas apenas pelo avsite]

Resumo: A API que outros sistemas utilizam para criar/atualizar excursões agora documenta apenas Excursões Pedagógicas (POST/PUT/PATCH em /api/excursoes-pedagogicas). Excursões normais continuam sendo criadas e gerenciadas somente pelo painel avsite.

### Versão anterior (2026-02-04) - Fluxo Cliente e Editor Excursão Pedagógica
- **cliente/login.html**, **api/public/cliente/login.html** [Script da página de login do cliente alterado para carregar `js/auth-manager.js` em vez de `../js/api-client.js`, garantindo que `clienteAuth` exista e o login (tradicional e Google OAuth) funcione]
- **api/public/admin/excursao-pedagogica-editor.html** [Placeholder removido; formulário completo com código único, título, preço, imagens, galeria, descrição, inclusos, local, horário, tags e ações Salvar/Salvar como Inativo]
- **api/public/admin/js/excursao-pedagogica-editor.js** [Novo: lógica do editor usando ExcursaoPedagogicaManager; validação de código; criar/editar excursão pedagógica com redirecionamento para listagem]

Resumo: Correção do login do cliente (auth-manager) e editor completo de excursões pedagógicas no admin, permitindo criar/editar excursões com código único usado pelo cliente na busca e no fluxo de compra (dashboard → código → excursão → quantidade → checkout com dados por aluno).

### Versão anterior (2026-02-04) - Gateway de Pagamento Asaas (PIX + Webhook)
- **api/src/config/asaas.ts** [Configuração e serviço Asaas - funções criarCobrancaAsaas, consultarPagamentoAsaas, processarWebhookAsaas, verificarConfigAsaas]
- **api/src/schemas/pagamento.schema.ts** [Schemas Zod para validação - criarPagamentoPixSchema, criarPagamentoCartaoSchema, dadosCartaoSchema, asaasWebhookSchema]
- **api/src/routes/pagamento.routes.ts** [Rotas de pagamento - POST /pix, POST /cartao, GET /:pedidoId/status]
- **api/src/routes/webhook.routes.ts** [Webhook Asaas - POST /asaas recebe notificações automáticas de pagamento]
- **api/ASAAS-CONFIG.md** [Documentação completa de configuração, exemplos e fluxo de pagamento]
- **api/src/server.ts** [Registradas rotas /api/cliente/pagamento e /api/webhooks]
- **api/.env.example** [Adicionadas variáveis ASAAS_API_KEY, ASAAS_ENVIRONMENT, ASAAS_WEBHOOK_URL]
- **api/package.json** [Instalado SDK asaas]

**Funcionalidade implementada**: Sistema de pagamento completo via Asaas. Cliente inicia pagamento PIX recebendo QR Code instantâneo. Asaas envia webhook automático ao confirmar pagamento. Sistema atualiza status do pedido (AGUARDANDO_PAGAMENTO → PAGO → CONFIRMADO), registra datas e gera logs detalhados. Validações rigorosas com Zod, cliente só paga pedidos próprios, cartão preparado para implementação futura.

### Versão anterior (2026-02-04) - Frontend Cliente: Login, Busca e Checkout (Fase 5)
- **cliente/login.html** [Página de login com email/senha e botão Google OAuth; design moderno com gradiente laranja; mensagens de erro/sucesso]
- **cliente/registro.html** [Criação de conta com validação de senha forte; requisitos visuais]
- **cliente/dashboard.html** [Página inicial com busca por código; navbar com navegação; campo de busca uppercase]
- **cliente/excursao.html** [Detalhes da excursão: imagem, preço, info, descrição; seletor de quantidade; cálculo de total; botão checkout]
- **cliente/checkout.html** [Formulários dinâmicos para cada aluno baseado em quantidade; dados completos (nome, idade, escola, responsável); resumo do pedido; criação via API]
- **cliente/pedidos.html** [Histórico de pedidos com status coloridos (PENDENTE, PAGO, CONFIRMADO); filtros; dados resumidos]
- **cliente/configuracoes.html** [Edição de perfil: nome, telefone; email bloqueado; atualização via API]
- **cliente/js/auth-manager.js** [Gerenciador completo: login, registro, logout, OAuth callback, proteção de rotas, fetchAuth com token, verificação JWT]
- **cliente/js/login.js** [Handler de login tradicional e Google; processamento de OAuth callback; validações; redirecionamento]
- **cliente/js/registro.js** [Criação de conta com validações; redirect para login após sucesso]

**Funcionalidade implementada**: Interface completa do cliente. Fluxo: login (tradicional ou Google) → dashboard com busca por código → visualiza excursão e seleciona quantidade → checkout com formulários dinâmicos para cada aluno → finaliza pedido → vê histórico com status → edita perfil. Sistema protege rotas autenticadas, gerencia token JWT local, processa OAuth automaticamente e integra com todas APIs backend.

### Versão anterior (2026-02-04) - Sistema de Pedidos de Excursões Pedagógicas (Fase 4)
- **api/prisma/schema.prisma** [Novos models: Pedido (clienteId, excursaoPedagogicaId, quantidade, valorTotal, status, pagamento) e ItemPedido (dados do aluno: nome, idade, escola, CPF, responsável); enum PedidoStatus com 6 estados; relacionamentos Cliente→Pedidos, ExcursaoPedagogica→Pedidos, Pedido→ItemPedidos]
- **api/src/schemas/pedido.schema.ts** [Validação Zod completa: dadosAlunoSchema (nome obrigatório, idade, escola, CPF, responsável com validações), createPedidoSchema (código, quantidade, array de alunos), updatePedidoStatusSchema, filterPedidosSchema; validação cruzada quantidade=length(dadosAlunos)]
- **api/src/routes/pedido.routes.ts** [GET /excursao/:codigo (busca pública por código), POST / (criar pedido com transação), GET / (listar pedidos do cliente), GET /:id (detalhes completos), PATCH /:id/status (admin atualiza status); cálculo automático de valorTotal; logs detalhados]
- **api/src/server.ts** [Registro de rotas /api/cliente/pedidos]

**Funcionalidade implementada**: Sistema completo de pedidos onde cliente busca excursão por código único, seleciona quantidade de passagens e preenche dados de cada aluno. Pedido criado com status PENDENTE, valor calculado automaticamente (preço×quantidade), dados dos alunos salvos em ItemPedido. Cliente vê histórico de pedidos, admin pode alterar status. Transação garante consistência: se falhar criação de item, pedido também é revertido.

### Versão anterior (2026-02-04) - Sistema de Autenticação de Clientes - OAuth Google (Fase 2)
- **api/package.json** [Nova dependência: googleapis para integração OAuth]
- **api/src/config/google-oauth.ts** [Configuração OAuth: getGoogleAuthUrl, getGoogleUserInfo, verifyGoogleOAuthConfig com logs detalhados]
- **api/src/schemas/cliente-auth.schema.ts** [Novos schemas: googleOAuthCallbackSchema e linkGoogleAccountSchema]
- **api/src/routes/cliente-auth.routes.ts** [Rotas OAuth: GET /google (inicia fluxo), GET /google/callback (processa login), POST /google/link (vincular conta)]
- **api/src/utils/api-error.ts** [Novo método: ApiError.notImplemented() para status 501]
- **api/.env.example** [Documentação variáveis: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, FRONTEND_URL]

**Funcionalidade implementada**: Login via Google OAuth completo. Cliente pode fazer login com conta Google, sistema cria ou atualiza cliente automaticamente, vincula googleId, sincroniza foto de perfil e email verificado. Se cliente já existe por email/senha, vincula conta Google ao fazer primeiro login OAuth. Fluxo completo: redirect Google → callback → busca dados → cria/atualiza cliente → gera JWT → redirect frontend com token.

### Versão anterior (2026-02-04) - Sistema de Autenticação de Clientes (Fase 1)
- **api/prisma/schema.prisma** [Novo modelo Cliente com suporte a autenticação local e OAuth; enum AuthProvider]
- **api/src/schemas/cliente-auth.schema.ts** [Validação Zod completa: registro com senha forte, login, atualização de perfil e troca de senha]
- **api/src/middleware/cliente-auth.middleware.ts** [Middleware de autenticação JWT exclusivo para clientes com logs detalhados]
- **api/src/routes/cliente-auth.routes.ts** [Rotas completas: registro, login, perfil, atualizar dados e trocar senha]
- **api/src/server.ts** [Registro de rotas /api/cliente/auth separadas das rotas de admin]

**Funcionalidade implementada**: Sistema completo de autenticação para clientes separado do sistema de administração. Inclui registro com validação de senha forte (maiúscula, minúscula, número), login com JWT, gerenciamento de perfil, troca de senha e suporte preparado para OAuth Google (Fase 2). Todos endpoints têm logs detalhados e validação rigorosa com Zod. Clientes ficam em tabela separada dos admins para maior segurança.

### Versão anterior (2026-02-04) - Sistema de Excursões Pedagógicas
- **api/prisma/schema.prisma** [Novos modelos: ExcursaoPedagogica e ExcursaoPedagogicaImagem com campo codigo único]
- **api/src/schemas/excursao-pedagogica.schema.ts** [Validação Zod com campo codigo obrigatório e regex para formato]
- **api/src/routes/excursao-pedagogica.routes.ts** [CRUD completo: criar, listar, atualizar, excluir e alterar status]
- **api/src/routes/public.routes.ts** [Rotas públicas: /api/public/excursoes-pedagogicas, busca por slug e código]
- **api/src/server.ts** [Registro de rotas /api/excursoes-pedagogicas]
- **js/api-client.js** [Novo ExcursaoPedagogicaManager com métodos CRUD e busca por código]
- **admin/excursoes-pedagogicas.html** [Página de listagem com filtros por busca, código, categoria e status]
- **admin/excursao-pedagogica-editor.html** [Editor completo com campo código único e todas funcionalidades de excursões]
- **admin/js/excursoes-pedagogicas.js** [Gerenciamento da listagem com badge de código]
- **admin/js/excursao-pedagogica-editor.js** [Editor com validação de código (alfanumérico, hífen e underscore)]
- **admin/*.html** [Menu de controle "Excursões Pedagógicas" adicionado em todas páginas admin]

**Funcionalidade implementada**: Sistema completo de Excursões Pedagógicas para registros de sistemas externos via API. Possui código único para identificação, CRUD admin completo, API pública e privada, validação rigorosa e integração com painel administrativo. Não aparece no menu público do site.

### Versão anterior (2026-02-04) - Fix: Seção Sobre esta Excursão em preto
- **api/public/portfolio-single.html**, **portfolio-single.html** [Fundo branco explícito na seção; opacity do body-bg-layer reduzida]
- **api/public/js/portfolio-single.js**, **js/portfolio-single.js** [Tratamento robusto de descricao e galeria]

### Versão anterior (2026-02-04) - Documento resumido de envio de excursões
- **api/docs/ENVIO-EXCURSOES-RESUMO.md** [Novo: documento direto com o que enviar e como; login, criar, atualizar e alterar status; campos obrigatórios e opcionais; exemplos mínimos e completos]

### Versão anterior (2026-02-04) - Fix: CSP na página de detalhe da excursão
- **api/public/js/portfolio-single.js**, **js/portfolio-single.js** [Novo: lógica da página de detalhe em arquivo externo; loadExcursao async com await getBySlug; status ATIVO]
- **api/public/portfolio-single.html**, **portfolio-single.html** [Removido script inline; botões com data-tab/aria-label]

**Problema corrigido**: Na página da excursão (ex.: ?slug=cristo-redentor) não aparecia informação; CSP bloqueava script inline. Script externalizado e getBySlug corrigido (await + status ATIVO).

### Versão anterior (2026-02-04) - Fix: CSP bloqueava script na página de excursões
- **api/public/js/portfolio-excursoes.js**, **js/portfolio-excursoes.js** [Novo: lógica da página de excursões em arquivo externo]
- **api/public/portfolio.html**, **portfolio.html** [Removido script inline; referência a portfolio-excursoes.js; filtros sem onclick]

**Problema corrigido**: CSP (script-src 'self') bloqueava o script inline em /excursoes, então as excursões não carregavam e a página ficava em "Carregando excursões...". Script externalizado e filtros com addEventListener.

### Versão anterior (2026-02-04) - Fix: Excursão no admin não aparece no site público
- **api/src/routes/public.routes.ts** [Filtro de excursões públicas usa enum Prisma `ExcursaoStatus.ATIVO`; log de requisição GET /excursoes]
- **api/public/portfolio.html**, **portfolio.html** [Timeout 15s na carga de excursões; loading sempre removido]

### Versão anterior (2026-02-04) - Fix: Excursões não aparecem na listagem
- **js/api-client.js**, **api/public/js/api-client.js** [Removido try/catch que engolia erros em getAll(); erro agora propagado]
- **admin/excursoes.html**, **api/public/admin/excursoes.html** [Tratamento de erro com mensagem detalhada, botão "Tentar novamente", redireciona para login em 401]
- **api/public/portfolio.html** [Adicionado mensagem de erro na página pública de excursões]
- **api/src/routes/excursao.routes.ts**, **api/src/routes/public.routes.ts** [Melhor tratamento de filtros e logs com mais contexto]

### Versão anterior (2026-02-02) - Seção Parceiros na página Sobre Nós
- **about.html**, **api/public/about.html** [Seção "Parceiros de longa data": layout alterado para texto em cima e imagem embaixo; imagem trocada para parceiros.jpeg com logos dos colégios]
- **css/about-page.css**, **api/public/css/about-page.css** [Classe proof-layout-stacked para layout empilhado centralizado]
- **api/public/images/Imagens para o site/parceiros.jpeg** [Nova imagem dos parceiros copiada para o site]

### Versão anterior (2026-02-02) - Botão Login alterado para Inscreva-se / Login
- **index-10.html**, **index-11.html**, **about.html**, **blog.html**, **blog-single.html**, **contact.html**, **portfolio.html**, **portfolio-single.html** e equivalentes em **api/public/** [Texto do botão na primeira seção (header) alterado de "Login" para "Inscreva-se / Login" em desktop e menu mobile]

### Versão anterior (2026-02-02) - Sistema de logs detalhado para diagnóstico
- **api/src/routes/post.routes.ts**, **api/src/routes/excursao.routes.ts** [Logs estruturados para todas operações CRUD com emojis identificadores; contexto completo (userId, dados, timestamps); logs de erro com stack trace]
- **api/docs/SISTEMA-LOGS-DETALHADO.md** [Novo: documentação completa do sistema de logs; exemplos de busca no Railway; diagnóstico de problemas comuns]

### Versão anterior (2026-02-02) - Correção do sistema admin bloqueado por CSP e seed otimizado
- **api/prisma/seed.ts** [Seed agora verifica se dados existem; cria apenas admin e pula excursões/posts de teste se banco não estiver vazio]
- **admin/js/excursao-editor.js**, **api/public/admin/js/excursao-editor.js** [Novo: scripts externalizados para compatibilidade com CSP; criação de excursões funcionando]
- **admin/excursao-editor.html**, **api/public/admin/excursao-editor.html** [Removidos handlers inline; formulário com event listeners externos]

### Versão anterior (2026-02-02) - Correção do login bloqueado por CSP
- **admin/login.html**, **api/public/admin/login.html** [Removidos script inline e onsubmit; carregamento de js/login.js externo]
- **admin/js/login.js**, **api/public/admin/js/login.js** [Novo: lógica de login externalizada para compatibilidade com Helmet CSP; login passa a funcionar em produção]

### Versão anterior (2026-02-02) - Substituição de imagens do site
- **index-11.html**, **index-10.html** [Carrossel Biologia Marinha e 5 seções iniciais com imagens da pasta Imagens para o site; Biologia Marinha usa subpasta Biologia marinha]
- **about.html**, **portfolio.html**, **portfolio-single.html**, **blog.html**, **blog-single.html** e equivalentes em **api/public/** [Backgrounds, hero, parceiros, fallbacks de excursões e posts]
- **js/data-manager.js**, **api/public/js/data-manager.js**, **api/prisma/seed.ts** [Excursões e posts com imagens da nova pasta]
- **images/Imagens para o site** copiada para api/public/images/ para o site online

### Versão anterior (2026-02-02) - Novo header em todas as páginas do site
- **css/avoar-top-header.css**, **api/public/css/avoar-top-header.css** [Fundo preto; conteúdo com padding-top 80px]
- **about.html**, **blog.html**, **blog-single.html**, **contact.html**, **portfolio.html**, **portfolio-single.html** e equivalentes em **api/public/** [Top header (logo, nav Início/Biologia Marinha/Excursões/Sobre Nós/Blog/Contato, botão Login) em todas as páginas públicas; link ativo por página]
- **index-11.html**, **api/public/index-11.html** [Menu do header com Excursões e Blog]

### Versão anterior (2026-02-02) - Login e logs
- **admin/login.html**, **api/public/admin/login.html** [Removido texto "API: Verificando..." da tela de login]
- **api/src/routes/auth.routes.ts** [Logs de login com prefixo "Logs avsite" para filtro no Railway]
- **js/api-client.js**, **api/public/js/api-client.js** [BASE_URL em produção = mesma origem; login e redirecionamento corrigidos]

### Frontend - Página Inicial
- `index-10.html`, `api/public/index-10.html` [5 seções fullscreen com scroll e background-image em cada seção; substitui carrossel]
- `css/avoar-sections-page.css`, `api/public/css/avoar-sections-page.css` [Estilos para seções, animações e responsividade]

### Versão anterior (2026-01-31)
- **admin/login.html** [Página de login reconstruída: layout minimalista com gradiente laranja no fundo, formulário centralizado, campos cinza claro, botão laranja, link Esqueceu a senha; mantidas funcionalidades de login, API e Lembrar-me]

### Versão anterior (2026-01-31)
- **css/testimonials.css** [Fundo da seção sem azul: background transparent para seguir o fundo normal da página]
- **about.html / api/public/about.html** [Removida primeira seção de depoimentos (owl-carousel); mantida apenas a segunda com Google 4.9 e carousel próprio]
- **js/testimonials.js** [Script passa a usar .testimonials-section como escopo; frases dos depoimentos aparecem no carousel correto]

### Versão anterior (2026-01-31)
- **css/testimonials.css** [Novo arquivo: seção de depoimentos com carousel]
- **js/testimonials.js** [Novo arquivo: classe TestimonialsCarousel para rotação automática a cada 8 segundos]
- **about.html** [Adicionada seção "Experiências Reais" com 27 depoimentos de clientes]

### Backend (API Node.js)
- `api/src/server.ts` [Servidor com URLs amigáveis: /inicio, /biologia-marinha, /sobre-nos, /blog, /contato, /excursoes; API em /api/*]
- `api/src/routes/*.ts` [APIs REST para excursões, posts, auth, uploads e pagamentos - agora com type safety completo]
- `api/src/routes/auth.routes.ts` [Corrigida geração de tokens JWT com type casting seguro]
- `api/src/routes/excursao.routes.ts` [Corrigido type casting de query parameters]
- `api/src/routes/post.routes.ts` [Corrigido type casting de query parameters]
- `api/prisma/schema.prisma` [Schema do banco PostgreSQL com modelos completos]
- `api/prisma/seed.ts` [Script para popular banco com dados iniciais]

### Cliente da API (Frontend)
- `js/api-client.js` [Biblioteca JavaScript para consumir API - substitui localStorage]

### Sistema Administrativo
- `admin/login.html` [Login atualizado para autenticação via API JWT]
- `admin/excursoes.html` [Listagem de excursões via API com CRUD completo]
- `admin/excursao-editor.html` [Editor de excursões integrado com API]

### Documentação
- `api/API-DOCS.md` [Documentação completa da API pública para integrações]
- `api/docs/INTEGRACAO-ENVIO-EXCURSOES.md` [Documento técnico: como outro programa deve usar a API para enviar excursões — base URL Railway (avoarturismo.up.railway.app), auth JWT, POST/PUT, schema, exemplos e erros]
- `api/docs/CHECKLIST-PRODUCAO.md` [Verificação completa se a API está pronta para produção — checklist de servidor, BD, auth, validação, CORS, rate limit, seed, variáveis env, logging e conclusão]
- `api/docs/SISTEMA-LOGGING.md` [Sistema de logging: Winston, prefixo [AVSITE-API], request logger middleware, exemplos de saída, visualização no Railway Logs, níveis e contextos]
- `api/docs/COMO-TESTAR-API.md` [Guia para testar se a API está funcionando: health, login, listar/criar excursões, curl, Postman, script automático]
- `api/scripts/test-api.js` [Script Node.js para testar a API em sequência (health, login, listar, criar excursão)]
- `api/DEPLOY-RAILWAY.md` [Guia passo a passo para deploy no Railway]

## Funcionalidades Implementadas

1. **API REST Completa**: Backend Node.js + Express + Prisma + PostgreSQL
2. **Autenticação JWT**: Sistema seguro de login/logout com tokens (Admin + Cliente)
3. **OAuth Google**: Login social para clientes via Google
4. **CRUD Excursões**: Criar, editar, listar e excluir excursões
5. **CRUD Posts**: Gerenciamento completo do blog
6. **Upload de Imagens**: Sistema de upload com processamento via Sharp
7. **Sistema de Pedidos**: Clientes podem criar pedidos com dados de múltiplos alunos
8. **Gateway de Pagamento**: Integração completa com Asaas (PIX + Webhook)
9. **Integração Externa**: API pública documentada para outros sistemas

## Como Executar

### Desenvolvimento Local

```bash
# Backend
cd api
npm install
npm run prisma:generate
npm run prisma:push
npm run seed
npm run dev

# Frontend - servir arquivos estáticos
# Use extensão Live Server do VSCode ou similar
```

### Credenciais de Teste
- **Email:** admin@avorar.com
- **Senha:** admin123
- **Acesso:** /admin/login.html

## Tecnologias

- **Backend:** Node.js, Express, TypeScript, Prisma
- **Banco:** PostgreSQL (Railway)
- **Validação:** Zod
- **Autenticação:** JWT (jsonwebtoken) + Google OAuth
- **Pagamento:** Asaas (PIX + Cartão)
- **Upload:** Multer + Sharp
- **Frontend:** HTML5, CSS3, JavaScript Vanilla
