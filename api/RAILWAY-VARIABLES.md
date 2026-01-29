# Variáveis do Railway – Projeto avsite (Avoar)

**URL do site:** `https://avoarturismo.up.railway.app`

---

## 1. Como conectar o banco (Database)

O **psql-site** já está no projeto. Para o **avsite** usar o PostgreSQL:

1. Com o serviço **avsite** aberto, vá na aba **Variables**.
2. Clique no link **"Trying to connect a database? Add Variable"**.
3. Selecione o **psql-site** e confirme.

O Railway vai criar e preencher sozinho a **`DATABASE_URL`** (e outras vars do Postgres) no **avsite**. Não precisa copiar connection string manualmente.

Depois, expanda **"> 8 variables added by Railway"** e confira se **`DATABASE_URL`** está lá.

---

## 2. CORS_ORIGINS — use com `https://`

**Errado:** `avoarturismo.up.railway.app`  
**Certo:** `https://avoarturismo.up.railway.app`

Sempre use o protocolo `https://` na frente. Pode ter mais de uma origem separada por vírgula, por exemplo:

```
https://avoarturismo.up.railway.app,https://www.avoarturismo.up.railway.app
```

---

## 3. Variáveis para você adicionar

Use **"+ New Variable"** ou **"{} Raw Editor"** e configure:

| Variável | Valor |
|----------|--------|
| **`NODE_ENV`** | `production` |
| **`JWT_SECRET`** | `CHqesEH3XkaMypjQRyl5jfAp8Mmz1aBme7yMvQadiIr9hsIo/sa+HCkxp9E7dYCH` |
| **`JWT_EXPIRES_IN`** | `7d` |
| **`CORS_ORIGINS`** | `https://avoarturismo.up.railway.app` |
| **`API_BASE_URL`** | `https://avoarturismo.up.railway.app` |

**Importante:** use essa **JWT_SECRET** só neste projeto e não compartilhe. Em produção, o ideal é gerar uma nova chave e trocar.

---

## 4. Colar no Raw Editor

No **avsite** → **Variables** → **"{} Raw Editor"**, você pode colar:

```env
NODE_ENV=production
JWT_SECRET=CHqesEH3XkaMypjQRyl5jfAp8Mmz1aBme7yMvQadiIr9hsIo/sa+HCkxp9E7dYCH
JWT_EXPIRES_IN=7d
CORS_ORIGINS=https://avoarturismo.up.railway.app
API_BASE_URL=https://avoarturismo.up.railway.app
```

**Não inclua `DATABASE_URL`** — ela é criada quando você clica em **"Trying to connect a database? Add Variable"** e escolhe o **psql-site**.

---

## 5. Ordem sugerida

1. Clicar em **"Trying to connect a database? Add Variable"** → selecionar **psql-site** (assim a `DATABASE_URL` é configurada).
2. Adicionar as variáveis da tabela acima (ou colar o bloco do Raw Editor).
3. Salvar e dar **Deploy** de novo no **avsite**.

---

## 6. Checklist

- [ ] **Database:** clique em "Trying to connect a database? Add Variable" e escolha **psql-site**
- [ ] **`DATABASE_URL`** existe em "8 variables added by Railway" (após conectar o DB)
- [ ] **`NODE_ENV`** = `production`
- [ ] **`JWT_SECRET`** = a chave acima
- [ ] **`CORS_ORIGINS`** = `https://avoarturismo.up.railway.app` (com `https://`)
- [ ] **`API_BASE_URL`** = `https://avoarturismo.up.railway.app`
- [ ] Novo deploy do **avsite** após salvar as variáveis
