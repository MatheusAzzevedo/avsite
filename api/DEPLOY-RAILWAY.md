# Guia de Deploy no Railway

Este guia explica como fazer o deploy da API Avorar no Railway.

## ⚠️ Passo 0: Definir Root Directory (obrigatório)

O repositório tem a API dentro da pasta **`api/`**. Se o Railway usar a raiz do repo, o build falha com:

```
✖ Railpack could not determine how to build the app.
```

**Solução:** definir o **Root Directory** do serviço **avsite** como **`api`**.

1. Abra o projeto no Railway.
2. Clique no serviço **avsite**.
3. Vá em **Settings**.
4. Em **Root Directory**, clique em **"Add Root Directory"** (ou **"Root Directory"**).
5. Digite **`api`** e salve.

A partir daí, o build e o deploy passam a rodar dentro de `api/` (onde estão `package.json`, `Procfile`, etc.).

---

## 1. Conectar o banco (Database)

1. Em **Variables** do **avsite**, clique em **"Trying to connect a database? Add Variable"**.
2. Selecione o **psql-site** e confirme.
3. O Railway cria a **`DATABASE_URL`** automaticamente. Não precisa preencher à mão.

Consulte **`RAILWAY-VARIABLES.md`** para o resto das variáveis (`JWT_SECRET`, `CORS_ORIGINS`, etc.).

---

## 2. Build e Start (automáticos)

Com o Root Directory = `api`:

- **Build (Railpack):** detecta Node, roda `npm install` → `postinstall` (prisma generate) → `npm run build`.
- **Start (Procfile):** `npx prisma db push && npm start`.

O `prisma db push` aplica o schema no PostgreSQL a cada deploy. Não é necessário rodar `prisma db push` manualmente antes do primeiro deploy.

---

## 3. Seed (opcional, primeiro deploy)

Para criar o admin e dados iniciais:

```bash
# Instalar CLI (se ainda não tiver)
npm i -g @railway/cli

# Login e linkar ao projeto
railway login
railway link

# Rodar seed
railway run npm run seed
```

Isso cria o usuário **admin@avorar.com** / **admin123**, excursões e posts de exemplo.

---

## 4. Verificar o deploy

Acesse:

```
https://avoarturismo.up.railway.app/api/health
```

(Substitua pela URL real do seu serviço se for diferente.)

Resposta esperada:

```json
{
  "status": "ok",
  "message": "API Avorar Turismo funcionando!",
  "timestamp": "...",
  "version": "1.0.0"
}
```

---

## 5. Resumo do fluxo

1. **Root Directory** = `api` (Settings do **avsite**).
2. **Database:** "Add Variable" → **psql-site** (gera `DATABASE_URL`).
3. **Variáveis:** `NODE_ENV`, `JWT_SECRET`, `CORS_ORIGINS`, `API_BASE_URL` — ver **`RAILWAY-VARIABLES.md`**.
4. **Deploy** (ou redeploy) do **avsite**.
5. (Opcional) `railway run npm run seed` para popular o banco.

---

## Troubleshooting

### "Railpack could not determine how to build the app"

- Confirme que **Root Directory** = **`api`** no serviço **avsite**.

### Erro de conexão com o banco

- Verifique se o **psql-site** foi conectado via **"Add Variable"** e se **`DATABASE_URL`** aparece nas variáveis.

### Erro de CORS

- Use **`https://`** em **`CORS_ORIGINS`**, por exemplo:  
  `https://avoarturismo.up.railway.app`

---

**Última atualização:** Janeiro 2026
