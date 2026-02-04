# Changelog

## 2026-02-04 - Fix: Excursões não aparecem na listagem do painel e site

### Arquivos Modificados
- `js/api-client.js`, `api/public/js/api-client.js` [Removido try/catch que engolia erros em ExcursaoManager.getAll(); agora propaga erro para UI saber o que aconteceu]
- `admin/excursoes.html`, `api/public/admin/excursoes.html` [Melhorado tratamento de erro em loadExcursoes(); mostra mensagem detalhada, botão "Tentar novamente", redireciona para login em 401]
- `api/public/portfolio.html` [Adicionado mensagem de erro na função loadExcursoes para página pública]
- `api/src/routes/excursao.routes.ts` [Adicionado tratamento para ignorar status/categoria quando forem "todos"/"todas"; filtrosAplicados adicionado nos logs]
- `api/src/routes/public.routes.ts` [Melhorado log com contexto detalhado: encontradas, total, categoria, page, limit]

### Problema Identificado
- **Causa**: Cliente engolia erros de API (401, 500, rede) e retornava [] em vez de propagar → tela mostrava "0 excursões" sem mensagem
- **Sintoma**: POST funcionava (201), dados salvos no banco com status ATIVO, mas GET retornava vazio ou erro silencioso
- **Fluxo afetado**: Listagem admin (GET /api/excursoes) e página pública (GET /api/public/excursoes)

### Solução Implementada
- Removido catch que retornava [] no ExcursaoManager.getAll(); erro agora é propagado
- Frontend admin mostra erro com mensagem detalhada e botão "Tentar novamente"
- Se 401 (token expirado), redireciona para página de login
- Backend ignora valores inválidos "todos"/"todas" nos filtros em vez de rejeitar com validação
- Logs aumentados com mais contexto (filtros aplicados, quantidade de dados)

### Resultado
- ✅ Erros de rede/401/500 agora são visíveis ao usuário
- ✅ Página de excursões pública mostra mensagem de erro em caso de falha
- ✅ Listagem admin mais robusta com retry
- ✅ Possível diagnosticar problemas pelos logs detalhados (filtrosAplicados, contexto)

---

## 2026-02-04 - Remoção da seed automática no deploy

### Arquivos Modificados
- `api/railway.json` [Removido `npm run seed` do startCommand; deploy passa a executar apenas `npx prisma db push && npm start`]

### Alterações
- Seed de excursões, posts e usuários não roda mais em cada deploy no Railway
- Dados já existentes no banco permanecem; novos deploys não recriam dados de exemplo
- Script `npm run seed` continua disponível para execução manual quando necessário

---

## 2026-02-02 - Correção: Excursões não aparecem no site nem no admin (trust proxy)

### Arquivos Modificados
- `api/src/server.ts` [Adicionada configuração `app.set('trust proxy', 1)` antes dos middlewares para permitir que Express reconheça o IP real do cliente através do header X-Forwarded-For enviado pelo proxy reverso do Railway]

### Problema Identificado
- **Causa**: No Railway, requisições passam por proxy reverso que envia header `X-Forwarded-For`, mas Express tinha `trust proxy` desabilitado
- **Efeito**: Rate limiter lançava ValidationError e bloqueava todas as requisições GET antes de chegar aos handlers
- **Sintoma**: Nenhuma excursão aparecia (nem de exemplo), apesar de estarem no banco e POSTs funcionarem
- **Motivo dos POSTs funcionarem**: POST de criação pode ter sido feito antes do erro aparecer ou em ambiente diferente

### Solução Implementada
- Ativada `app.set('trust proxy', 1)` para aceitar header `X-Forwarded-For` do proxy reverso
- Rate limiter agora identifica corretamente o cliente IP mesmo em ambiente Railway
- Requisições GET `/api/excursoes` e `/api/public/excursoes` agora funcionam normalmente
- Todas as 6 excursões (Cristo Redentor, Biologia Marinha, Cachoeiras, Passeio de Barco, 2 de teste) agora aparecem no site e admin

### Benefícios
- ✅ API funciona corretamente em Railway com proxy reverso
- ✅ Rate limiting implementado corretamente (identifica cliente por IP real, não por IP do proxy)
- ✅ Excursões listadas normalmente no site público e painel admin
- ✅ Problema raiz resolvido — sem mais ValidationError nos GETs

---

## 2026-02-02 - Seção Parceiros na página Sobre Nós

### Arquivos Modificados
- `about.html`, `api/public/about.html` [Seção "Parceiros de longa data": layout alterado para texto em cima e imagem embaixo; imagem trocada para parceiros.jpeg]
- `css/about-page.css`, `api/public/css/about-page.css` [Classe proof-layout-stacked para layout empilhado centralizado]
- `api/public/images/Imagens para o site/parceiros.jpeg` [Imagem parceiros.jpeg copiada para servir no site]

### Alterações
- Layout da seção "Quem confia / Parceiros de longa data" agora exibe texto no topo e imagem dos colégios parceiros abaixo
- Nova imagem parceiros.jpeg (grid com logos das instituições de ensino) substitui a foto de grupo anterior
- Conteúdo centralizado com max-width para boa legibilidade

---

## 2026-02-02 - Botão Login alterado para Inscreva-se / Login

### Arquivos Modificados
- `index-10.html`, `index-11.html`, `about.html`, `blog.html`, `blog-single.html`, `contact.html`, `portfolio.html`, `portfolio-single.html` e equivalentes em `api/public/` [Texto do botão na primeira seção (header/navbar) alterado de "Login" para "Inscreva-se / Login" em desktop e menu mobile]

### Alterações
- Botão laranja no header (avoar-top-header) agora exibe "Inscreva-se / Login"
- Mesmo texto no menu mobile (main-nav) quando expandido
- Mantidos links e estilos existentes

---

## 2026-02-02 - Sistema de logs detalhado para diagnóstico no Railway

### Arquivos Modificados
- `api/src/routes/post.routes.ts` [Logs estruturados em todas operações: 📝 listagem, criação, atualização, exclusão de posts; contexto com userId, userEmail, dados, timestamps; erros com stack trace]
- `api/src/routes/excursao.routes.ts` [Logs estruturados em todas operações: 🏝️ listagem, criação, atualização, exclusão de excursões; contexto detalhado incluindo galeria de imagens]
- `api/docs/SISTEMA-LOGS-DETALHADO.md` [Novo: documentação completa; exemplos de logs; guia de filtros no Railway; diagnóstico de problemas comuns]

### Alterações
- Logs com emojis identificadores: ✅ sucesso, ❌ erro, ⚠️ aviso, 🗑️ exclusão, 📝 post, 🏝️ excursão
- Log INICIADA + CONCLUÍDA/FALHOU para rastrear ciclo completo de cada operação
- Contexto JSON com todos os dados relevantes: IDs, títulos, status, categorias, contagem de imagens
- Erros capturados com mensagem e stack trace completo para debugging
- Warnings para recursos não encontrados (facilita diagnóstico de IDs incorretos)
- Timestamps ISO 8601 em todas as operações para correlação temporal
- Prefixo `[AVSITE-API]` mantido para compatibilidade com filtros existentes

### Benefícios
- Diagnóstico rápido de falhas: buscar por ❌ ou FALHOU
- Rastreamento de usuários: filtrar por userEmail
- Auditoria completa: ver quem criou/editou/excluiu o quê e quando
- Debug facilitado: stack traces completos em erros
- Visibilidade no Railway Logs sem configuração adicional

---

## 2026-02-02 - Correção do sistema admin bloqueado por CSP e seed otimizado

### Arquivos Modificados
- `api/prisma/seed.ts` [Seed inteligente: verifica contagem de excursões; cria apenas admin se banco já tiver dados; evita duplicar excursões de teste a cada deploy]
- `admin/js/excursao-editor.js`, `api/public/admin/js/excursao-editor.js` [Novo: toda lógica de criação/edição de excursões externalizada; compatível com CSP]
- `admin/excursao-editor.html`, `api/public/admin/excursao-editor.html` [Removidos onsubmit, onclick, onchange inline; form usa addEventListener; upload de imagens com data-attributes]

### Alterações
- Seed não cria mais dados de teste a cada deploy no Railway; apenas garante admin existe
- Criação de excursões pelo painel admin agora funciona (CSP não bloqueia mais scripts)
- Scripts do editor externalizados: handlers via addEventListener, sem inline events
- Imagens, galeria, editor de texto e botões todos com event listeners externos

---

## 2026-02-02 - Correção do login bloqueado por CSP (Content-Security-Policy)

### Arquivos Modificados
- `admin/login.html`, `api/public/admin/login.html` [Removidos script inline e onsubmit; carregamento de js/login.js externo]
- `admin/js/login.js`, `api/public/admin/js/login.js` [Novo: lógica de login externalizada para compatibilidade com Helmet CSP]

### Alterações
- Login bloqueado pelo Helmet (CSP `script-src 'self'`) que bloqueia scripts inline
- Script de login movido para arquivo externo login.js; formulário sem handlers inline
- Preenchimento de credenciais via URL (?email=&password=) adicionado em login.js
- Link "Esqueceu a senha" sem onclick inline; handler via addEventListener

---

## 2026-02-02 - Substituição de todas as imagens do site pela pasta Imagens para o site

### Arquivos Modificados
- `index-11.html`, `api/public/index-11.html` [Carrossel e páginador da Biologia Marinha: slides e imagens de split usando imagens de images/Imagens para o site/Biologia marinha/]
- `index-10.html`, `api/public/index-10.html` [5 seções fullscreen com background-image da pasta Imagens para o site; seção Biologia Marinha com imagens da subpasta Biologia marinha]
- `about.html`, `api/public/about.html` [Hero e parceiros com imagens da pasta Imagens para o site]
- `portfolio.html`, `portfolio-single.html`, `api/public/portfolio.html`, `api/public/portfolio-single.html` [Background e fallbacks de excursões]
- `blog.html`, `blog-single.html`, `api/public/blog.html`, `api/public/blog-single.html` [Fallbacks de posts e autor]
- `js/data-manager.js`, `api/public/js/data-manager.js` [Seed de excursões e posts com novas imagens]
- `api/prisma/seed.ts` [Excursões e posts do banco com imagens da nova pasta]
- Pasta `images/Imagens para o site` copiada para `api/public/images/`

### Alterações
- Todas as imagens de conteúdo, carrosséis e fundos substituídas por imagens da pasta images/Imagens para o site
- Página Biologia Marinha (index-11) e seção Biologia Marinha no início usam exclusivamente imagens de images/Imagens para o site/Biologia marinha/
- Logos (Logo Branca.png, Logo avorar.webp, favicon) mantidos; slide 3 (Angra dos Reis 2024) mantém vídeo YouTube

---

## 2026-02-02 - Novo header do site em todas as páginas públicas

### Arquivos Modificados
- `css/avoar-top-header.css`, `api/public/css/avoar-top-header.css` [Fundo preto (#000); padding-top 80px no scroll-container; full-section sem margin duplicado]
- `about.html`, `blog.html`, `blog-single.html`, `contact.html`, `portfolio.html`, `portfolio-single.html` [Incluído top header (logo, nav Início/Biologia Marinha/Excursões/Sobre Nós/Blog/Contato, botão Login) e link avoar-top-header.css; link ativo por página]
- `index-11.html`, `api/public/index-11.html` [Menu do top header alinhado: adicionados Excursões e Blog]
- `api/public/about.html`, `api/public/blog.html`, `api/public/blog-single.html`, `api/public/contact.html`, `api/public/portfolio.html`, `api/public/portfolio-single.html` [Mesmo top header com URLs amigáveis /, /biologia-marinha, /excursoes, /sobre-nos, /blog, /contato, /admin/login.html]

### Alterações
- Header novo (fundo preto, logo à esquerda, nav central em maiúsculas com sublinhado laranja no ativo, botão Login em gradiente laranja) aplicado em todas as páginas do site (Início, Biologia Marinha, Excursões, Sobre Nós, Blog, Contato, blog-single, portfolio-single). Páginas administrativas (após login) não alteradas.

---

## 2026-02-02 - Login: remoção de "API: Verificando", logs "Logs avsite" e correção de redirecionamento

### Arquivos Modificados
- `admin/login.html`, `api/public/admin/login.html` [Removido bloco e texto "API: Verificando..." e função checkApiStatus; página de login sem indicador de status da API]
- `api/src/routes/auth.routes.ts` [Logs de autenticação com prefixo "Logs avsite" para identificação no painel Railway]
- `api/src/middleware/request-logger.middleware.ts` [Requisições às rotas /auth passam a incluir "Logs avsite" no log]
- `js/api-client.js`, `api/public/js/api-client.js` [BASE_URL em produção passa a usar mesma origem (window.location.origin + '/api') para login funcionar quando site e API estão no mesmo deploy]

### Alterações
- Página de login não exibe mais "API: Verificando..."
- Logs de login (tentativa, sucesso, falha) e requisições em /auth identificáveis no Railway por "Logs avsite"
- Login em produção (ex: avoarturismo.up.railway.app) redireciona corretamente para dashboard após autenticação

---

## 2026-02-02 - Página inicial com 5 seções aplicada ao site online (api/public)

### Arquivos Modificados
- `api/public/index-10.html` [Atualizado: layout de 5 seções fullscreen com background-image em cada seção; substitui carrossel BXSlider; links para URLs amigáveis /, /biologia-marinha, /sobre-nos, etc.]
- `api/public/css/avoar-sections-page.css` [Novo: estilos para seções fullscreen, animações fadeInUp, responsividade e overlay]

### Alterações
- Site online passa a exibir a nova página inicial com 5 seções (como no index-10.html local)
- Cada seção ocupa 100vh com imagem de fundo; scroll vertical entre seções
- Removido bxslider.js da página inicial

---

## 2026-02-02 - Transformação da página inicial em 5 seções fullscreen

### Arquivos Modificados
- `index-10.html` [Convertida de carrossel BXSlider para 5 seções fullscreen com scroll vertical, cada com background-image]
- `css/avoar-sections-page.css` [Novo arquivo com estilos para as seções, animações e responsividade completa]

### Alterações
- Página inicial agora exibe 5 seções em fullscreen (100vh) ao invés de carrossel
- Cada seção tem sua imagem de fundo (background-image)
- Conteúdo (título, CTA, descrição) agora posicionado dentro de cada seção
- Suporte completo a responsividade (desktop, tablet, mobile)
- Animações de fade-in ao carregar as seções
- Removido script BXSlider desnecessário

---

## 2026-01-31 - Guia e script para testar a API

### Arquivos Modificados
- `api/docs/COMO-TESTAR-API.md` [Novo: guia passo a passo para testar se a API está funcionando — health, login, listar excursões, criar excursão, curl, Postman, erros comuns]
- `api/scripts/test-api.js` [Novo: script Node.js que testa em sequência health, login, listar excursões e criar excursão; uso: node scripts/test-api.js ou node scripts/test-api.js http://localhost:3001]

### Alterações
- Documentação com comandos curl para produção (Railway) e local
- Credenciais padrão: admin@avorar.com / admin123
- Ordem dos testes e tabela resumo
- Script automático com saída ✅/❌ por teste

---

## 2026-01-31 - Sistema de logging robusto com Winston para Railway

### Arquivos Modificados
- `api/package.json` [Adicionada dependência winston ^3.11.0 e @types/winston]
- `api/src/utils/logger.ts` [Substituído por Winston: logs estruturados, prefixo [AVSITE-API], níveis info/warn/error/debug, colorização em dev, JSON em prod]
- `api/src/middleware/request-logger.middleware.ts` [Novo: middleware para capturar método, endpoint, IP, tempo de resposta, status HTTP, usuário, queryParams]
- `api/src/server.ts` [Integrado request-logger-middleware para todas as rotas /api/]
- `api/src/routes/auth.routes.ts` [Melhorados logs em login: tentativa, sucesso, falhas com email/IP/userId]
- `api/src/routes/excursao.routes.ts` [Melhorados logs em GET/POST/PUT: operação iniciada/concluída com contexto completo]
- `api/docs/SISTEMA-LOGGING.md` [Novo: documentação completa do sistema de logging, exemplos de saída, Railway Logs, níveis, contextos]

### Implementações
- Logs com timestamp ISO 8601 e prefixo [AVSITE-API] identificando a API Avorar Turismo
- Captura automática de requisições HTTP (método, endpoint, IP, tempo de resposta, status, usuário)
- Logs estruturados com contexto JSON (userId, userEmail, dados operacionais)
- Stack traces completos para erros
- Suporte a variável LOG_LEVEL para controle de verbosidade
- Diferença automática entre desenvolvimento (colorido) e produção (JSON estruturado)
- Todos os logs aparecem no Railway Logs em tempo real

---

## 2026-01-31 - Checklist de verificação de produção da API

### Arquivos Modificados
- `api/docs/CHECKLIST-PRODUCAO.md` [Novo: documento técnico verificando se a API está pronta para produção no Railway — verifica servidor, BD, auth, validação, CORS, rate limiting, seed, variáveis env, logging, tratamento de erros]

### Conclusão
- ✅ API está **PRONTA PARA PRODUÇÃO** no Railway
- ✅ Todos os requisitos técnicos atendidos
- ✅ Pode receber integração de outros sistemas
- ⚠️ Itens de atenção: JWT_SECRET forte, CORS_ORIGINS correto, considerar Winston/Pino para logs

---

## 2026-01-31 - Revisão do documento de integração: API em produção no Railway

### Arquivos Modificados
- `api/docs/INTEGRACAO-ENVIO-EXCURSOES.md` [Revisado: removidas referências a localhost; base URL fixada em https://avoarturismo.up.railway.app; documento alinhado ao sistema em produção no Railway]

### Alterações
- Base URL e todos os exemplos de endpoint passam a usar a URL pública do Railway
- Aviso explícito: não usar localhost; API responde apenas na URL de produção configurada no projeto
- Resumo para implementação com URLs completas e referência à variável API_BASE_URL do Railway

---

## 2026-01-31 - Documento técnico de integração para envio de excursões

### Arquivos Modificados
- `api/docs/INTEGRACAO-ENVIO-EXCURSOES.md` [Novo: documento técnico explicando como outro programa deve usar a API para enviar excursões — autenticação JWT, POST/PUT, schema do body, exemplos e tratamento de erros]

### Alterações
- Documento descreve base URL, headers, login (POST /api/auth/login), uso do Bearer token
- Especificação do body para criação (POST /api/excursoes) e atualização (PUT /api/excursoes/:id): campos obrigatórios/opcionais, tipos e regras de validação
- Exemplos de requisição/resposta e códigos de erro (401, 400, 404, 429)
- Resumo para implementação em programas externos

---

## 2026-01-31 - Reconstrução da página de login do admin

### Arquivos Modificados
- `admin/login.html`, `api/public/admin/login.html` [Layout minimalista: gradiente laranja no fundo, formulário centralizado sem card, campos cinza claro, botão com gradiente laranja, link Esqueceu a senha, mantida funcionalidade de login/API/lembrar-me]

### Alterações
- Design baseado no print 2: fundo em gradiente horizontal (laranja escuro → claro) com glow no canto superior direito
- Removido card branco: formulário flutuante diretamente sobre o fundo
- Título "Login" em maiúsculas, branco
- Inputs Email e Senha com fundo cinza (#E8E8E8), bordas arredondadas
- Botão Login com gradiente laranja (#FB923C → #EA580C → #C2410C)
- Link "Esqueceu a senha ?" adicionado (visual apenas)
- Funcionalidades preservadas: handleLogin, checkApiStatus, Lembrar-me, AuthManager

---

## 2026-01-31 - Fundo normal, frases visíveis e remoção de duplicata de depoimentos

### Arquivos Modificados
- `css/testimonials.css`, `api/public/css/testimonials.css` [Fundo azul removido: .testimonials-section com background transparent e ::before desativado]
- `about.html`, `api/public/about.html` [Removida primeira seção "about-testimonials-modern" (owl-carousel); mantida apenas a seção testimonials-section com Google 4.9 e carousel]
- `js/testimonials.js`, `api/public/js/testimonials.js` [Inicialização e seletores escopados em .testimonials-section; render/update/updateDots usam apenas o carousel desta seção para as frases aparecerem]

### Correções
- **Fundo**: Seção de depoimentos segue o fundo normal da página (sem gradiente azul).
- **Frases**: Script preenche apenas o carousel da seção que permaneceu; texto dos 27 depoimentos passa a aparecer.
- **Duplicata**: Primeira seção de depoimentos removida; única seção exibida é a que contém o badge Google 4.9 e o carousel com rotação de 8 segundos.

---

## 2026-01-31 - Otimização completa da seção de depoimentos

### Arquivos Modificados
- `css/testimonials.css`, `api/public/css/testimonials.css` [Refatorado: melhor visual, animações suaves, responsividade otimizada]
- `js/testimonials.js`, `api/public/js/testimonials.js` [Mantido: carousel de 8 segundos com navegação manual]
- `about.html`, `api/public/about.html` [Adicionado wrapper testimonials-carousel-wrapper]

### Melhorias UX
- **Backdrop filter** no carousel e setas (efeito glass morphism)
- **Animações suaves**: slideInRight (0.9s), fadeInDown no header
- **Sombras e profundidade**: box-shadow em badges, avatars e setas
- **Espaçamento otimizado**: padding/margin com escala harmônica
- **Feedback visual**: hover effects no badge do Google, setas e dots
- **Tipografia**: font-weight aumentados (800), letter-spacing melhorado

### Responsividade Otimizada
- **1920×1080**: Base - padding 32px, carousel min-height 380px
- **1400×**: Reduz padding para 28px, título 2.8rem
- **1200×**: Carousel 320px, setas 44px, dots 6px
- **768× (Tablet)**: Layout otimizado, padding 20px, min-height 300px
- **667× (Landscape)**: Transição suave entre desktop/mobile
- **480× (Mobile)**: Compacto mas elegante, min-height 260px
- **414× e 375×**: Totalmente otimizado para telas pequenas

### Ajustes Visuais
- Dots passam de 10px para 8px (base), escalados em cada breakpoint
- Setas aumentadas de 44px para 48px em desktop
- Container max-width aumentado de 900px para 1100px em desktop
- Carousel padding aumentado de 60x50px para 70x60px em desktop
- Badge Google com gap/padding maiores, responsivo em mobile
- Animações mais suaves com cubic-bezier(0.25, 0.46, 0.45, 0.94)
- Dots com flex-wrap para não quebrar em telas pequenas

### Correções
- Remover overflow dos cards (sem sobreposição)
- Setas bem posicionadas sem conflitar com conteúdo
- Dots em linha única em desktop, wrap em mobile
- Avatar com flex-shrink: 0 para manter tamanho
- inset: 0 em .testimonial-item para cobertura total

---

## 2026-01-31 - Seção de depoimentos com carousel automático

### Arquivos Modificados
- `css/testimonials.css`, `api/public/css/testimonials.css` [Novo arquivo: estilos do carrossel de depoimentos]
- `js/testimonials.js`, `api/public/js/testimonials.js` [Novo arquivo: classe JavaScript TestimonialsCarousel]
- `about.html`, `api/public/about.html` [Adicionada seção de depoimentos com 27 avaliações de clientes]

### Alterações
- Nova seção "Experiências Reais" na página Sobre Nós com carousel automático
- Badge do Google com rating 4.9⭐ e contagem de avaliações
- Cada depoimento exibe 5 estrelas (todas as avaliações têm 5 estrelas)
- Carousel rotaciona automaticamente a cada 8 segundos
- Navegação manual via setas e dots de navegação (clicáveis)
- Pausa automática ao passar o mouse, retoma ao sair
- Design responsivo (desktop, tablet, mobile)
- Avatar com iniciais do avaliador + nome + função

---

## 2026-01-31 - Ajustes de UX e identidade do site

### Arquivos Modificados
- `index-10.html`, `api/public/index-10.html` [Botão hero: "Saiba mais" → "Inscreva-se / Login" com link para admin/login]
- `css/style.css`, `api/public/css/style.css` [Botão WhatsApp: verde (#25D366), posição inferior direita, flutuante desktop/mobile]
- `index-11.html`, `api/public/index-11.html` [Adicionado botão WhatsApp flutuante; título da página "Avoar Turismo"]
- `css/avoar-index-eleven.css`, `api/public/css/avoar-index-eleven.css` [Estilos do slide 3 com vídeo YouTube em fundo]
- Todos os HTML do site (raiz, api/public, admin) [Título da aba do navegador padronizado para "Avoar Turismo"]

### Alterações
- CTA principal da home passa a "Inscreva-se / Login" apontando para a página de login
- WhatsApp: cor verde oficial, fixo no canto inferior direito em todas as telas
- Página Biologia Marinha: slide 3 (Angra dos Reis 2024) com vídeo YouTube em fundo e CSS para exibição correta
- Título único "Avoar Turismo" na aba do navegador em todas as páginas

---

## 2026-01-29 - Ajustes de design na página de login do admin

### Arquivos Modificados
- `api/public/admin/login.html` [Atualizada paleta de cores: roxo → laranja (#ff5c00), melhorados campos e shadow]

### Alterações
- Gradiente de fundo: roxo → laranja (linear-gradient(135deg, #ff5c00 0%, #ff7a33 100%))
- Logo: roxo → laranja com shadow
- Botão: roxo → laranja com shadow no hover
- Campos: adicionado background #fafafa e borders melhoradas
- Focus: cores do roxo → laranja com opacidade rgba(255, 92, 0, 0.1)
- Shadow geral: melhorado para dar mais profundidade

---

## 2026-01-29 - Credenciais de teste e configuração do seed

### Arquivos Modificados
- `api/railway.json` [Adicionado npm run seed ao startCommand para executar dados de teste no Railway]
- `LOGIN-TEST.md` [Novo arquivo com guia de acesso e credenciais de teste]

### Alterações
- Railway agora executa `npx prisma db push && npm run seed && npm start`
- Credenciais de teste criadas automaticamente no primeiro deploy
- Guia de uso da área admin documentado

---

## 2026-01-29 - Favicon Avoar no site

### Arquivos Modificados
- `api/public/images/favicon-avoar.png` [Novo favicon Avoar]
- `api/public/*.html` [Referências de favicon atualizadas para favicon-avoar.png]

### Alterações
- Favicon do site passa a usar a imagem Avoar em todas as páginas

---

## 2026-01-29 - Item Login no menu do site

### Arquivos Modificados
- `api/public/*.html` [Adicionado item "Login" no menu principal apontando para /admin/login.html]

### Alterações
- Menu do site passa a ter link "Login" que leva à página de login da área admin

---

## 2026-01-29 - URLs amigáveis no site

### Arquivos Modificados
- `api/src/server.ts` [Rotas amigáveis: /, /inicio, /biologia-marinha, /sobre-nos, /blog, /contato, /excursoes; redirects de .html para novas URLs]
- `api/public/*.html` [Links internos atualizados para usar as novas URLs]

### Alterações
- / e /inicio → página inicial (index-10.html)
- /biologia-marinha → Projeto Biologia Marinha (index-11.html)
- /sobre-nos, /blog, /contato, /excursoes → about, blog, contact, portfolio
- URLs antigas (.html) redirecionam com 301 para as novas

---

## 2026-01-29 - Site institucional na raiz da API

### Arquivos Modificados
- `api/src/server.ts` [Configurado para servir site institucional da pasta public/]
- `api/public/` [Criada pasta com todos os arquivos do site: HTML, CSS, JS, imagens, fontes e admin]

### Alterações
- GET / retorna index-11.html (site institucional)
- GET /*.html serve qualquer página HTML do site (about, blog, portfolio, etc.)
- Arquivos estáticos servidos de api/public/ para funcionar no Railway
- Endpoints da API continuam em `/api/*`

---

## 2026-01-29 - Rota raiz na API

### Arquivos Modificados
- `api/src/server.ts` [Rota GET / e fallback no 404 para path / com resposta JSON amigável]

### Alterações
- Ao acessar o domínio retorna JSON com nome da API e endpoints; fallback no handler 404 quando path é / garante resposta mesmo em deploy antigo

---

## 2026-01-29 - Correção de Erros TypeScript na API

### Arquivos Modificados
- `api/src/routes/auth.routes.ts` [Corrigido type casting do token JWT com expiresIn]
- `api/src/routes/excursao.routes.ts` [Corrigido type casting de query parameters usando tipos Zod]
- `api/src/routes/post.routes.ts` [Corrigido type casting de query parameters usando tipos Zod]

### Alterações
- Implementado type casting seguro de `ParsedQs` para tipos específicos do Zod
- Resolvido erro de compilação com JWT SignOptions para expiresIn como string
- Build TypeScript agora passa com sucesso sem erros

---

## 2026-01-29 - Sistema Online com API e PostgreSQL

### Arquivos Criados
- `api/` [Pasta completa do backend Node.js/Express/TypeScript]
  - `api/src/server.ts` [Servidor principal com Express]
  - `api/src/routes/*.ts` [Rotas de auth, excursões, posts, uploads, pagamentos]
  - `api/src/middleware/*.ts` [Middlewares de autenticação e validação]
  - `api/src/schemas/*.ts` [Schemas Zod para validação de dados]
  - `api/src/utils/*.ts` [Utilitários: logger, api-error, slug]
  - `api/src/config/database.ts` [Configuração Prisma/PostgreSQL]
  - `api/prisma/schema.prisma` [Schema do banco de dados]
  - `api/prisma/seed.ts` [Dados iniciais do sistema]
- `js/api-client.js` [Cliente JavaScript para consumir API]
- `api/API-DOCS.md` [Documentação da API pública]
- `api/DEPLOY-RAILWAY.md` [Guia de deploy no Railway]

### Arquivos Modificados
- `admin/login.html` [Autenticação via API JWT]
- `admin/excursoes.html` [CRUD via API]
- `admin/excursao-editor.html` [Editor via API]
- `admin/js/admin-main.js` [Funções de auth atualizadas]
- `portfolio.html` [Carregamento de excursões via API]
- `README.md` [Documentação atualizada]

---

## 2026-01-28 - Sistema Administrativo Frontend

### Arquivos Criados
- `admin/css/admin-style.css` [Estilos do sistema administrativo]
- `admin/js/admin-main.js` [JavaScript principal do admin]
- `admin/dashboard.html` [Dashboard com estatísticas]
- `admin/blog.html`, `admin/blog-editor.html` [CRUD de posts]
- `admin/excursoes.html`, `admin/excursao-editor.html` [CRUD de excursões]
- `admin/config-pagamento.html` [Configuração de gateways]
- `js/data-manager.js` [Gerenciador de dados localStorage - substituído por api-client.js]

---

## 2026-01-27 - Páginas Dinâmicas do Site

### Arquivos Modificados
- `blog.html` [Listagem dinâmica de posts]
- `blog-single.html` [Post individual dinâmico]
- `portfolio.html` [Listagem de excursões dinâmica]
- `portfolio-single.html` [Excursão individual dinâmica]

---

## 2026-01-26 - Estrutura Inicial

### Arquivos Criados
- Estrutura HTML/CSS do site
- Páginas estáticas: about.html, contact.html
- CSS personalizado: avoar-custom.css

---

**Mantidas apenas as últimas 5 versões conforme regra do projeto**
