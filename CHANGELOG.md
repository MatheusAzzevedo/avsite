# Changelog

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

## 2026-02-06 - Tipografia unificada e ajustes na página inicial

### Arquivos Modificados
- `css/style.css`, `api/public/css/style.css` [Uso exclusivo das famílias Cairo e Montserrat via Google Fonts; remoção de @font-face personalizados (Gotham, Monument, Telegraf, Khula); padronização da tipografia global do site]
- `css/about-page.css`, `api/public/css/about-page.css` [Títulos e destaques migrados para Cairo/Montserrat; remoção de variações Gotham/Monument/Telegraf e fontes serifadas pontuais]
- `css/footer.css`, `api/public/css/footer.css` [Footer modernizado usando Cairo como base e Montserrat em títulos de seção]
- `css/avoar-custom.css`, `api/public/css/avoar-custom.css`, `css/consultant-form.css`, `api/public/css/consultant-form.css` [Ajustes de tipografia em labels, botões e títulos utilitários para Cairo/Montserrat]
- `css/avoar-sections-page.css`, `api/public/css/avoar-sections-page.css` [Hero da página inicial com tipografia padronizada, ícones de navegação com espaçamento ajustado e alinhamento vertical refinado do título, botão e texto]
- `api/public/admin/css/admin-style.css` [Admin atualizado para usar Cairo como fonte principal, mantendo consistência visual com o site público]

### Alterações
- O site passou a utilizar apenas as famílias Cairo (base) e Montserrat (destaques), removendo fontes personalizadas anteriores e garantindo consistência visual entre todas as páginas públicas e o painel administrativo. A hero da página inicial foi refinada: título, botão de Pagamento/Login e texto foram reposicionados para melhor equilíbrio vertical, e os ícones de navegação ganharam espaçamento horizontal e vertical ajustados para leitura e clique mais confortáveis.

---

## 2026-02-04 - Reconciliação de pagamento PIX/cartão quando Asaas retorna erro

### Arquivos Modificados
- `api/src/config/asaas.ts` [Nova função listarPagamentosPorReferencia(externalReference) para consultar pagamentos na Asaas por id do pedido; erros de criação PIX/cartão repassados para as rotas em vez de lançar exceção]
- `api/src/routes/pagamento.routes.ts` [POST /pix e POST /cartao: em caso de erro da Asaas ao criar cobrança, consulta listarPagamentosPorReferencia(pedidoId); se existir pagamento confirmado/recebido, atualiza pedido para PAGO e retorna 200; senão retorna 400 com mensagem Asaas, evitando 500 quando a cobrança de fato ocorreu]
- `api/public/admin/config-pagamento.html` [Ajustes de exibição do status e teste de conexão Asaas]

### Alterações
- Cobrança aprovada no cartão ou PIX mas resposta da Asaas com erro (ex.: "Transação não autorizada") deixava de atualizar o pedido e retornava 500. Agora, após erro na criação, a API consulta pagamentos pela referência do pedido na Asaas; se houver pagamento confirmado, o pedido é marcado como PAGO e o cliente recebe 200, alinhando estado do sistema ao que realmente foi pago.

---

## 2026-02-04 - Checkout: etapa de pagamento Asaas (PIX e Cartão)

### Arquivos Modificados
- `cliente/checkout.html` [Seção checkoutStepPagamento com opções PIX e Cartão de crédito; pixBox com QR Code e botão Copiar; cartaoBox com formulário completo (cartão + titular)]
- `cliente/js/checkout.js` [mostrarEtapaPagamento: listeners únicos (pagamentoListenersAdded), PIX selecionado por padrão e gerarPix() ao exibir; gerarPix (POST /cliente/pagamento/pix), iniciarPollStatus (GET status a cada 3s), pagarComCartao (POST /cliente/pagamento/cartao)]
- `api/public/cliente/checkout.html`, `api/public/cliente/js/checkout.js` [Cópias para paridade com a API]

### Alterações
- Após criar o pedido, o checkout exibe a etapa de pagamento com valor total, opção PIX (QR Code + copiar código) e opção Cartão de crédito (formulário com número, validade, CVV e dados do titular). Listeners são registrados uma única vez; PIX é exibido por padrão e o polling verifica o status até PAGO/CONFIRMADO. Cartão envia dados para a API que processa via Asaas.

---

**Mantidas apenas as últimas 5 versões conforme regra do projeto**
