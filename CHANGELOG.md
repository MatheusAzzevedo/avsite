# Changelog

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

## 2026-02-06 - Grid de excursões pedagógicas no admin

### Arquivos Modificados
- `api/public/admin/css/admin-style.css` [Seção de grid de excursões atualizada para usar `display: grid` com `repeat(auto-fill, minmax(260px, 1fr))` em `.excursoes-pedagogicas-grid` e contêineres relacionados, permitindo que os cards de excursões pedagógicas sejam exibidos lado a lado em múltiplas colunas (desktop) e empilhados apenas em telas menores]

### Alterações
- A listagem de "Excursões Pedagógicas Cadastradas" do painel admin deixou de exibir os cards em uma única coluna fixa. O container `#excursoesGrid.excursoes-pedagogicas-grid` passou a usar um grid responsivo que distribui os cards em 2–3 colunas conforme a largura disponível, mantendo os cards com altura estendida (`height: 100%`) para um layout organizado e alinhado, e voltando para uma coluna apenas em mobile.

---

## 2026-02-06 - Logout consistente no painel admin

### Arquivos Modificados
- `api/public/admin/js/admin-main.js` [Adicionada conexão automática do link com id `navLogout` ao fluxo de `logout()`, garantindo que o clique em "Sair" no menu lateral deslogue o usuário e redirecione para a tela de login do admin em qualquer página do painel]

### Alterações
- O botão "Sair" do menu lateral do painel administrativo passou a usar um listener centralizado em `admin-main.js` para chamar `logout()`. Isso garante que, sempre que o elemento com id `navLogout` existir, o usuário será deslogado (tokens e flags limpos) e enviado para `login.html` do admin, mantendo o comportamento consistente entre todas as telas do painel.

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
