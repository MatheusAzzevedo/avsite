# Changelog

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
