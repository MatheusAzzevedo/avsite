# Changelog

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
