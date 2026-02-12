# Avorar Turismo - Sistema Completo

Sistema de site e administração para Avorar Turismo com backend em Node.js/Express, banco de dados PostgreSQL e frontend em HTML/CSS/JavaScript.

## Arquivos Modificados [Resumo das Atualizações]

### Última atualização (2026-02-12) - feat: máscara automática CEP no checkout
- **api/public/cliente/js/checkout.js** [Máscara CEP (00000-000) em respCep e cardHolderCep]
- **api/public/cliente/js/checkout-convencional.js** [Máscara CEP padronizada]
- **api/public/cliente/js/pagamento.js** [Máscara CEP no formulário de cartão]

Resumo: O campo CEP nos checkouts (pedagógico e convencional) e na página de pagamento agora formata automaticamente durante a digitação, exibindo o hífen no formato 00000-000.

### Versão anterior (2026-02-12) - feat: botão Atualizar na página geral, atualiza todas as listas
- **api/public/admin/listas.html** [Botão "Atualizar" na página geral, ao lado do filtro Status, tamanho btn-sm]
- **api/public/admin/js/listas.js** [Função atualizarPagamentosTodas: chama API que atualiza pagamentos de todas as excursões]
- **api/src/routes/lista-alunos.routes.ts** [Nova rota POST /atualizar-pagamentos-todas]

Resumo: O botão "Atualizar" agora fica na página geral de Listas de Alunos (ao lado do Status) e ao clicar atualiza os pagamentos de todas as excursões pedagógicas de uma vez, consultando o Asaas.

### Versão anterior (2026-02-12) - fix: botão Atualizar ao lado de Exportar Excel
- **api/public/cliente/js/checkout.js**, **api/public/cliente/js/pagamento.js**, **cliente/js/checkout.js** [Polling de status PIX alterado de 3-5s para 4 horas]
- **api/public/admin/js/listas.js** [Exibe "atualização a cada 4 horas" abaixo de "Aguardando Pagamento" na coluna Status Pedido]

Resumo: Verificação de pagamento: 1ª em 20 min após compra, depois a cada 4h. Botão "Atualizar" na Lista de Alunos permite forçar a verificação a qualquer momento.

### Versão anterior (2026-02-12) - fix: confirmação de pagamento na Lista de Alunos
- **api/src/routes/pagamento.routes.ts** [GET /status: sincroniza status com Asaas; quando pagamento confirmado na Asaas e pedido ainda aguardando, atualiza para PAGO]

Resumo: A Lista de Alunos (admin) não refletia o status "Pago" após pagamento PIX/cartão. O webhook pode falhar. Agora o polling do status consulta a Asaas e, ao detectar pagamento confirmado, atualiza o pedido para PAGO no banco, garantindo que a Lista de Alunos mostre corretamente.

### Versão anterior (2026-02-12) - fix: CPF do responsável no checkout pedagógico
- **api/src/routes/pagamento.routes.ts** [PIX e Cartão: excursão pedagógica usa dadosResponsavelFinanceiro (CPF do responsável) em vez de cpfAluno (CPF do aluno) ao enviar para Asaas]

Resumo: O checkout de excursões pedagógicas enviava o CPF do aluno para a Asaas. Ajustado para usar o CPF do responsável financeiro (dadosResponsavelFinanceiro no pedido). Excursão convencional mantém uso dos dados do passageiro.

### Versão anterior (2026-02-10) - Favicon Avoar nas telas de login
- **api/public/admin/login.html** [Adicionados link shortcut icon e icon apontando para ../images/favicon-avoar.png]
- **api/public/cliente/login.html** [Adicionados link shortcut icon e icon apontando para ../images/favicon-avoar.png]
- **cliente/login.html** [Adicionados link shortcut icon e icon apontando para ../api/public/images/favicon-avoar.png]

Resumo: As páginas de login do admin e do cliente passam a exibir o favicon oficial da Avoar (favicon-avoar.png) na aba do navegador, em vez do ícone genérico.

### Versão anterior (2026-02-11) - Fix: botão Nova Categoria (sintaxe em api/public/admin)
- **api/public/admin/js/categorias.js** [Corrigido SyntaxError na linha 77: aspas curvas Unicode no confirm() substituídas por aspas ASCII; listener do botão anexado antes de loadCategorias()]

Resumo: Botão "+ Nova categoria" não funcionava e não havia logs porque o script tinha erro de sintaxe (aspas "" ''). Alterações estão em api/public/admin/ (servidas em /admin).

### Versão anterior (2026-02-10) - Página de pagamento PIX/Cartão no checkout convencional
- **api/public/cliente/pagamento.html** [Nova página de pagamento com opções PIX (QR Code) e Cartão de Crédito; resumo do pedido; tela de sucesso]
- **api/public/cliente/js/pagamento.js** [Lógica completa: gerar PIX, polling de status, formulário de cartão com máscaras, pré-preenchimento de dados do cliente]
- **api/public/cliente/js/checkout-convencional.js** [Redirecionamento pós-pedido: agora vai para pagamento.html?pedidoId={id} em vez de pedidos.html]
- **api/public/cliente/pedidos.html** [Botão "Pagar" em pedidos pendentes; novos estilos de status; labels traduzidos]

Resumo: O fluxo de compra convencional agora inclui a etapa de pagamento. Após preencher dados dos passageiros, o cliente é redirecionado para página de pagamento onde escolhe PIX (QR Code com copia-e-cola e verificação automática) ou Cartão de Crédito. Após confirmação, pedido aparece em "Meus Pedidos" com status atualizado. Pedidos pendentes têm botão "Pagar" para retornar ao pagamento.

### Versão anterior (2026-02-10) - Fix: título admin e debug categorias
- **api/public/admin/*.html** [Corrigido título de "Avorar Admin" para "Avoar Admin" em todas as páginas do painel administrativo]
- **api/public/admin/js/categorias.js** [Adicionados logs de debug detalhados para diagnosticar problema do botão Nova Categoria; validação de elementos DOM]

Resumo: Título do admin corrigido de "Avorar" para "Avoar". Logs de debug adicionados em categorias.js para identificar se botão e modal existem e se event listeners são anexados corretamente.

### Versão anterior (2026-02-10) - Fix: checkout convencional não carregava formulário
- **api/public/cliente/js/checkout-convencional.js** [Corrigida inicialização: requireAuth agora é async/await em vez de callback; authFetch substituído por clienteAuth.fetchAuth; logs adicionais para debug]

Resumo: Página de checkout convencional não carregava formulário nem preço. requireAuth era chamado com callback mas retorna Promise. authFetch não existia, substituído por clienteAuth.fetchAuth. Logs de debug adicionados para rastrear carregamento.

### Versão anterior (2026-02-10) - Fix: botão Nova Categoria e dependência exceljs
- **api/public/admin/js/categorias.js** [showCategoriaToast corrigida: chamava recursivamente showCategoriaToast em vez de showToast]
- **api/package.json** [Instalada dependência exceljs para exportação de listas de alunos em Excel]

Resumo: Botão "+ Nova categoria" não abria o modal porque showCategoriaToast tinha erro recursivo. Dependência exceljs instalada para o sistema de listas funcionar corretamente.

### Versão anterior (2026-02-10) - CSP: iframe Heyzine e script em Nossos Roteiros
- **api/src/server.ts** [CSP do Helmet: frame-src permite https://heyzine.com para o iframe da página Nossos Roteiros]
- **api/public/nossos-roteiros.html** [Script inline removido; carregamento de js/nossos-roteiros.js]
- **api/public/js/nossos-roteiros.js** [Novo: submit do formulário (WhatsApp) externalizado para compatibilidade com CSP]
- **api/public/js/custom-script.js** [Scrollbar: wheelEventTarget substituído por delegateTo]

Resumo: O frame do Heyzine em /nossos-roteiros não carregava por bloqueio da CSP (frame-src). Foi permitido frame-src para https://heyzine.com. O script inline do formulário foi externalizado em nossos-roteiros.js. Aviso de depreciação do smooth-scrollbar corrigido.

### Versão anterior (2026-02-10) - Nossos Roteiros: página com embed e formulário
- **api/public/nossos-roteiros.html** [Nova página: 1ª seção com iframe do flipbook Heyzine (6c8ed3a45c); 2ª seção com texto "Quer saber mais sobre nossos roteiros, preencha o formulário" e formulário (nome, e-mail, telefone, mensagem) que ao enviar abre WhatsApp]
- **api/src/server.ts** [Rota /nossos-roteiros registrada]
- **api/public/** [Todos os links do menu "Nossos Roteiros" passam a apontar para /nossos-roteiros em vez do link externo Heyzine]

Resumo: O item de menu "Nossos Roteiros" agora abre uma página do site. A página tem o embed do flipbook na primeira seção e, na segunda, o texto solicitado e um formulário para solicitar informações; o envio redireciona para o WhatsApp.

### Versão anterior (2026-02-10) - Cliente: página Início com dois frames
- **cliente/inicio.html**, **cliente/js/inicio.js** [Nova página Início: primeira tela após login com dois cards – Turismo Pedagógico e Pacotes de Viagens; cada card com "!" explicativo]
- **cliente/js/login.js**, **dashboard.html**, **pedidos.html**, **configuracoes.html**, **api/public/cliente/** [Links e redirecionamento para inicio.html]

Resumo: O cliente passa primeiro pela página "Início", com dois frames (Turismo Pedagógico e Pacotes de Viagens), antes do dashboard.

### Versão anterior (2026-02-10) - Página inicial: novos backgrounds das seções 1, 3, 4 e 5
- **api/public/index-10.html** [background-image das seções 1, 3, 4 e 5 trocados para imagens da pasta FOTOS AVOAR PREFERIDAS: seção 1 (Alexandre Nery Bernoulli), 3 (IMG_1011), 4 (DSC00349 – portal Grande Sertão), 5 (Utilizar essa daqui – caverna)]

Resumo: Na página inicial (index-10), as seções 1, 3, 4 e 5 passaram a usar imagens da pasta "FOTOS AVOAR PREFERIDAS". A seção 2 não foi alterada.

### Versão anterior (2026-02-10) - Histórico do cliente com pedidos convencionais
- **api/src/routes/pedido.routes.ts** [Listagem GET /api/cliente/pedidos inclui excursao para pedidos convencionais]
- **api/public/cliente/pedidos.html**, **cliente/pedidos.html** [Exibição de título por tipo (pedagógica/convencional); rótulo "Excursão pedagógica" / "Viagem convencional"]

Resumo: Na tela "Meus Pedidos" do painel do cliente, passam a aparecer também as compras convencionais (viagens do fluxo "Comprar Agora"). A API inclui a relação excursao na listagem; o frontend mostra o título da viagem e um rótulo indicando o tipo do pedido.

### Versão anterior (2026-02-10) - Login com Google no painel do cliente
- **api/public/cliente/login.html**, **cliente/login.html** [Botão "Continuar com Google" tornado visível; seção .google-login-section exibida]
- **api/.env.example** [Exemplo de GOOGLE_CLIENT_ID e comentário de GOOGLE_REDIRECT_URI para produção]

Resumo: Login com Google no painel do cliente ativado na interface. Configurar GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REDIRECT_URI no ambiente; no Google Cloud Console, registrar a URI de redirecionamento (ex.: .../api/cliente/auth/google/callback).

### Versão anterior (2026-02-10) - Checkout convencional: novo fluxo de compra para viagens
- **api/prisma/schema.prisma**, **api/prisma/migration-add-tipo-pedido.sql** [Campo tipo adicionado ao modelo Pedido; enum PedidoTipo (PEDAGOGICA | CONVENCIONAL); migration SQL para Railway]
- **api/src/schemas/pedido.schema.ts** [Novos schemas: dadosPassageiroSchema e createPedidoConvencionalSchema para validação de pedidos convencionais sem dados de aluno]
- **api/src/routes/pedido.routes.ts** [Nova rota POST /api/cliente/pedidos/convencional: cria pedidos tipo CONVENCIONAL com dados de passageiros]
- **api/public/portfolio-single.html**, **api/public/js/portfolio-single.js** [Botão WhatsApp renomeado para "Saiba mais pelo WhatsApp"; novo botão "Comprar Agora" redireciona para checkout convencional com slug e quantidade]
- **api/public/cliente/checkout-convencional.html**, **api/public/cliente/js/checkout-convencional.js** [Nova página de checkout: formulário dinâmico gerando campos de dados pessoais por passageiro (Nome, Sobrenome, CPF, País, CEP, Endereço, Cidade, Estado, Telefone, Email); máscaras, validação, envio via API]

Resumo: Implementado fluxo completo de compra para viagens convencionais. Na página do pacote, botão "Comprar Agora" redireciona para checkout-convencional.html. O cliente preenche apenas dados pessoais de cada passageiro (sem informações escolares/médicas). Pedido criado via rota /api/cliente/pedidos/convencional com tipo CONVENCIONAL. Campo tipo diferencia pedidos pedagógicos (PEDAGOGICA) de convencionais na mesma tabela Pedido.

### Versão anterior (2026-02-10) - Menu: item "Nossos Roteiros"
- **api/public/index-10.html**, **api/public/index-11.html**, **api/public/blog.html**, **api/public/blog-single.html**, **api/public/contact.html**, **api/public/about.html**, **api/public/portfolio.html**, **api/public/portfolio-single.html**, **api/public/includes/footer.html** [Adicionado item "Nossos Roteiros" após "Viagens" em todos os menus e rodapés; link para flipbook Heyzine em nova aba]

Resumo: Novo item "Nossos Roteiros" no menu (e rodapé) de todas as páginas públicas, apontando para o flipbook em https://heyzine.com/flip-book/00c4b77d8b.html#page/1, abrindo em nova aba. Na home, também incluído na barra de ícones da primeira seção.

### Versão anterior (2026-02-10) - Navegação: Excursões para Viagens
- **api/public/...** [Todos os itens de menu e links rápidos que apontam para `/excursoes` passaram a exibir "Viagens"; URLs permanecem as mesmas]

Resumo: A navegação pública passou a usar o rótulo "Viagens" em vez de "Excursões" em menus e rodapés que apontam para `/excursoes`.

### Versão anterior (2026-02-10) - Fix: validação de telefone removendo formatação
- **api/public/cliente/js/checkout.js** [Removido `onlyDigits()` do telefone do responsável financeiro na coleta de dados; o telefone agora é enviado com formatação original]

Resumo: O telefone do responsável financeiro estava sendo removido de formatação antes do envio, causando erro de validação mesmo com formato correto no input. Agora a formatação original é preservada e a validação passa corretamente.

### Versão anterior (2026-02-10) - Campos médicos do aluno opcionais no checkout
- **api/public/cliente/js/checkout.js**, **cliente/js/checkout.js** [Removidos `required` e asterisco dos campos Plano de saúde do aluno, Medicamentos em caso de febre/dor e Medicamentos em caso de alergia; os três passam a ser opcionais no formulário de dados do aluno]

Resumo: No checkout, os três campos médicos do aluno (plano de saúde, medicamentos febre/dor, medicamentos alergia) deixaram de ser obrigatórios. Apenas a validação HTML e a indicação visual de obrigatório foram removidas; o backend já aceitava valores vazios.

### Versão anterior (2026-02-08) - Sistema de Listas de Alunos por Excursão Pedagógica
- **api/src/routes/lista-alunos.routes.ts** [Novas rotas admin: GET /excursoes (lista excursões com contagem de alunos), GET /excursao/:id/alunos (lista alunos de uma excursão), GET /excursao/:id/exportar (gera Excel); estatísticas por status de pedido; filtros por status]
- **api/public/admin/listas.html** [Nova página com duas views: lista de excursões pedagógicas com stats e lista detalhada de alunos; filtros por status; botão exportar Excel; design responsivo com cards]
- **api/public/admin/js/listas.js** [Gerenciamento completo: carrega excursões com contagem, exibe alunos com filtros, exporta Excel com download automático; estados de loading e empty state]
- **api/src/server.ts** [Registrada rota /api/admin/listas para sistema de listas]
- **api/public/admin/*.html** [Adicionado link "Listas de Alunos" no menu lateral de todas as páginas admin]
- **api/package.json** [Instalada dependência exceljs para geração de arquivos Excel]

Resumo: Nova funcionalidade para o admin gerenciar listas de alunos matriculados por excursão pedagógica. Sistema carrega automaticamente alunos conforme pedidos são criados. Interface mostra estatísticas (total de alunos, pedidos, status), permite filtrar por status do pedido e exportar lista completa em Excel (.xlsx) seguindo formato especificado (colunas: Nome, Turma, Série, CPF, Telefone, Celular). Cada excursão tem sua lista isolada e específica. Telefone responsável mapeado para coluna Celular no Excel.

### Versão anterior (2026-02-08) - Redesign das páginas do cliente (dashboard, pedidos, configurações)
- **cliente/dashboard.html** [Redesign completo com navbar moderna, gradiente no fundo, animações suaves, busca em card com estilo premium, cores alinhadas ao site (#ff5c00 laranja e #101010 preto)]
- **cliente/pedidos.html** [Nova estrutura com navbar melhorada, cards de pedidos com estilos avançados, status badges modernizadas, empty state para sem pedidos, animações de entrada]
- **cliente/configuracoes.html** [Redesign com navbar consistente, formulário em card com border-top laranja, mensagens de sucesso com animação, labels com ícones, campos com efeito focus suave]

Resumo: As 3 páginas do cliente (dashboard, pedidos, configurações) foram completamente redesenhadas para estar alinhadas visualmente ao site principal (Avorar Turismo). Implementado novo design com: paleta de cores do site (#ff5c00 laranja, #101010 preto), gradientes modernos, sombras elevation, animações suaves (slideUp/slideDown), responsividade melhorada, navbar com estilo consistente, cards com hover effects, tipografia Montserrat, e UX aprimorada com indicadores visuais e mensagens claras.

### Versão anterior (2026-02-06) - Correção dos botões de ação no admin do blog
- **api/public/admin/js/blog.js** [Removidos atributos onclick inline dos botões de editar/visualizar/deletar; adicionada função attachButtonListeners() que registra event listeners via addEventListener; botões agora usam classes CSS (.btn-edit-post, .btn-view-post, .btn-delete-post) e data attributes (data-id, data-slug, data-titulo) para identificação]

Resumo: Os botões de editar, visualizar e deletar posts na tabela do painel administrativo não funcionavam porque usavam onclick inline, bloqueado pelo CSP (Content Security Policy). A solução foi remover os onclick e adicionar event listeners via JavaScript externo. Agora os botões funcionam corretamente: editar abre o editor, visualizar abre o post em nova aba, e deletar solicita confirmação antes de excluir.


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
