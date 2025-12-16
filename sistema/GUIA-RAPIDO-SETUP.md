# ⚡ Guia Rápido de Setup - 5 Minutos

## 🎯 Objetivo
Configurar o projeto Avoar Sistema para desenvolvimento local

---

## 📦 Passo 1: Dependências já instaladas ✅

```bash
# ✅ 552 packages instalados com sucesso!
```

---

## 🗄️ Passo 2: Configurar PostgreSQL (2 min)

### Windows
1. Instale [PostgreSQL](https://www.postgresql.org/download/windows/)
2. Anote a senha do usuário `postgres`
3. Mantenha porta padrão `5432`

### macOS
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Linux (Ubuntu)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

---

## 🔧 Passo 3: Criar Banco de Dados (1 min)

```bash
# Em qualquer terminal, conecte como admin
psql -U postgres

# Dentro do psql, execute:
CREATE DATABASE avoar_db;
\q
```

---

## 📄 Passo 4: Criar .env.local (1 min)

Na pasta `sistema/`, crie arquivo `.env.local`:

```ini
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=avoar_db
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/avoar_db
JWT_SECRET=seu-secret-key-super-seguro-mude-em-producao
NODE_ENV=development
```

---

## 📚 Passo 5: Criar Tabelas (1 min)

```bash
cd sistema

# Windows
psql -U postgres -d avoar_db -f lib/db/schema.sql

# macOS/Linux
psql -U postgres -d avoar_db < lib/db/schema.sql
```

---

## ✅ Passo 6: Testar Conexão (1 min)

```bash
cd sistema
npx ts-node lib/db/test-connection.ts
```

**Esperado:**
```
✅ Conexão bem-sucedida!
⏰ Hora do servidor: 2025-01-27T14:30:45.123Z
📋 Tabelas existentes:
   - users
   - blog_posts
   - excursoes
   - payment_config
```

---

## 🚀 Passo 7: Rodar Projeto

```bash
cd sistema
npm run dev
```

**Acesse:** http://localhost:3000

---

## 🔐 Login Padrão (Opcional)

Se quiser dados de exemplo:

```bash
node seed-db.js
```

**Credenciais:**
- Email: `admin@avoar.com.br`
- Senha: `Admin@123456`

**Acesse:** http://localhost:3000/admin/login

---

## 📋 Verificação Final

- [ ] Node.js instalado
- [ ] PostgreSQL rodando
- [ ] Banco `avoar_db` criado
- [ ] `.env.local` configurado
- [ ] Schema SQL executado
- [ ] Conexão testada
- [ ] `npm run dev` rodando
- [ ] http://localhost:3000 funcionando

---

## 🐛 Troubleshooting Rápido

| Erro | Solução |
|------|---------|
| ECONNREFUSED | PostgreSQL não está rodando |
| "database does not exist" | Execute: `psql -U postgres -c "CREATE DATABASE avoar_db;"` |
| "password authentication failed" | Mude senha em `.env.local` |
| "Cannot find module" | Execute: `npm install` |
| Porta 3000 em uso | Use: `npm run dev -- -p 3001` |

---

## 📞 Próximos Passos

1. **Modificar senha admin** após primeiro login
2. **Explorar dashboard** em `/admin/dashboard`
3. **Criar primeiro post** em `/admin/blog`
4. **Gerenciar excursões** em `/admin/excursoes`

---

## 📚 Documentação Completa

- Configuração Avançada: `CONFIGURACAO-SETUP.md`
- Produção: `CONFIGURACAO-PRODUCAO.md`
- Estrutura: `ESTRUTURA-PROJETO.md`
- Changelog: `CHANGELOG.md`

---

**Duração total: ~10 minutos** ⏱️

