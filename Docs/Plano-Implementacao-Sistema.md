# Plano de Implementação - Sistema Avoar Site

## 📋 Visão Geral
Migração de um site HTML/CSS/JS estático para Next.js com sistema de administração completo para gerenciar blog, excursões e pagamentos.

### 📄 Páginas a Serem Migradas:
- ✅ `blog.html` → `/blog` (listagem dinâmica)
- ✅ `blog-single.html` → `/blog/[id]` (detalhe dinâmico)
- ✅ `portfolio.html` → `/excursoes` (listagem com filtro dinâmico)
- ✅ `portfolio-single.html` → `/excursoes/[id]` (detalhe dinâmico)

### 📄 Páginas Mantidas como Estáticas (fora do Next.js):
- `index.html` (homepage)
- `about.html` (sobre)
- `contact.html` (contato)
- `index-10.html`, `index-11.html` (variações)

### 📄 Novas Páginas Criadas no Next.js:
- `/admin/login` (autenticação)
- `/admin/dashboard` (painel principal)
- `/admin/blog` (gerenciamento de posts)
- `/admin/blog/[id]` (edição de posts)
- `/admin/excursoes` (gerenciamento de excursões)
- `/admin/excursoes/[id]` (edição de excursões)
- `/admin/pagamento` (configuração de pagamentos)
- `/checkout` (página de pagamento)

---

## 📁 Estrutura do Projeto Next.js

```
avoar-system/
├── app/
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── blog/
│   │   │   ├── page.tsx (listagem)
│   │   │   └── [id]/
│   │   │       └── page.tsx (editar)
│   │   ├── excursoes/
│   │   │   ├── page.tsx (listagem)
│   │   │   └── [id]/
│   │   │       └── page.tsx (editar)
│   │   ├── pagamento/
│   │   │   └── page.tsx (configuração API)
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.ts
│   │   │   └── logout.ts
│   │   ├── blog/
│   │   │   ├── route.ts (CRUD)
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── excursoes/
│   │   │   ├── route.ts (CRUD)
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── pagamento/
│   │   │   ├── config/
│   │   │   │   └── route.ts (Get/Update config)
│   │   │   └── checkout/
│   │   │       └── route.ts
│   ├── blog/
│   │   ├── page.tsx (listagem - migrado de blog.html)
│   │   └── [id]/
│   │       └── page.tsx (detalhe - migrado de blog-single.html)
│   ├── excursoes/
│   │   ├── page.tsx (listagem - migrado de portfolio.html)
│   │   └── [id]/
│   │       └── page.tsx (detalhe - migrado de portfolio-single.html)
│   ├── checkout/
│   │   └── page.tsx (página de pagamento)
│   ├── layout.tsx
│   └── page.tsx (homepage)
├── lib/
│   ├── db/ (conexão com banco de dados)
│   ├── auth.ts (autenticação)
│   ├── validation.ts (schemas Zod)
│   └── utils.ts
├── components/
│   ├── admin/
│   │   ├── BlogEditor.tsx (editor com Canva)
│   │   ├── ExcursaoForm.tsx
│   │   ├── ImageUpload.tsx
│   │   └── Sidebar.tsx
│   ├── shared/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── Header.tsx
│   └── blog/
│       ├── BlogList.tsx
│       └── BlogCard.tsx
├── public/
│   ├── images/
│   ├── css/
│   └── fonts/
├── styles/
│   ├── globals.css
│   └── admin.css
├── package.json
├── tsconfig.json
├── next.config.js
└── .env.local
```

---

## 🗄️ Banco de Dados (PostgreSQL)

### Tabelas:

#### 1. **users** (Administradores)
```sql
- id (UUID PRIMARY KEY)
- email (VARCHAR UNIQUE)
- password_hash (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2. **blog_posts**
```sql
- id (UUID PRIMARY KEY)
- title (VARCHAR)
- subtitle (VARCHAR)
- content (TEXT) - conteúdo rico do editor
- author_id (FK → users)
- published (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 3. **excursoes**
```sql
- id (UUID PRIMARY KEY)
- title (VARCHAR)
- subtitle (VARCHAR)
- description (TEXT)
- image_url (VARCHAR)
- featured_image_url (VARCHAR) - para a página de detalhe
- price (DECIMAL)
- active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 4. **payment_config**
```sql
- id (UUID PRIMARY KEY)
- provider (VARCHAR) - ex: "stripe", "mercado-pago"
- api_key (VARCHAR ENCRYPTED)
- secret_key (VARCHAR ENCRYPTED)
- webhook_url (VARCHAR)
- active (BOOLEAN)
- updated_at (TIMESTAMP)
```

---

## 🔐 Sistema de Autenticação

### Funcionalidades:
- ✅ Login simples com email/senha
- ✅ Middleware de proteção de rotas (`/admin/*`)
- ✅ Session management (JWT ou next-auth)
- ✅ Logout
- ✅ Recuperação de senha (opcional para fase 1)

### Fluxo:
1. User acessa `/admin/login`
2. Submete email e senha
3. Validação com Zod
4. Hash de senha com bcrypt
5. Retorna token JWT/Session
6. Redirect para dashboard

---

## 📝 Módulo Blog

### Páginas Admin:
- **POST `/admin/blog`** - Listagem de posts com paginação
- **GET `/admin/blog/novo`** - Formulário novo post
- **POST `/admin/blog/novo`** - Criar novo post
- **GET `/admin/blog/[id]`** - Formulário editar post
- **PUT `/admin/blog/[id]`** - Atualizar post
- **DELETE `/admin/blog/[id]`** - Deletar post

### Editor:
- ✅ **Usar obrigatoriamente a biblioteca TipTap** (@tiptap/react) para rich text editor
- Funcionalidades do TipTap:
  - Formatação de texto (bold, italic, underline, strikethrough)
  - Títulos (H1, H2, H3)
  - Listas (ordenadas e não-ordenadas)
  - Blockquotes
  - Código
  - Links
  - Upload de imagens
  - Visualização em tempo real
- Salvar conteúdo em formato JSON do TipTap (extensível para exportação em HTML/Markdown)

### Página Pública:
- **GET `/blog`** - Listagem de posts (migrado de `blog.html`)
- **GET `/blog/[id]`** - Detalhe do post (migrado de `blog-single.html`)

---

## 🎫 Módulo Excursões

### Páginas Admin:
- **GET `/admin/excursoes`** - Listagem com filtro
- **GET `/admin/excursoes/novo`** - Formulário nova excursão
- **POST `/admin/excursoes/novo`** - Criar excursão
- **GET `/admin/excursoes/[id]`** - Formulário editar
- **PUT `/admin/excursoes/[id]`** - Atualizar excursão
- **DELETE `/admin/excursoes/[id]`** - Deletar excursão

### Funcionalidades:
- Upload de imagem de capa (thumbnail)
- Upload de imagem destacada (página de detalhe)
- Campos: Título, Subtítulo, Descrição, Preço
- Status ativo/inativo
- Filtro por status na listagem

### Página Pública:
- **GET `/excursoes`** - Listagem com filtro dinâmico (migrado de `portfolio.html`)
- **GET `/excursoes/[id]`** - Detalhe da excursão (migrado de `portfolio-single.html`)

---

## 💳 Módulo Pagamento

### Páginas Admin:
- **GET `/admin/pagamento`** - Configuração de API de pagamento
- **PUT `/admin/pagamento`** - Atualizar configuração

### Funcionalidades:
- Seletor de provider (Stripe, Asaas, Mercado Pago, etc)
- Campo para API Key
- Campo para Secret Key (mascarado)
- Webhook URL
- Status ativo/inativo

### Página Pública:
- **GET `/checkout`** - Página de checkout (design do site)
- **POST `/checkout`** - Processar pagamento
- Integração com provider escolhido

---

## 📦 Dependências Principais

```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "typescript": "^5.0.0",
  "zod": "^3.22.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.1.0",
  "pg": "^8.11.0",
  "@tiptap/react": "^2.0.0",
  "next-auth": "^4.24.0",
  "axios": "^1.6.0",
  "sharp": "^0.33.0"
}
```

---

## 🔄 Fluxo de Implementação (Fases)

### **Fase 1: Setup Base**
- [ ] Criar projeto Next.js
- [ ] Configurar banco de dados PostgreSQL
- [ ] Criar schemas Zod para validação
- [ ] Setup autenticação (JWT)

### **Fase 2: Sistema de Autenticação**
- [ ] Página de login
- [ ] API de login/logout
- [ ] Middleware de proteção
- [ ] Dashboard admin vazio

### **Fase 3: Módulo Blog**
- [ ] API CRUD de blog
- [ ] Páginas admin (listar, criar, editar, deletar)
- [ ] Integração do editor TipTap (@tiptap/react)
- [ ] Upload de imagens no editor
- [ ] Migração das páginas públicas: `blog.html` → `/blog` (listagem)
- [ ] Migração das páginas públicas: `blog-single.html` → `/blog/[id]` (detalhe)

### **Fase 4: Módulo Excursões**
- [ ] API CRUD de excursões
- [ ] Páginas admin (listar, criar, editar, deletar)
- [ ] Upload de imagens (thumbnail e destacada)
- [ ] Migração das páginas públicas: `portfolio.html` → `/excursoes` (listagem com filtro)
- [ ] Migração das páginas públicas: `portfolio-single.html` → `/excursoes/[id]` (detalhe)

### **Fase 5: Módulo Pagamento**
- [ ] API de configuração
- [ ] Página de configuração admin
- [ ] Página de checkout
- [ ] Integração com provider de pagamento

---

## 🎨 Assets & Estilos

- Reutilizar CSS do site atual (migrar para módulos CSS/Tailwind)
- Reutilizar fonts customizadas (Gotham, Monument, Telegraf)
- Reutilizar imagens e ícones
- Adaptar design para componentes React

---

## ✅ Checklist de Validação

- [ ] Sistema de autenticação funcional
- [ ] CRUD completo para blog
- [ ] CRUD completo para excursões
- [ ] Upload de imagens funcionando
- [ ] Páginas públicas renderizam dados do BD
- [ ] Filtros dinâmicos funcionando
- [ ] Configuração de pagamento salva
- [ ] Checkout integrado com API
- [ ] TypeScript sem erros
- [ ] Validação Zod em todas as APIs
- [ ] Tratamento de erros implementado

---

## 📝 Notas Importantes

1. **Banco de Dados**: Usar PostgreSQL (nunca SQLite conforme regra)
2. **Validação**: Todas as entradas validadas com Zod
3. **Segurança**: Senhas criptografadas com bcrypt, API Keys encriptadas
4. **Imagens**: Usar Sharp para otimização e redimensionamento
5. **Commits**: Um commit por tarefa (feat/fix)
6. **Documentação**: Manter README e CHANGELOG atualizados

---

**Data de Criação**: 14 de Dezembro de 2025
**Status**: Planejamento
