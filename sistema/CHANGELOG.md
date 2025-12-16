# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [0.5.2] - 2025-01-27

### Fixed
- **CSS Padrão Avoar Aplicado em Todas as Páginas**
- `sistema/app/globals.css` - Fundo preto (#000000), texto branco, fontes Cairo e Montserrat
- `sistema/app/layout.tsx` - Simplificado para carregar apenas globals.css
- `sistema/app/admin/layout.tsx` - Wrapper com classe .admin-page
- `sistema/app/admin/login/page.tsx` - Removido estilos inline conflitantes
- Todas as páginas do sistema agora seguem o padrão visual Avoar
- CSS carregando corretamente via proxy do servidor estático

### Files Modified
- `sistema/app/globals.css` - Base CSS com cores e fontes Avoar
- `sistema/app/layout.tsx` - Layout root simplificado
- `sistema/app/admin/layout.tsx` - Layout admin com classe wrapper
- `sistema/app/admin/login/page.tsx` - Página de login limpa

### Files Created
- `CSS-PADRAO-AVOAR-APLICADO.txt` - Documentação completa do padrão CSS Avoar

## [0.4.1] - 2025-01-27

### Added
- **Configuração Completa de Dependências**
- `CONFIGURACAO-SETUP.md` - Guia completo de configuração
- `CONFIGURACAO-PRODUCAO.md` - Guia de deployment e produção
- `GUIA-RAPIDO-SETUP.md` - Guia de 5 minutos para começar
- `setup.bat` - Script automático de setup para Windows
- `setup.sh` - Script automático de setup para macOS/Linux
- 552 packages npm instalados e auditados
- Suporte para PostgreSQL com schema completo (4 tabelas + indices)
- Sistema de validação com Zod para todas as entradas
- Autenticação JWT com bcryptjs para senhas

### Modified
- README.md atualizado com informações de setup
- `.env.local` criado com configurações de desenvolvimento
- Documentação reorganizada e estruturada

## [0.4.0] - 2025-01-27

### Modified
- **Adicionado botão de Login no menu de navegação com redirecionamento dinâmico**
- `index-10.html`, `index-11.html`, `about.html`, `blog.html`, `contact.html`, `portfolio.html`, `blog-single.html`, `portfolio-single.html` - Adicionado item "Login" no menu de navegação com script JavaScript que detecta o ambiente (desenvolvimento/produção) e configura a URL correta para redirecionar para `/admin/login` do sistema Next.js

## [0.3.0] - 2025-12-14

### Added
- **Fase 4: Módulo Excursões Completo**
- API CRUD de excursões (`GET`, `POST`, `PUT`, `DELETE`)
- Página admin de listagem (`/admin/excursoes`)
- Página admin de criar/editar excursão (`/admin/excursoes/[id]`)
- Página pública de listagem de excursões (`/excursoes`)
- Página pública de detalhe da excursão (`/excursoes/[id]`)
- Formulário com validação de preços e URLs
- Sistema de filtro por status (ativa/inativa)
- Design responsivo com cards e hero image
- Badges de status (ativo/inativo)
- Formatação de preço em reais

### Files Created
- `app/api/excursoes/route.ts` - API GET e POST
- `app/api/excursoes/[id]/route.ts` - API GET, PUT, DELETE
- `app/admin/excursoes/page.tsx` - Listagem admin
- `app/admin/excursoes/[id]/page.tsx` - Editor admin
- `app/excursoes/page.tsx` - Listagem pública
- `app/excursoes/[id]/page.tsx` - Detalhe público

## [0.2.0] - 2025-12-14

### Added
- **Fase 2: Sistema de Autenticação Completo**
- Página de login (`/admin/login`) com formulário responsivo
- API de login (`POST /api/auth/login`) com validação Zod e JWT
- API de logout (`POST /api/auth/logout`)
- Dashboard admin (`/admin/dashboard`) com cards de navegação
- Layout admin (`app/admin/layout.tsx`)
- Middleware atualizado com rotas públicas
- Verificação de autenticação via localStorage
- Sistema de redirecionamento automático
- Design moderno com Tailwind CSS

### Files Modified
- `middleware.ts` - Rotas públicas e proteção de APIs
- `.env.local` - Host público do PostgreSQL

### Files Created
- `app/admin/login/page.tsx` - Página de login
- `app/admin/dashboard/page.tsx` - Dashboard administrativo
- `app/admin/layout.tsx` - Layout admin
- `app/api/auth/login/route.ts` - API de login
- `app/api/auth/logout/route.ts` - API de logout

## [0.1.0] - 2025-12-14

### Added
- **Fase 1: Setup Base Completa**
- Projeto Next.js 14 com TypeScript configurado
- Tailwind CSS e PostCSS
- PostgreSQL com pool de conexão
- Schemas Zod para validação de dados (Auth, Blog, Excursões, Pagamento)
- Sistema de autenticação com JWT e bcryptjs
- Middleware para proteção de rotas administrativas
- Banco de dados com 4 tabelas principais (users, blog_posts, excursoes, payment_config)
- Sistema de logging com debug otimizado
- Utilitários (formatação, slugs, URLs)
- Scripts de teste e seed de dados
- Documentação completa (README, SETUP, FASE-1-COMPLETA)

### Files Created
- `package.json`, `tsconfig.json`, `next.config.js` - Configuração
- `app/layout.tsx`, `app/page.tsx` - Pages iniciais
- `lib/auth.ts` - Funções JWT e bcrypt
- `lib/validation.ts` - Schemas Zod
- `lib/types.ts` - Types TypeScript
- `lib/db/` - Conexão e scripts do banco
- `lib/logger.ts`, `lib/utils.ts`, `lib/constants.ts` - Utilitários
- `middleware.ts` - Proteção de rotas
