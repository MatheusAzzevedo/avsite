# 🚀 PRÓXIMOS PASSOS - Configuração Banco de Dados

## ⚡ Tudo está pronto, agora execute:

### Passo 1: Abra o Terminal/PowerShell

Na pasta `sistema/`:

```bash
cd C:\Users\liane\Documents\M\Avoar Site\sistema
```

---

### Passo 2: Criar Banco de Dados

**Windows (PowerShell ou CMD):**
```powershell
psql -U postgres -c "CREATE DATABASE avoar_db;"
```

**macOS/Linux:**
```bash
psql -U postgres -c "CREATE DATABASE avoar_db;"
```

**Esperado:**
```
CREATE DATABASE
```

---

### Passo 3: Criar Tabelas

**Windows:**
```powershell
psql -U postgres -d avoar_db -f lib/db/schema.sql
```

**macOS/Linux:**
```bash
psql -U postgres -d avoar_db < lib/db/schema.sql
```

**Esperado:**
```
CREATE EXTENSION
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE OR REPLACE FUNCTION
CREATE TRIGGER
CREATE TRIGGER
CREATE TRIGGER
CREATE TRIGGER
```

---

### Passo 4: Testar Conexão

```bash
npx ts-node lib/db/test-connection.ts
```

**Esperado:**
```
✅ Conexão bem-sucedida!
⏰ Hora do servidor: 2025-01-27T...
📋 Tabelas existentes:
   - users
   - blog_posts
   - excursoes
   - payment_config
```

---

### Passo 5: (Opcional) Criar Dados de Exemplo

```bash
node seed-db.js
```

**Esperado:**
```
✅ Admin user criado com sucesso!
📧 Email: admin@avoar.com.br
🔐 Senha: Admin@123456
```

---

### Passo 6: Rodar o Projeto

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

✓ Ready in 2.5s
```

---

### Passo 7: Acessar no Navegador

Abra: **http://localhost:3000**

---

## ✅ Checklist

- [ ] Banco `avoar_db` criado
- [ ] Schema SQL executado
- [ ] Conexão testada com sucesso
- [ ] (Opcional) Dados de seed criados
- [ ] `npm run dev` rodando
- [ ] http://localhost:3000 acessível

---

## 🔐 Login Admin (se executou seed)

**URL:** http://localhost:3000/admin/login

```
Email: admin@avoar.com.br
Senha: Admin@123456
```

---

## 🎯 O que você pode fazer agora:

- ✅ Acessar dashboard administrativo
- ✅ Criar posts de blog
- ✅ Gerenciar excursões
- ✅ Ver páginas públicas
- ✅ Testar APIs
- ✅ Customizar conforme necessário

---

## 📚 Documentação Completa

Se precisar de mais detalhes:

1. **`GUIA-RAPIDO-SETUP.md`** - Visão geral rápida
2. **`CONFIGURACAO-SETUP.md`** - Todas as opções
3. **`RESUMO-CONFIGURACAO.md`** - O que foi feito
4. **`CHECKLIST-SETUP.md`** - Status completo
5. **`README.md`** - Informações gerais

---

## 🐛 Se der Erro:

### "psql: command not found"
PostgreSQL não está no PATH. Instale em: https://www.postgresql.org/download/

### "password authentication failed"
Verifique a senha em `.env.local` (padrão: postgres)

### "connection refused"
PostgreSQL não está rodando. Inicie o serviço.

### "database "avoar_db" already exists"
Banco já existe. Pule para Passo 4.

### "Error: spawn psql ENOENT"
Não tem PostgreSQL instalado ou não está no PATH.

---

## 💾 Importante

- **Nunca commite `.env.local`** - está protegido no `.gitignore`
- **Mude a senha padrão** em produção
- **Mude o JWT_SECRET** em produção
- **Faça backups** regularmente do banco

---

## 🎉 Pronto!

Você agora tem um ambiente **100% configurado** e **pronto para desenvolvimento**!

### Tempo estimado: 5-10 minutos

Comece pelos 7 passos acima e você estará rodando!

---

**Boa sorte! 🚀**

Data: 27 de Janeiro de 2025

