# Changelog

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
