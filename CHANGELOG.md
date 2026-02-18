# Changelog

## 2026-02-18 - feat: imagem Quem Confia maior no desktop e clique para tela cheia

### Arquivos Modificados
- `api/public/about.html` [partners-showcase clicável com id e aria-label; overlay fullscreen; script para abrir/fechar]
- `api/public/css/about-page.css` [max-width 1200px no desktop; cursor pointer; hint "Clique para ampliar"; estilos do overlay fullscreen]
- `about.html` [Mesmas alterações HTML e script]
- `css/about-page.css` [Mesmas alterações CSS]

### Alterações
- Na seção "Quem confia" da página Sobre Nós, a imagem dos parceiros (grid de logos) passou a exibir maior no desktop (max-width 1200px em vez de 900px). Ao clicar na imagem, abre um overlay em tela cheia com fundo escuro. Clique no overlay ou tecla ESC fecha. Hint "Clique para ampliar" visível no desktop; em mobile o hint é ocultado. Acessibilidade: role="button", tabindex="0" e suporte a Enter/Espaço.

---

## 2026-02-18 - feat: polling agressivo de pagamento PIX (imediato → 1min → 3min → 5min → 4h)

### Arquivos Modificados
- `api/public/cliente/js/pagamento.js` [startPixPolling: verificação imediata + 1min + 3min + 5min + 4h; stopPolling limpa todos os timeouts pendentes]
- `api/public/cliente/js/checkout.js` [iniciarPollStatus: mesma sequência imediata + 1min + 3min + 5min + 4h para checkout pedagógico]

### Alterações
- O polling de status de pagamento PIX verificava pela primeira vez apenas após 3 minutos, fazendo com que o e-mail de confirmação demorasse. Agora a verificação é feita imediatamente após a compra, depois em 1 min, 3 min e 5 min, e só então a cada 4 horas. Quando a verificação detecta pagamento confirmado no Asaas, o backend atualiza o pedido e dispara o e-mail de confirmação. Isso garante que o cliente receba o e-mail na caixa de entrada o mais rápido possível.

---

## 2026-02-18 - feat: responsividade mobile no fluxo de compra de excursões convencionais

### Arquivos Modificados
- `api/public/cliente/login.html` [Media queries para 480px e 360px: padding, logo, botões touch-friendly (min 48px)]
- `api/public/cliente/registro.html` [Media queries para 480px e 360px: tipografia, inputs, botões e logo adaptados]
- `api/public/cliente/pacotes-viagens.html` [Menu hamburger com sidebar lateral; grid 2 colunas em tablet, 1 em mobile; filtros compactos]
- `api/public/cliente/excursao.html` [Título, galeria, thumbnails, purchase card e meta adaptados; breakpoints 768px e 480px]
- `api/public/cliente/checkout-convencional.html` [Menu hamburger com sidebar; form-grid 1 coluna; resumo do pedido no topo em mobile]
- `api/public/cliente/pagamento.html` [Menu hamburger com sidebar; tabs flexíveis; QR Code reduzido; formulário 1 coluna]

### Alterações
- Todas as telas do fluxo de compra do "Pacote de Viagens" (login, registro, listagem de pacotes, detalhe da excursão, checkout convencional e pagamento) foram revisadas para responsividade mobile. Navbars das páginas internas ganharam menu hamburger com sidebar deslizante (direita) com overlay e botões touch-friendly (min 44-48px). Formulários colapsam para 1 coluna. Grids e tipografia adaptados para telas de 768px, 480px e 360px.

---

## 2026-02-18 - feat: botão enviar e-mail manual na lista de alunos

### Arquivos Modificados
- `api/public/admin/listas.html` [Nova coluna "Ações" na tabela de alunos; th adicionado]
- `api/public/admin/js/listas.js` [Botão "Enviar E-mail" em cada linha; colspan da mensagem vazia alterado para 8; funções attachEmailButtonListeners e enviarEmailManual; showSuccess para toast de sucesso]
- `api/src/routes/pedido.routes.ts` [Nova rota POST /api/admin/pedidos/:id/enviar-email com auth admin; reseta emailConfirmacaoEnviado antes de enviar; chama enviarEmailConfirmacaoPedido; registra log de atividade; import de enviarEmailConfirmacaoPedido]
- `api/src/server.ts` [Rota /api/admin/pedidos registrada para reuso do router de pedidos]

### Alterações
- Na Lista de Alunos, cada linha da tabela agora exibe um botão "Enviar E-mail" na nova coluna "Ações". Ao clicar, o administrador pode enviar manualmente o e-mail de confirmação de inscrição para aquele pedido específico, usando o mesmo template que é enviado automaticamente após pagamento confirmado. O botão solicita confirmação antes de enviar. Útil para reenviar e-mails ou enviar após criar/atualizar pedido manualmente. A API reseta o lock de envio (emailConfirmacaoEnviado) para permitir reenvio e registra a ação no log do sistema.

---

## 2026-02-18 - feat: e-mail confirmação — redes sociais com ícones e logo ajustada

### Arquivos Modificados
- `api/src/templates/email-confirmacao-pedido.ts` [Links redes sociais: Facebook, Instagram, LinkedIn (URLs do site); ícones como img PNG (Icons8); logo usa Logo avorar.webp]
- `api/public/images/LOGO-EMAIL-README.md` [Novo: instruções para substituir logo por versão HD]

### Alterações
- Abaixo de "Estamos ansiosos para tê-lo conosco em breve!": ícones de Facebook, Instagram e LinkedIn agora aparecem como imagens PNG (28x28px) com links corretos do site. Logo alterada para Logo avorar.webp (250x100). Para logo em alta definição, substitua o arquivo conforme LOGO-EMAIL-README.md.

---

## 2026-02-18 - fix: CSP dashboard — scripts e handlers externalizados

### Arquivos Modificados
- `api/public/admin/dashboard.html` [Removidos script inline e onclick; link Sair com id navLogout; carregamento de js/dashboard.js]
- `api/public/admin/js/dashboard.js` [Novo: loadDashboard, loadStats, loadTopExcursoes, enviarEmailTeste, mostrarMsgTesteEmail, initDashboard; listener no btnTesteEmail]

### Alterações
- O dashboard administrativo gerava erros de CSP ao clicar no botão "Testar E-mail Confirmação" e no link "Sair". Script inline e handlers onclick foram externalizados para dashboard.js. O botão e o link passam a usar addEventListener, compatível com script-src 'self' e script-src-attr 'none'.

---

## 2026-02-18 - feat: card de depoimento clicável leva às avaliações Google

### Arquivos Modificados
- `api/public/js/testimonials.js` [testimonial-item passa a ser <a> com href para avaliações Google; target _blank; rel noopener]
- `api/public/css/testimonials.css` [testimonial-item: text-decoration none, cursor pointer; hover sutil no active]
- `js/testimonials.js`, `css/testimonials.css` [Mesmas alterações na raiz do projeto]

### Alterações
- Ao clicar na caixa do comentário (card de depoimento) na seção "Experiências Reais" da página Sobre Nós, o usuário é redirecionado para as avaliações do Google da Avoar Turismo. Link abre em nova aba. Hover sutil indica que o card é clicável.

---

## 2026-02-18 - feat: botão Voltar à página inicial no login e registro

### Arquivos Modificados
- `api/public/cliente/login.html` [Botão "Voltar à página inicial" com ícone seta; estilo btn-voltar; link para /]
- `api/public/cliente/registro.html` [Botão "Voltar à página inicial" com ícone seta; estilo btn-voltar; link para /]

### Alterações
- Login e criar conta passaram a exibir um botão destacado "Voltar à página inicial" (com ícone fa-arrow-left) que redireciona para a página inicial do site (/). O botão tem estilo semitransparente com borda branca para boa visibilidade sobre o fundo.

---

## 2026-02-18 - feat: página de registro com background mosaico e logo Avoar

### Arquivos Modificados
- `api/public/cliente/registro.html` [Background mosaico igual ao login: 20 imagens em grid 4x5; overlay gradiente laranja; Logo Branca.png no lugar do ícone do avião; favicon; título corrigido Avoar]

### Alterações
- A página de criar conta passou a usar o mesmo mosaico de fundo da página de login (20 imagens FOTOS AVOAR + Imagens para o site, grid 4x5, overlay com cores Avoar). O ícone do avião foi substituído pela logo oficial (Logo Branca.png). Favicon e título corrigidos.

---

## 2026-02-18 - fix: e-mail de confirmação garantido em todos os caminhos de pagamento + proteção contra duplicação

### Arquivos Modificados
- `api/src/config/email.ts` [Substituído SMTP por API Brevo (HTTPS); BREVO_API_KEY, BREVO_FROM_NAME, BREVO_FROM_EMAIL; health check via GET /account]
- `api/src/utils/email-service.ts` [Envio via API Brevo em vez de Nodemailer]
- `api/.env.example` [SMTP removido; BREVO_API_KEY, BREVO_FROM_NAME, BREVO_FROM_EMAIL]
- `api/RAILWAY-VARIABLES.md` [Seção 6: variáveis Brevo para plano Hobby]
- `api/prisma/schema.prisma` [Campo emailConfirmacaoEnviado (Boolean, default false) no model Pedido para lock atômico]
- `api/src/utils/enviar-email-confirmacao.ts` [Lock atômico via updateMany (emailConfirmacaoEnviado); reversão do lock em caso de falha SMTP ou erro inesperado; etapas renumeradas 1-6]
- `api/src/routes/pagamento.routes.ts` [Cartão: disparo de e-mail quando aprovação é instantânea; Reconciliação PIX/Cartão: disparo de e-mail nas reconciliações]
- `api/src/routes/admin-email.routes.ts` [Novo: rota POST /api/admin/email/teste-confirmacao para teste de envio]
- `api/src/server.ts` [Registro da rota /api/admin/email]
- `api/public/admin/dashboard.html` [Botão "Testar E-mail Confirmação" em Ações Rápidas]

### Alterações
- E-mail migrado de SMTP para API Brevo (HTTPS). Compatível com Railway Hobby (SMTP bloqueado). Variáveis: BREVO_API_KEY, BREVO_FROM_NAME, BREVO_FROM_EMAIL. Health check via GET /account. E-mail de confirmação em todos os caminhos de pagamento. Proteção contra duplicação via lock atômico. Botão de teste no admin.

---

## 2026-02-16 - feat: telefone obrigatório e máscara automática no registro

### Arquivos Modificados
- `api/public/cliente/registro.html` [Placeholder "Telefone (11) 98888-8888"; campo required; maxlength 16]
- `api/public/cliente/js/registro.js` [Funções formatPhoneBr e applyPhoneMask; validação telefone obrigatório; máscara aplicada no carregamento]
- `api/src/schemas/cliente-auth.schema.ts` [clienteRegisterSchema: telefone obrigatório; refine formato (XX) XXXXX-XXXX]

### Alterações
- Campo telefone na tela de criar conta deixou de ser opcional. Todos os campos (nome, email, telefone, senha) são obrigatórios. Máscara automática formata o número durante a digitação no padrão (11) 98888-8888. Validação no frontend e backend (Zod) exige DDD + 8 ou 9 dígitos.

---

## 2026-02-14 - fix: menu hamburger bloqueado por CSP - script inline externalizado

### Arquivos Modificados
- `api/public/cliente/inicio.html` [Removido script inline do menu mobile]
- `api/public/cliente/js/inicio.js` [initMobileMenu externalizado para compatibilidade com CSP]

### Alterações
- O botão hamburger do menu lateral não funcionava em produção porque o CSP (Content-Security-Policy) bloqueava o script inline. A lógica do menu foi movida para inicio.js, permitindo que o menu abra corretamente no mobile.

---

## 2026-02-14 - feat: mosaico login com 20 imagens sem repetição

### Arquivos Modificados
- `api/public/cliente/login.html` [Mosaico: 20 imagens (FOTOS AVOAR PREFERIDAS + Imagens para o site); grid 4x5; ordem aleatória; sem repetição]

### Alterações
- Mosaico da página de login do cliente atualizado com 20 imagens distintas em ordem aleatória. Grid 4x5 no desktop, 2x10 no mobile.

---

## 2026-02-14 - fix: botão X do menu lateral acima do logo e menor

### Arquivos Modificados
- `api/public/css/style.css` [nav-closer: posição top 12px e centralizado; tamanho 28x28px; img com object-fit contain]

### Alterações
- Botão X de fechar o menu lateral do site passou a ficar acima do logotipo, centralizado e com tamanho reduzido (28px em vez de 46px).

---

## 2026-02-14 - fix: menu hamburger mobile não abria ao toque

### Arquivos Modificados
- `api/public/cliente/inicio.html` [Sidebar: pointer-events none quando fechado; btn-hamburger: z-index 1001, display flex no mobile; touchend com preventDefault]

### Alterações
- Menu hamburger no mobile passou a abrir corretamente ao toque. Sidebar fechada não captura mais eventos (pointer-events: none). Botão com z-index elevado e área de toque adequada.

---

## 2026-02-14 - feat: logo para página inicial do site e header completo no checkout

### Arquivos Modificados
- `api/public/cliente/inicio.html` [Logo navbar e sidebar: href alterado de inicio.html para ../index-10.html (página inicial do site)]
- `api/public/cliente/pacotes-viagens.html`, `dashboard.html`, `excursao.html`, `configuracoes.html`, `pedidos.html` [Logo: href para ../index-10.html]
- `api/public/cliente/checkout.html`, `checkout-convencional.html`, `pagamento.html` [Header completo: Início, Pacotes de Viagens, Meus Pedidos, Configurações, Sair; logo para ../index-10.html; estilos navbar-menu e btn-logout]

### Alterações
- Logotipo Avoar em todas as páginas do cliente passa a redirecionar para a página inicial do site (index-10.html). Checkout e pagamento passam a exibir o menu completo do cliente (Início, Pacotes, Meus Pedidos, Configurações, Sair) em todas as etapas.

---

## 2026-02-14 - feat: logar erros da API Asaas no catch de criar cobrança

### Arquivos Modificados
- `api/src/config/asaas.ts` [No catch de criarCobrancaAsaas: loga response.data.errors da API Asaas para diagnóstico de 400]

### Alterações
- Quando a API Asaas retorna 400, o log agora inclui o array de erros retornado pela API, permitindo identificar a causa exata (ex.: CPF inválido, valor mínimo).

---

## 2026-02-14 - fix: checkout pedagógico — PROIBIDO enviar dados do aluno à Asaas

### Arquivos Modificados
- `api/src/routes/pagamento.routes.ts` [PIX e Cartão: excursão pedagógica usa EXCLUSIVAMENTE dadosResponsavelFinanceiro; nunca primeiroItem (cpfAluno, nomeAluno); PIX falha 400 se dadosResp incompleto; Cartão: holderName e creditCardHolderInfo do responsável; ignora formulário]
- `api/public/cliente/js/checkout.js`, `cliente/js/checkout.js` [Pré-preenche campos do titular do cartão com dados do responsável]
- `api/public/cliente/checkout.html`, `cliente/checkout.html` [Aviso: dados do titular devem ser do responsável financeiro]

### Alterações
- Excursão pedagógica: em nenhuma hipótese dados do aluno (nomeAluno, cpfAluno, etc.) são enviados à Asaas. PIX e cartão usam apenas dadosResponsavelFinanceiro. Se CPF do responsável ausente, retorna 400. Cartão: holderName (nome no cartão) e creditCardHolderInfo vêm do responsável; formulário ignorado.

---

## 2026-02-13 - feat: mosaico login no padrão do exemplo, Logo Branca e cores Avoar

### Arquivos Modificados
- `api/public/cliente/login.html` [Mosaico reorganizado com grid 4x3 inspirado em login-mosaico; imagens de FOTOS AVOAR PREFERIDAS; overlay com gradiente laranja; Logo Branca.png]

### Alterações
- Mosaico de fundo do login segue a estrutura do exemplo api/login-mosaico: grid uniforme 4x3 (12 células), gap 4px. Imagens da pasta FOTOS AVOAR PREFERIDAS. Overlay com cores Avoar (gradiente laranja). Logo substituída por Logo Branca.png.

---

## 2026-02-13 - feat: menu hamburger mobile, centralização e remoção de link secundário

### Arquivos Modificados
- `api/public/cliente/inicio.html` [Menu hamburger no mobile; sidebar lateral deslizante; centralização do card Buscar Excursão; removido "Ou confira os Pacotes de Viagens"]
- `api/public/cliente/js/inicio.js` [Logout em ambos os botões (navbar e sidebar)]

### Alterações
- Na versão mobile do cliente: menu vira ícone hamburger; ao clicar, sidebar desliza da esquerda com overlay; card de código fica centralizado na tela; removido o link "Ou confira os Pacotes de Viagens".

---

## 2026-02-13 - feat: página inicial do cliente com campo de código da excursão

### Arquivos Modificados
- `api/public/cliente/inicio.html` [Substituídos dois cards por campo de busca de código; página inicial passa a ser onde o cliente digita o código da excursão pedagógica]
- `api/public/cliente/js/inicio.js` [Adicionada lógica de submit do formulário de busca por código; redireciona para excursao.html quando encontrado]
- `api/public/cliente/excursao.html` [Links de "Voltar" e "Busca" alterados de dashboard.html para inicio.html]
- `api/public/cliente/dashboard.html` [Meta refresh redireciona para inicio.html; mantido para compatibilidade]

### Alterações
- A página inicial do cliente (inicio.html) passa a exibir diretamente o campo para digitar o código da excursão pedagógica, em vez dos dois cards (Turismo Pedagógico e Pacotes de Viagens). Dashboard redireciona para inicio.

---

## 2026-02-13 - feat: dashboard admin — bignumbers, ações rápidas, excursões ativas

### Arquivos Modificados
- `api/src/routes/dashboard.routes.ts` [Novo: GET /api/admin/dashboard/stats (pedagogicosAtivos, convencionaisAtivos, reservas) e GET /api/admin/dashboard/excursoes-ativas (2 últimas excursões ativas)]
- `api/src/server.ts` [Registro da rota /api/admin/dashboard]
- `api/public/js/api-client.js` [DashboardStats.getStats() e getExcursoesAtivas() usam novos endpoints]
- `api/public/admin/dashboard.html` [Bignumbers: Pedagógicos Ativos, Convencionais Ativos, Reservas (removido Visitantes); Ações Rápidas: + Nova Excursão Pedagógica; Excursões Ativas: 2 últimas cadastradas]

### Alterações
- Bignumbers do dashboard passam a exibir: Pedagógicos Ativos (excursões pedagógicas ativas), Convencionais Ativos (excursões convencionais ativas), Reservas (número de alunos em pedidos PAGO/CONFIRMADO). Visitantes removido. Ações Rápidas ganhou botão "+ Nova Excursão Pedagógica". Seção Excursões Ativas exibe as 2 últimas excursões cadastradas (pedagógicas + convencionais) com status ativo, ordenadas por data de criação.

---

## 2026-02-13 - feat: e-mail de confirmação de inscrição após pagamento + polling 3 min

### Arquivos Modificados
- `api/src/config/email.ts` [Novo: configuração SMTP Hostinger via Nodemailer; transporter, healthCheck, verificação de config]
- `api/src/utils/email-service.ts` [Novo: serviço genérico de envio de e-mail com logs detalhados]
- `api/src/templates/email-confirmacao-pedido.ts` [Novo: template HTML do e-mail de confirmação com detalhes do pedido, dados do estudante, endereço e rodapé]
- `api/src/utils/enviar-email-confirmacao.ts` [Novo: função que busca dados do pedido e dispara e-mail de confirmação; fire-and-forget]
- `api/src/routes/webhook.routes.ts` [Integrado envio de e-mail após pagamento confirmado via webhook Asaas]
- `api/src/routes/pagamento.routes.ts` [Integrado envio de e-mail após pagamento confirmado via polling de status]
- `api/src/server.ts` [Health check SMTP na inicialização do servidor]
- `api/.env.example` [Variáveis SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM_NAME, SMTP_FROM_EMAIL]
- `api/package.json` [Instalado nodemailer e @types/nodemailer]
- `api/public/cliente/js/pagamento.js` [Polling de 20 min para 3 min]
- `api/public/cliente/js/checkout.js` [Polling de 20 min para 3 min]
- `cliente/js/checkout.js` [Polling de 20 min para 3 min]
- `api/public/admin/js/listas.js` [Texto "1ª verificação em 3 min" atualizado]

### Alterações
- Após pagamento confirmado (via webhook Asaas ou polling de status), o sistema envia automaticamente um e-mail de "Confirmação de Inscrição" para o cliente. O e-mail inclui: logo, mensagem de sucesso, detalhes do pedido (produto, quantidade, preço), dados do estudante (nome, série, turma, alergias), endereço de cobrança e rodapé com redes sociais. SMTP configurado via Hostinger (smtp.hostinger.com, porta 465 SSL). Polling de verificação de pagamento reduzido de 20 minutos para 3 minutos.

---

## 2026-02-12 - feat: menu Dashboard → Pacotes de Viagens com grid e filtros

### Arquivos Modificados
- `api/public/cliente/pacotes-viagens.html` [Nova página: grid de pacotes com filtros por categoria, igual à página Pacote de Viagens do site; navbar cliente]
- `api/public/cliente/js/pacotes-viagens.js` [Carrega excursões da API, categorias para filtros, renderiza cards; requireAuth; links para ../portfolio-single.html]
- `api/public/cliente/inicio.html` [Menu: Dashboard → Pacotes de Viagens; card Pacotes aponta para pacotes-viagens.html]
- `api/public/cliente/dashboard.html` [Menu: Dashboard → Pacotes de Viagens]
- `api/public/cliente/pedidos.html` [Menu: Dashboard → Pacotes de Viagens; Início → inicio.html]
- `api/public/cliente/configuracoes.html` [Menu: Dashboard → Pacotes de Viagens; Início → inicio.html]
- `api/public/cliente/excursao.html` [Links ajustados; breadcrumb Busca]
- `api/public/cliente/js/login.js` [Redirect pós-login para inicio.html]
- `api/public/cliente/js/registro.js` [Redirect quando já autenticado para inicio.html]

### Alterações
- O item do menu "Dashboard" foi renomeado para "Pacotes de Viagens" e passou a exibir uma página com grid de pacotes (excursões convencionais) e filtros por categoria, no mesmo padrão da página "Pacote de Viagens" do site público. Nova página pacotes-viagens.html. Fluxo: Início (dois cards) → Pacotes de Viagens (grid) ou Turismo Pedagógico (busca por código). Login e registro redirecionam para inicio.html.

---

## 2026-02-12 - feat: redesign da página de login do cliente

### Arquivos Modificados
- `api/public/cliente/login.html` [Layout dois painéis: painel esquerdo com imagem IMG-20251119-WA0021.jpg e overlay escuro 60%; painel direito branco com formulário minimalista (Google, email, senha, entrar); cores Avoar; sem texto extra; responsivo]

### Alterações
- A página de login do cliente passa a seguir o padrão de layout dividido (imagem à esquerda, formulário à direita). A imagem da excursão com estudantes em frente à igreja é exibida no painel esquerdo com overlay escuro de 60% de opacidade. O painel direito contém apenas os campos de preenchimento (Email, Senha), botão "Continuar com Google", divisor "ou" e botão "Entrar", com links "Criar conta" e "Voltar". Paleta de cores da Avoar (laranja #EA580C, #C2410C, #FB923C) mantida.

---

## 2026-02-12 - feat: máscara automática CEP (00000-000) no checkout

### Arquivos Modificados
- `api/public/cliente/js/checkout.js` [Funções formatCepBr e applyCepMask; aplicadas em respCep e cardHolderCep do fluxo pedagógico]
- `api/public/cliente/js/checkout-convencional.js` [Máscara CEP ajustada para formatação consistente XXXXX-XXX durante digitação]
- `api/public/cliente/js/pagamento.js` [Máscara CEP padronizada no formulário de cartão]

### Alterações
- O campo CEP no checkout (pedagógico e convencional) e na página de pagamento passa a formatar automaticamente durante a digitação, exibindo o hífen no formato brasileiro 00000-000.

---

## 2026-02-12 - feat: botão Atualizar na página geral, atualiza todas as listas

### Arquivos Modificados
- `api/public/admin/listas.html` [Botão "Atualizar" movido para a página geral (lista de excursões), ao lado do filtro Status, com tamanho btn-sm]
- `api/public/admin/js/listas.js` [Função atualizarPagamentosTodas: chama API que atualiza pagamentos de todas as excursões pedagógicas]
- `api/src/routes/lista-alunos.routes.ts` [Nova rota POST /atualizar-pagamentos-todas: sincroniza status com Asaas para todos os pedidos de excursões pedagógicas]

### Alterações
- O botão "Atualizar" estava na view de alunos (ao abrir uma excursão específica) e atualizava apenas aquela lista. Agora fica na página geral de Listas de Alunos, ao lado do filtro Status, e ao clicar atualiza os pagamentos de todas as excursões pedagógicas de uma vez.

---

**Mantidas apenas as últimas 5 versões conforme regra do projeto**

### Arquivos Modificados
- `api/public/admin/listas.html` [Botão "Atualizar" movido do cabeçalho da coluna "Data Pedido" para a área de ações, ao lado do botão "Exportar Excel"]

### Alterações
- O botão "Atualizar" (consulta Asaas e atualiza status de pagamento) ficava no canto direito da tabela, longe do botão "Exportar Excel". Agora ambos ficam juntos na área de ações do card, facilitando o uso.

---

## 2026-02-12 - fix: polling 20 min + 4h + botão Atualizar

### Arquivos Modificados
- `api/public/cliente/js/checkout.js` [Polling: primeira verificação 20 min após compra, depois a cada 4h]
- `api/public/cliente/js/pagamento.js` [Idem]
- `cliente/js/checkout.js` [Idem]
- `api/public/admin/js/listas.js` [Texto atualizado: "1ª verificação em 20 min, depois a cada 4h. Use o botão Atualizar para forçar."]

### Alterações
- Verificação de pagamento PIX: primeira consulta ao Asaas 20 minutos após a compra; em seguida, a cada 4 horas. O botão "Atualizar" na Lista de Alunos permanece para o admin forçar a verificação quando quiser.

---

## 2026-02-12 - fix: polling de status a cada 4 horas + info no admin

### Arquivos Modificados
- `api/public/cliente/js/checkout.js` [Polling de status PIX alterado de 3s para 4 horas (4*60*60*1000 ms)]
- `api/public/cliente/js/pagamento.js` [Polling de status PIX alterado de 5s para 4 horas]
- `cliente/js/checkout.js` [Polling de status PIX alterado de 3s para 4 horas]
- `api/public/admin/js/listas.js` [Coluna Status Pedido: exibe "atualização a cada 4 horas" abaixo de "Aguardando Pagamento"]

### Alterações
- O polling de confirmação de pagamento (PIX/cartão) consumia o servidor a cada 3-5 segundos, encarecendo a operação. Alterado para verificação a cada 4 horas. Na Lista de Alunos (admin), status "Aguardando Pagamento" passa a exibir abaixo a informação "atualização a cada 4 horas" para orientar o administrador.

---

## 2026-02-12 - fix: confirmação de pagamento atualiza status na Lista de Alunos

### Arquivos Modificados
- `api/src/routes/pagamento.routes.ts` [GET /status: ao consultar Asaas, se o pagamento está RECEIVED/CONFIRMED/RECEIVED_IN_CASH/CONFIRMED_BY_CUSTOMER e o pedido ainda PENDENTE ou AGUARDANDO_PAGAMENTO, atualiza o pedido para PAGO. Garante que o polling confirme o pagamento mesmo se o webhook falhar.]

### Alterações
- A Lista de Alunos exibia "Aguardando Pagamento" mesmo após o cliente pagar (PIX ou cartão). O webhook do Asaas atualiza o pedido, mas pode falhar (URL não configurada, firewall). Agora o endpoint GET /cliente/pagamento/:pedidoId/status sincroniza: ao consultar o Asaas e detectar pagamento confirmado, atualiza o pedido para PAGO. O polling (a cada 3–5s) passa a funcionar como confirmação adicional, garantindo que a Lista de Alunos mostre "Pago" após o pagamento.

---

## 2026-02-12 - fix: CPF do responsável (não do aluno) enviado ao Asaas no checkout pedagógico

### Arquivos Modificados
- `api/src/routes/pagamento.routes.ts` [PIX e Cartão: excursão pedagógica passa a usar dadosResponsavelFinanceiro do pedido (CPF, nome, email, telefone do responsável) em vez de cpfAluno/nomeAluno do item (dados do aluno). Excursão convencional continua usando dados do passageiro/item.]

### Alterações
- O fluxo de pagamento PIX e Cartão de excursões pedagógicas enviava o CPF do aluno para a API Asaas. A Lei exige que o pagador (responsável financeiro) seja identificado na cobrança. Ajuste: excursão pedagógica usa dadosResponsavelFinanceiro (CPF do responsável); excursão convencional mantém uso dos dados do passageiro/item.

---

## 2026-02-10 - feat: favicon Avoar nas telas de login (cliente e admin)

### Arquivos Modificados
- `api/public/admin/login.html` [Adicionados <link rel="shortcut icon"> e <link rel="icon"> para ../images/favicon-avoar.png]
- `api/public/cliente/login.html` [Adicionados <link rel="shortcut icon"> e <link rel="icon"> para ../images/favicon-avoar.png]
- `cliente/login.html` [Adicionados <link rel="shortcut icon"> e <link rel="icon"> para ../api/public/images/favicon-avoar.png]

### Alterações
- As telas de login do cliente e do admin não exibiam o favicon da Avoar na aba do navegador (aparecia ícone genérico). Incluídos os links para favicon-avoar.png no <head> de cada página de login.

---

## 2026-02-11 - Fix: botão Nova Categoria (SyntaxError por aspas Unicode)

### Arquivos Modificados
- `api/public/admin/js/categorias.js` [Linha 77: removidas aspas curvas Unicode (U+201C, U+2018, U+201D) na mensagem do confirm(); substituídas por aspas retas ASCII. Listener do botão anexado antes de loadCategorias().]

### Alterações
- O botão "+ Nova categoria" não respondia e não aparecia nenhum log porque categorias.js tinha SyntaxError na linha 77: a mensagem do confirm() usava aspas curvas (" " e ' ') em vez de aspas retas, quebrando o parser e impedindo todo o script de executar. Corrigido para usar apenas aspas ASCII. Listener do botão passou a ser anexado no início do DOMContentLoaded. Alterações estão na pasta api/public/admin/ (servidas pelo Express em /admin).

---

## 2026-02-10 - feat: página de pagamento PIX/Cartão no checkout convencional

### Arquivos Modificados
- `api/public/cliente/pagamento.html` [Nova página de pagamento: opções PIX (QR Code com copia-e-cola) e Cartão de Crédito (formulário completo com dados do titular); exibe resumo do pedido; polling automático de status PIX; tela de sucesso após confirmação]
- `api/public/cliente/js/pagamento.js` [Lógica da página de pagamento: carrega pedido por ID, gera cobrança PIX via API Asaas, exibe QR Code, polling de status a cada 5s, formulário de cartão com máscaras e envio, pré-preenchimento com dados do cliente logado, tratamento de erros e reconciliação]
- `api/public/cliente/js/checkout-convencional.js` [Redirecionamento pós-criação do pedido: em vez de ir para pedidos.html, agora redireciona para pagamento.html?pedidoId={id} para o cliente realizar o pagamento imediatamente]
- `api/public/cliente/pedidos.html` [Adicionado botão "Pagar" nos pedidos com status PENDENTE ou AGUARDANDO_PAGAMENTO; novos estilos para status AGUARDANDO_PAGAMENTO, EXPIRADO e CANCELADO; labels de status traduzidos]

### Alterações
- O fluxo de compra de pacotes de viagem convencional estava incompleto: após criar o pedido, o cliente era redirecionado para "Meus Pedidos" sem opção de pagamento. Agora, após criar o pedido no checkout, o cliente é redirecionado automaticamente para a nova página de pagamento (pagamento.html) onde pode escolher PIX ou Cartão de Crédito. O PIX gera QR Code via API Asaas com verificação automática de status a cada 5 segundos. O cartão envia dados para processamento imediato. Após pagamento confirmado, exibe tela de sucesso com link para "Meus Pedidos". Na listagem de pedidos, pedidos pendentes agora têm botão "Pagar" para retornar à página de pagamento.

---

## 2026-02-10 - Fix: título admin e debug para botão Nova Categoria

### Arquivos Modificados
- `api/public/admin/*.html` (11 arquivos) [Corrigido título da sidebar de "Avorar Admin" para "Avoar Admin" em todas as páginas administrativas]
- `api/public/admin/js/categorias.js` [Adicionados logs detalhados de debug na inicialização e em openModal(); validação de existência de elementos DOM antes de anexar event listeners; console.log e console.error para diagnosticar problema do botão]

### Alterações
- Título do painel administrativo estava incorreto ("Avorar" em vez de "Avoar"). Corrigido em todos os arquivos HTML do admin. Para diagnosticar o problema do botão "+ Nova categoria" que não responde ao clique, foram adicionados logs de debug extensivos: verificação se botão btnNovaCategoria existe, se event listener é anexado, log quando botão é clicado, validação de todos elementos do modal, logs na função openModal(). Isso permitirá identificar exatamente onde o fluxo está falhando.

---

## 2026-02-10 - Fix: checkout convencional não carregava formulário e preço

### Arquivos Modificados
- `api/public/cliente/js/checkout-convencional.js` [Corrigida inicialização da página: requireAuth() retorna Promise, não aceita callback; mudado para async/await; substituído authFetch (inexistente) por clienteAuth.fetchAuth; adicionados logs detalhados para debug do carregamento]

### Alterações
- Na página de checkout convencional (/cliente/checkout-convencional.html), o formulário de dados dos passageiros não era renderizado e o preço aparecia como R$ 0,00. O problema era que a função clienteAuth.requireAuth() retorna uma Promise, mas estava sendo chamada com callback (estilo antigo). A correção foi mudar para async/await na inicialização. Além disso, authFetch não existia; o correto é clienteAuth.fetchAuth. Foram adicionados logs detalhados em loadExcursao() para facilitar debug (status da resposta, dados recebidos, validação de dados).

---

## 2026-02-10 - Fix: botão Nova Categoria e dependência exceljs

### Arquivos Modificados
- `api/public/admin/js/categorias.js` [Função showCategoriaToast corrigida: chamava recursivamente window.showCategoriaToast em vez de window.showToast]
- `api/package.json` [Instalada dependência exceljs (^4.x) para geração de arquivos Excel no sistema de listas de alunos]

### Alterações
- O botão "+ Nova categoria" na página /admin/categorias não abria o modal devido a erro recursivo na função showCategoriaToast. A função estava chamando window.showCategoriaToast(msg, type) dentro de si mesma, causando loop infinito. Corrigido para chamar window.showToast(msg, type) corretamente. Instalada dependência exceljs que faltava, impedindo o servidor de iniciar devido a erro "Cannot find module 'exceljs'" ao carregar o módulo de exportação de listas.

---

## 2026-02-10 - CSP: iframe Heyzine e script inline em Nossos Roteiros

### Arquivos Modificados
- `api/src/server.ts` [Helmet: contentSecurityPolicy com frame-src 'self' e https://heyzine.com para permitir iframe na página Nossos Roteiros]
- `api/public/nossos-roteiros.html` [Script inline do formulário removido; carregamento de js/nossos-roteiros.js]
- `api/public/js/nossos-roteiros.js` [Novo: lógica do submit do formulário (abre WhatsApp) externalizada para compatibilidade com CSP]
- `api/public/js/custom-script.js` [Scrollbar: wheelEventTarget substituído por delegateTo (depreciação smooth-scrollbar)]

### Alterações
- O iframe do Heyzine na página /nossos-roteiros deixava de carregar porque a CSP (default-src 'self') bloqueava frame-src. Foi adicionado frame-src permitindo https://heyzine.com. O script inline do formulário (linha 214) era bloqueado por script-src 'self'; a lógica foi movida para nossos-roteiros.js. Aviso de depreciação do smooth-scrollbar (wheelEventTarget) foi resolvido usando delegateTo.

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
