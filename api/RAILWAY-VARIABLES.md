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
| **`JWT_SECRET`** | *(gere uma chave forte e única; ex.: `openssl rand -base64 48`)* |
| **`JWT_EXPIRES_IN`** | `7d` |
| **`CORS_ORIGINS`** | `https://avoarturismo.up.railway.app` |
| **`API_BASE_URL`** | `https://avoarturismo.up.railway.app` |

**Importante:** gere uma **JWT_SECRET** forte e única (ex.: `openssl rand -base64 48`). Nunca commite o valor real no repositório.

---

## 4. Colar no Raw Editor

No **avsite** → **Variables** → **"{} Raw Editor"**, você pode colar:

```env
NODE_ENV=production
JWT_SECRET=<gere-uma-chave-forte-ex-openssl-rand-base64-48>
JWT_EXPIRES_IN=7d
CORS_ORIGINS=https://avoarturismo.up.railway.app
API_BASE_URL=https://avoarturismo.up.railway.app
```

**Não inclua `DATABASE_URL`** — ela é criada quando você clica em **"Trying to connect a database? Add Variable"** e escolhe o **psql-site**.

---

## 5. Google OAuth (Login com Google do cliente)

Para o botão **"Continuar com Google"** na página de login do cliente funcionar em produção, configure:

### Variáveis no Railway (avsite → Variables)

| Variável | Valor |
|----------|--------|
| **`GOOGLE_CLIENT_ID`** | ID do cliente OAuth (ex.: `xxxxx.apps.googleusercontent.com`) |
| **`GOOGLE_CLIENT_SECRET`** | Secret do cliente OAuth |
| **`GOOGLE_REDIRECT_URI`** | `https://avoarturismo.up.railway.app/api/cliente/auth/google/callback` |
| **`FRONTEND_URL`** | `https://avoarturismo.up.railway.app` |

**Sem essas 4 variáveis**, a API responde com `"Google OAuth não configurado no servidor"` ao acessar `/api/cliente/auth/google`.

### Como obter Client ID e Secret (Google Cloud Console)

1. Acesse [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Crie um projeto ou selecione um existente.
3. Em **APIs e serviços** → **Credenciais** → **Criar credenciais** → **ID do cliente OAuth**.
4. Tipo de aplicativo: **Aplicativo da Web**.
5. Em **URIs de redirecionamento autorizados**, adicione **exatamente**:
   ```text
   https://avoarturismo.up.railway.app/api/cliente/auth/google/callback
   ```
6. Salve e copie o **ID do cliente** e o **Segredo do cliente** para as variáveis `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no Railway.

Depois de salvar as variáveis no Railway, faça um novo deploy do **avsite**.

---

## 6. E-mail via API Brevo (Plano Hobby — SMTP bloqueado)

O plano Hobby do Railway **bloqueia SMTP**. Use a API HTTPS do Brevo em vez de SMTP.

### Variáveis no Railway (avsite → Variables)

| Variável | Valor |
|----------|--------|
| **`BREVO_API_KEY`** | Chave API do Brevo (obtenha em [app.brevo.com/settings/keys/api](https://app.brevo.com/settings/keys/api)) |
| **`BREVO_FROM_NAME`** | `Avoar Turismo` |
| **`BREVO_FROM_EMAIL`** | `contato@avoarturismo.com.br` |

**Importante:** O e-mail em `BREVO_FROM_EMAIL` deve ser um **remetente verificado** no Brevo (Remetentes e Domínios). O domínio `avoarturismo.com.br` deve estar autenticado.

**Nunca** commite a `BREVO_API_KEY` no repositório. Configure apenas nas Variables do Railway.

---

## 7. Ordem sugerida

1. Clicar em **"Trying to connect a database? Add Variable"** → selecionar **psql-site** (assim a `DATABASE_URL` é configurada).
2. Adicionar as variáveis da tabela acima (ou colar o bloco do Raw Editor).
3. Se quiser login com Google: adicionar `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` e `FRONTEND_URL` (ver seção 5).
4. **E-mail:** adicionar `BREVO_API_KEY`, `BREVO_FROM_NAME`, `BREVO_FROM_EMAIL` (ver seção 6).
5. Salvar e dar **Deploy** de novo no **avsite**.

---

## 8. Checklist

- [ ] **Database:** clique em "Trying to connect a database? Add Variable" e escolha **psql-site**
- [ ] **`DATABASE_URL`** existe em "8 variables added by Railway" (após conectar o DB)
- [ ] **`NODE_ENV`** = `production`
- [ ] **`JWT_SECRET`** = a chave acima
- [ ] **`CORS_ORIGINS`** = `https://avoarturismo.up.railway.app` (com `https://`)
- [ ] **`API_BASE_URL`** = `https://avoarturismo.up.railway.app`
- [ ] **Login com Google (opcional):** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `FRONTEND_URL` (ver seção 5)
- [ ] **E-mail Brevo:** `BREVO_API_KEY`, `BREVO_FROM_NAME`, `BREVO_FROM_EMAIL` (ver seção 6)
- [ ] Novo deploy do **avsite** após salvar as variáveis
