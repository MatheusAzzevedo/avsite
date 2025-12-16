# 🚀 Guia de Configuração - Fase 1

## Setup Inicial do Projeto Next.js

### 1️⃣ Instalação de Dependências

```bash
cd sistema
npm install
```

### 2️⃣ Configurar Variáveis de Ambiente

O arquivo `.env.local` já foi criado com as credenciais do PostgreSQL:

```
DB_USER=postgres
DB_PASSWORD=MQiRmZJvxxAbbgOBrIvvYtHfkeuTNpjH
DB_HOST=postgres.railway.internal
DB_PORT=5432
DB_NAME=railway
DATABASE_URL=postgresql://postgres:MQiRmZJvxxAbbgOBrIvvYtHfkeuTNpjH@yamanote.proxy.rlwy.net:13538/railway
JWT_SECRET=sua-secret-key-super-segura-mude-em-producao
```

⚠️ **Altere o JWT_SECRET em produção!**

### 3️⃣ Criar as Tabelas no Banco de Dados

Execute o script SQL para criar a estrutura do banco:

```bash
# Opção 1: Usar psql (se instalado localmente)
psql -h postgres.railway.internal -U postgres -d railway < lib/db/schema.sql

# Opção 2: Usar o painel do Railway
# - Acesse https://railway.app/dashboard
# - Vá para PostgreSQL > Query Editor
# - Cole o conteúdo de lib/db/schema.sql
# - Execute
```

### 4️⃣ Testar a Conexão

```bash
npx ts-node lib/db/test-connection.ts
```

Saída esperada:
```
✅ Conexão bem-sucedida!
⏰ Hora do servidor: 2025-12-14T10:30:45.123Z
📋 Tabelas existentes:
   - users
   - blog_posts
   - excursoes
   - payment_config
```

### 5️⃣ Executar o Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## 📁 Estrutura Criada

```
sistema/
├── app/
│   ├── layout.tsx          # Layout raiz
│   ├── page.tsx            # HomePage
│   ├── globals.css         # Estilos globais
│   ├── admin/              # Rotas admin (a implementar)
│   └── api/                # APIs (a implementar)
├── components/
│   ├── admin/              # Componentes de admin
│   └── shared/             # Componentes compartilhados
├── lib/
│   ├── db/
│   │   ├── index.ts        # Conexão PostgreSQL
│   │   ├── schema.sql      # DDL das tabelas
│   │   └── test-connection.ts
│   ├── auth.ts             # Utilitários JWT e bcrypt
│   ├── validation.ts       # Schemas Zod
│   └── utils.ts            # Funções auxiliares
├── public/                 # Assets estáticos
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.ts
├── .env.local              # Variáveis de ambiente
├── README.md
└── CHANGELOG.md
```

## 📚 Dependências Instaladas

- **next**: Framework React
- **react**: Biblioteca UI
- **typescript**: Type safety
- **tailwindcss**: Estilização
- **zod**: Validação de dados
- **bcryptjs**: Hashing de senhas
- **jsonwebtoken**: Tokens JWT
- **pg**: Driver PostgreSQL
- **sharp**: Otimização de imagens

## ✅ Fase 1 Concluída

Você completou com sucesso:
- ✅ Criação do projeto Next.js com TypeScript
- ✅ Configuração de banco de dados PostgreSQL
- ✅ Schemas Zod para validação
- ✅ Setup JWT e utilitários de autenticação
- ✅ Estrutura de pastas e arquivos

## 🔄 Próximos Passos

Próxima fase: **Fase 2 - Sistema de Autenticação**
- [ ] Página de login (/admin/login)
- [ ] API de login/logout
- [ ] Middleware de proteção de rotas
- [ ] Dashboard admin

## 🐛 Troubleshooting

### Erro: "ECONNREFUSED" ao conectar no banco
- Verifique se o host/porta estão corretos
- Verifique a senha
- Teste via `psql` ou pgAdmin

### Erro: "Cannot find module 'pg'"
- Execute: `npm install pg @types/pg`

### Erro: "ValidationError" no Zod
- Verifique se os dados estão no formato esperado
- Veja `lib/validation.ts` para saber os schemas

## 📞 Suporte

Para dúvidas ou erros, verifique:
1. As regras em `.cursor/rules/`
2. O plano em `Docs/Plano-Implementacao-Sistema.md`
3. Este guia
