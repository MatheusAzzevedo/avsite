# 📋 Guia Completo de Configuração - Avoar Sistema

## 🎯 Checklist de Setup Completo

Este guia irá guiá-lo através de toda a configuração necessária para rodar o projeto Avoar Sistema em ambiente de desenvolvimento.

---

## ✅ Passo 1: Variáveis de Ambiente

### 1.1 Criar arquivo `.env.local`

Na pasta `sistema/`, crie um arquivo chamado `.env.local` com o seguinte conteúdo:

```bash
# ====================================
# Configuração do Banco de Dados PostgreSQL
# ====================================

# Local (Desenvolvimento)
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=avoar_db

# String de conexão completa
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/avoar_db

# ====================================
# Configuração de Segurança
# ====================================

# JWT Secret - MUDE ISTO EM PRODUÇÃO!
JWT_SECRET=seu-secret-jwt-super-seguro-mude-em-producao-2025

# ====================================
# Configuração de Ambiente
# ====================================

NODE_ENV=development
```

⚠️ **IMPORTANTE**: Mude a senha `postgres` e o `JWT_SECRET` em produção!

---

## ✅ Passo 2: Instalar Dependências Node.js

### 2.1 Verificar Node.js

Certifique-se de que tem Node.js 18+ instalado:

```bash
node --version
npm --version
```

### 2.2 Instalar Dependências

Na pasta `sistema/`, execute:

```bash
npm install
```

**Dependências instaladas:**

#### Runtime
- **next** (^14.2.0) - Framework React com SSR
- **react** (^18.3.1) - Biblioteca UI
- **react-dom** (^18.3.1) - Renderização DOM
- **typescript** (^5.4.0) - Type safety para JavaScript
- **tailwindcss** (^3.4.3) - Estilização CSS-first
- **postcss** (^8.4.38) - Processador de CSS
- **autoprefixer** (^10.4.19) - Prefixos automáticos CSS
- **zod** (^3.22.4) - Validação de schemas
- **bcryptjs** (^2.4.3) - Hash criptográfico de senhas
- **jsonwebtoken** (^9.0.0) - Tokens JWT
- **pg** (^8.11.3) - Driver PostgreSQL
- **axios** (^1.6.8) - Cliente HTTP
- **sharp** (^0.33.2) - Otimização de imagens
- **@tiptap** - Editor de texto rico (blog)

#### Development
- **@types/node** - Tipos TypeScript para Node.js
- **@types/react** - Tipos TypeScript para React
- **@types/react-dom** - Tipos TypeScript para React DOM
- **@types/bcryptjs** - Tipos TypeScript para bcryptjs
- **@types/jsonwebtoken** - Tipos TypeScript para JWT
- **@types/pg** - Tipos TypeScript para PostgreSQL
- **eslint** - Linter de JavaScript
- **eslint-config-next** - Configuração ESLint para Next.js

---

## ✅ Passo 3: Configurar Banco de Dados PostgreSQL

### 3.1 Opção A: PostgreSQL Local (Recomendado para Desenvolvimento)

#### No Windows:
1. Baixe e instale [PostgreSQL](https://www.postgresql.org/download/windows/)
2. Durante a instalação, lembre-se da senha do usuário `postgres`
3. Mantenha a porta padrão 5432

#### No macOS (com Homebrew):
```bash
brew install postgresql
brew services start postgresql
```

#### No Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 3.2 Criar Banco de Dados

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Dentro do psql:
CREATE DATABASE avoar_db;
\q
```

### 3.3 Criar Tabelas

Na pasta `sistema/`, execute:

```bash
# Windows PowerShell / CMD
psql -U postgres -d avoar_db -f lib/db/schema.sql

# macOS / Linux
psql -U postgres -d avoar_db < lib/db/schema.sql
```

**Esperado**: Sem erros ou avisos de deprecação apenas.

---

## ✅ Passo 4: Testar Conexão com Banco de Dados

Na pasta `sistema/`, execute:

```bash
npx ts-node lib/db/test-connection.ts
```

**Saída esperada:**
```
✅ Conexão bem-sucedida!
⏰ Hora do servidor: 2025-01-27T10:30:45.123Z
📋 Tabelas existentes:
   - users
   - blog_posts
   - excursoes
   - payment_config
```

Se der erro, verifique:
- PostgreSQL está rodando?
- Credenciais em `.env.local` estão corretas?
- Banco de dados `avoar_db` foi criado?
- Arquivo `schema.sql` foi executado?

---

## ✅ Passo 5: Criar Usuário Administrador (Seed Data)

Na pasta `sistema/`, execute:

```bash
node seed-db.js
```

**Esperado:**
```
✅ Admin user criado com sucesso!
📧 Email: admin@avoar.com.br
🔐 Senha: Admin@123456
```

⚠️ **Mude essa senha após o primeiro login!**

---

## ✅ Passo 6: Executar Projeto em Desenvolvimento

Na pasta `sistema/`, execute:

```bash
npm run dev
```

**Esperado:**
```
> avoar-sistema@0.3.0 dev
> next dev

  ▲ Next.js 14.2.0
  - Local:        http://localhost:3000
  - Environments: .env.local
  Ready in 2.5s
```

Acesse: **http://localhost:3000**

---

## 📁 Estrutura do Projeto

```
sistema/
├── app/                          # Páginas e rotas Next.js
│   ├── admin/                    # Área administrativa
│   │   ├── login/
│   │   │   ├── page.tsx          # Página de login
│   │   │   └── login.css         # Estilos
│   │   ├── dashboard/            # Dashboard admin
│   │   ├── blog/                 # Gerenciamento de posts
│   │   └── excursoes/            # Gerenciamento de excursões
│   ├── api/                      # APIs REST
│   │   ├── auth/                 # Autenticação
│   │   ├── blog/                 # Posts do blog
│   │   └── excursoes/            # Excursões
│   ├── blog/                     # Páginas públicas
│   ├── excursoes/                # Páginas públicas
│   ├── layout.tsx                # Layout raiz
│   ├── page.tsx                  # Página inicial
│   └── globals.css               # Estilos globais
│
├── lib/                          # Lógica compartilhada
│   ├── db/
│   │   ├── index.ts              # Conexão PostgreSQL
│   │   ├── schema.sql            # DDL das tabelas
│   │   ├── test-connection.ts    # Teste de conexão
│   │   └── seed.ts               # Scripts de dados
│   ├── auth.ts                   # JWT + bcrypt
│   ├── validation.ts             # Schemas Zod
│   ├── constants.ts              # Constantes
│   ├── types.ts                  # Tipos TypeScript
│   ├── logger.ts                 # Sistema de logs
│   └── utils.ts                  # Utilitários
│
├── public/                       # Assets estáticos
├── .env.local                    # Variáveis de ambiente (não commitar)
├── .env.example                  # Exemplo de .env.local
├── package.json                  # Dependências
├── tsconfig.json                 # Configuração TypeScript
├── next.config.js                # Configuração Next.js
├── tailwind.config.ts            # Configuração Tailwind
├── postcss.config.ts             # Configuração PostCSS
├── middleware.ts                 # Middleware de autenticação
└── README.md                     # Este arquivo
```

---

## 🚀 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Rodar em desenvolvimento (http://localhost:3000)

# Build e Produção
npm run build            # Build para produção
npm start                # Rodar build em produção

# Linting
npm run lint             # Verificar código com ESLint

# Testes e Utilitários
npx ts-node <arquivo>   # Executar arquivo TypeScript
node seed-db.js          # Criar dados de exemplo
```

---

## 🔐 Credenciais de Desenvolvimento

### Login Admin Padrão

Após executar `node seed-db.js`:

```
Email: admin@avoar.com.br
Senha: Admin@123456
```

Acesse em: **http://localhost:3000/admin/login**

---

## 🌐 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/logout` - Fazer logout

### Blog (Protegido)
- `GET /api/blog` - Listar posts
- `POST /api/blog` - Criar post
- `PUT /api/blog/[id]` - Editar post
- `DELETE /api/blog/[id]` - Deletar post

### Excursões (Protegido)
- `GET /api/excursoes` - Listar excursões
- `POST /api/excursoes` - Criar excursão
- `PUT /api/excursoes/[id]` - Editar excursão
- `DELETE /api/excursoes/[id]` - Deletar excursão

### Páginas Públicas
- `GET /` - Página inicial
- `GET /blog` - Listagem de posts
- `GET /blog/[id]` - Detalhe do post
- `GET /excursoes` - Listagem de excursões
- `GET /excursoes/[id]` - Detalhe da excursão
- `GET /admin/login` - Página de login

---

## 🐛 Troubleshooting

### Erro: "ECONNREFUSED" ao conectar no banco

**Solução:**
```bash
# Verificar se PostgreSQL está rodando
psql -U postgres -c "SELECT version();"

# Se não estiver:
# Windows: Abrir PostgreSQL no Services ou usar pgAdmin
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### Erro: "Cannot find module 'pg'"

**Solução:**
```bash
npm install pg @types/pg --save
```

### Erro: "database "avoar_db" does not exist"

**Solução:**
```bash
# Criar banco de dados
psql -U postgres -c "CREATE DATABASE avoar_db;"

# Criar tabelas
psql -U postgres -d avoar_db -f lib/db/schema.sql
```

### Erro: "FATAL: password authentication failed"

**Solução:**
- Verifique a senha em `.env.local`
- Verifique o usuário (padrão: postgres)
- Resete a senha no PostgreSQL se necessário

### Porta 3000 já está em uso

**Solução:**
```bash
# Usar porta diferente
npm run dev -- -p 3001

# Ou liberar porta 3000:
# Windows: netstat -ano | findstr :3000
# macOS/Linux: lsof -i :3000
```

---

## 📦 Dependências por Recurso

### Autenticação
- `bcryptjs` - Hash de senhas
- `jsonwebtoken` - Tokens JWT
- `@types/bcryptjs` - Tipos
- `@types/jsonwebtoken` - Tipos

### Validação de Dados
- `zod` - Schemas e validação
- `axios` - Requisições HTTP

### Banco de Dados
- `pg` - Driver PostgreSQL
- `@types/pg` - Tipos

### UI/Styling
- `tailwindcss` - Estilização
- `autoprefixer` - Prefixos CSS
- `postcss` - Processador CSS

### Editor de Texto (Blog)
- `@tiptap/react` - Editor
- `@tiptap/starter-kit` - Extensões básicas
- `@tiptap/extension-link` - Links
- `@tiptap/pm` - ProseMirror

### Imagens
- `sharp` - Otimização

---

## ✅ Checklist de Configuração

- [ ] Node.js 18+ instalado
- [ ] PostgreSQL instalado e rodando
- [ ] Arquivo `.env.local` criado
- [ ] Banco de dados `avoar_db` criado
- [ ] `npm install` executado
- [ ] Schema SQL executado
- [ ] Conexão com banco testada
- [ ] Dados de seed criados (se desejado)
- [ ] `npm run dev` rodando em http://localhost:3000
- [ ] Login em http://localhost:3000/admin/login funcionando

---

## 📞 Próximas Etapas

1. **Modificar credenciais de desenvolvimento** (senha padrão)
2. **Configurar variáveis de produção** quando necessário
3. **Implementar novos recursos** conforme planejado
4. **Configurar CI/CD** para deployment automático

---

## 📚 Documentação Adicional

- [Plano de Implementação](../Docs/Plano-Implementacao-Sistema.md)
- [Estrutura do Projeto](./ESTRUTURA-PROJETO.md)
- [Changelog](./CHANGELOG.md)
- [README Principal](./README.md)

---

**Última atualização**: 27 de Janeiro de 2025
**Versão**: 0.4.0

