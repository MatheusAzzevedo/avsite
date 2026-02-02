# Avorar Turismo - Sistema Completo

Sistema de site e administração para Avorar Turismo com backend em Node.js/Express, banco de dados PostgreSQL e frontend em HTML/CSS/JavaScript.

## Arquivos Modificados [Resumo das Atualizações]

### Última atualização (2026-02-02) - Login e logs
- **admin/login.html**, **api/public/admin/login.html** [Removido texto "API: Verificando..." da tela de login]
- **api/src/routes/auth.routes.ts** [Logs de login com prefixo "Logs avsite" para filtro no Railway]
- **api/src/middleware/request-logger.middleware.ts** [Requisições em /auth logadas com "Logs avsite"]
- **js/api-client.js**, **api/public/js/api-client.js** [BASE_URL em produção = mesma origem; login e redirecionamento para dashboard corrigidos]

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
