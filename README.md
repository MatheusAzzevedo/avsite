# Avorar Turismo - Sistema Completo

Sistema de site e administração para Avorar Turismo com backend em Node.js/Express, banco de dados PostgreSQL e frontend em HTML/CSS/JavaScript.

## Arquivos Modificados [Resumo das Atualizações]

### Última atualização (2026-02-04) - Fix: Excursões não aparecem na listagem
- **js/api-client.js**, **api/public/js/api-client.js** [Removido try/catch que engolia erros em getAll(); erro agora propagado]
- **admin/excursoes.html**, **api/public/admin/excursoes.html** [Tratamento de erro com mensagem detalhada, botão "Tentar novamente", redireciona para login em 401]
- **api/public/portfolio.html** [Adicionado mensagem de erro na página pública de excursões]
- **api/src/routes/excursao.routes.ts**, **api/src/routes/public.routes.ts** [Melhor tratamento de filtros e logs com mais contexto]

**Problema corrigido**: Erros na listagem (401, 500, rede) eram engolidos e retornavam [] → mostrava "0 excursões" sem avisar. Agora propaga erro e mostra mensagem clara ao usuário.

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
2. **Autenticação JWT**: Sistema seguro de login/logout com tokens
3. **CRUD Excursões**: Criar, editar, listar e excluir excursões
4. **CRUD Posts**: Gerenciamento completo do blog
5. **Upload de Imagens**: Sistema de upload com processamento via Sharp
6. **Integração Externa**: API pública documentada para outros sistemas

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
- **Autenticação:** JWT (jsonwebtoken)
- **Upload:** Multer + Sharp
- **Frontend:** HTML5, CSS3, JavaScript Vanilla
